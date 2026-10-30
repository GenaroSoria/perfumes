import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { crearApp } from '../src/app.js';
import { crearLibro, leerFilas } from '../src/db/excel.js';
import { COLUMNAS_PRODUCTOS } from '../src/db/esquema.js';

let dir;
let app;
let mp;

const PRODUCTOS = [
  { id: 'A', nombre: 'Lavanda', precio: 1000, stock: 5, imagen_url: 'a.jpg', activo: 'si' },
  { id: 'B', nombre: 'Coco', precio: 2500, stock: 1, imagen_url: 'https://img.test/b.jpg', activo: 'si' },
  { id: 'C', nombre: 'Oculto', precio: 900, stock: 9, imagen_url: 'c.jpg', activo: 'no' },
  { id: 'D', nombre: 'Sin foto', precio: 900, stock: 9, activo: 'si' },
  { id: 'E', nombre: 'Sin precio', stock: 9, imagen_url: 'e.jpg', activo: 'si' },
  { id: 'F', categoria: 'Perfumes', nombre: 'Chicle', presentacion: '125 cc', precio: 2500, precio_mayor: 2000, mayor_desde: 6, stock: 20, imagen_url: 'f.jpg', activo: 'si' },
  { id: 'G', categoria: 'Perfumes', nombre: 'Uva', presentacion: '125 cc', precio: 2500, precio_mayor: 2000, mayor_desde: 6, stock: 20, imagen_url: 'g.jpg', activo: 'si' },
  { id: 'H', categoria: 'Perfumes', nombre: 'Uva', presentacion: '250 cc', precio: 3500, precio_mayor: 3000, stock: 20, imagen_url: 'h.jpg', activo: 'si' },
  { id: 'P1', categoria: 'Perfumes para ropa', nombre: 'Perfume textil Coco', presentacion: '125 cc', precio: 2500, stock: 3, activo: 'si' },
  { id: 'P2', categoria: 'Perfumes para ropa', nombre: 'Perfume textil Coco', presentacion: '250 cc', precio: 3500, stock: 3, activo: 'si' },
];

const CLIENTE = { nombre: 'Ana', email: 'ana@example.com', telefono: '1155556666' };
const RETIRO = { metodo: 'retiro' };

beforeEach(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), 'tienda-'));
  await crearLibro(path.join(dir, 'productos.xlsx'), 'productos', COLUMNAS_PRODUCTOS, PRODUCTOS);
  mp = {
    crearPreferencia: vi.fn(async () => ({ id: 'pref-1', init_point: 'https://mp.test/checkout' })),
    obtenerPago: vi.fn(),
  };
  app = crearApp({
    config: { dataDir: dir, clientUrl: 'http://localhost:5173', publicUrl: '', whatsapp: '549111', instagram: 'tienda', nombreTienda: 'Tienda', portada: [] },
    mp,
  });
});
afterEach(() => fs.rm(dir, { recursive: true, force: true }));

const pedidosEnExcel = () => leerFilas(path.join(dir, 'pedidos.xlsx'), 'pedidos');
const stockDe = async (id) =>
  (await leerFilas(path.join(dir, 'productos.xlsx'), 'productos')).find((p) => p.id === id).stock;

describe('GET /api/productos', () => {
  it('lista solo productos activos', async () => {
    const res = await request(app).get('/api/productos').expect(200);
    expect(res.body.map((p) => p.id)).toEqual(['A', 'B', 'F', 'G', 'H', 'P1']);
  });

  it('404 para un producto inactivo', async () => {
    await request(app).get('/api/productos/C').expect(404);
  });

  it('agrupa los perfumes textiles en una tarjeta con sus tamaños (aunque no tengan foto)', async () => {
    const lista = (await request(app).get('/api/productos').expect(200)).body;
    expect(lista.find((p) => p.id === 'P1').variantes.map((v) => v.presentacion)).toEqual(['125 cc', '250 cc']);
    const res = await request(app).get('/api/productos/P2').expect(200);
    expect(res.body.variantes.map((v) => v.id)).toEqual(['P1', 'P2']);
  });

  it('oculta los productos sin foto o sin precio', async () => {
    await request(app).get('/api/productos/D').expect(404);
    await request(app).get('/api/productos/E').expect(404);
  });
});

describe('POST /api/checkout', () => {
  it('calcula el total con los precios del Excel e ignora los del cliente', async () => {
    const res = await request(app).post('/api/checkout').send({
      cliente: CLIENTE,
      entrega: RETIRO,
      items: [{ id: 'A', cantidad: 2, precio: 1 }, { id: 'B', cantidad: 1, precio: 1 }],
    }).expect(201);

    expect(res.body.total).toBe(4500);
    expect(res.body.initPoint).toBe('https://mp.test/checkout');
    const pref = mp.crearPreferencia.mock.calls[0][0];
    expect(pref.items.map((i) => i.unit_price)).toEqual([1000, 2500]);
    expect(pref.external_reference).toBe(res.body.pedidoId);

    const [pedido] = await pedidosEnExcel();
    expect(pedido).toMatchObject({ id: res.body.pedidoId, total: 4500, estado: 'pendiente', metodo_entrega: 'retiro' });
  });

  it('aplica el precio por mayor sumando fragancias de la misma presentación', async () => {
    const comprar = (items) => request(app).post('/api/checkout').send({ cliente: CLIENTE, entrega: RETIRO, items }).expect(201);

    // 3 + 3 de 125 cc = 6: por mayor. Los 5 de 250 cc no llegan (se cuentan aparte, mínimo 6 por defecto).
    let res = await comprar([{ id: 'F', cantidad: 3 }, { id: 'G', cantidad: 3 }, { id: 'H', cantidad: 5 }]);
    expect(res.body.total).toBe(6 * 2000 + 5 * 3500);

    // 3 + 2 = 5: precio normal.
    res = await comprar([{ id: 'F', cantidad: 3 }, { id: 'G', cantidad: 2 }]);
    expect(res.body.total).toBe(5 * 2500);
  });

  it('rechaza si no hay stock suficiente', async () => {
    const res = await request(app).post('/api/checkout')
      .send({ cliente: CLIENTE, entrega: RETIRO, items: [{ id: 'B', cantidad: 2 }] }).expect(400);
    expect(res.body.error).toMatch(/stock/);
    expect(mp.crearPreferencia).not.toHaveBeenCalled();
  });

  it('exige dirección para envíos', async () => {
    await request(app).post('/api/checkout')
      .send({ cliente: CLIENTE, entrega: { metodo: 'andreani' }, items: [{ id: 'A', cantidad: 1 }] }).expect(400);

    await request(app).post('/api/checkout').send({
      cliente: CLIENTE,
      entrega: { metodo: 'andreani', direccion: { calle: 'Mitre', numero: '100', ciudad: 'Rosario', provincia: 'Santa Fe', cp: '2000' } },
      items: [{ id: 'A', cantidad: 1 }],
    }).expect(201);
    const [pedido] = await pedidosEnExcel();
    expect(pedido.direccion).toBe('Mitre 100, Rosario, Santa Fe (CP 2000)');
  });

  it('no permite comprar productos inactivos', async () => {
    await request(app).post('/api/checkout')
      .send({ cliente: CLIENTE, entrega: RETIRO, items: [{ id: 'C', cantidad: 1 }] }).expect(400);
  });
});

describe('POST /api/webhooks/mercadopago', () => {
  async function crearPedido() {
    const res = await request(app).post('/api/checkout')
      .send({ cliente: CLIENTE, entrega: RETIRO, items: [{ id: 'A', cantidad: 2 }] }).expect(201);
    return res.body.pedidoId;
  }

  it('aprueba el pedido y descuenta stock una sola vez', async () => {
    const pedidoId = await crearPedido();
    mp.obtenerPago.mockResolvedValue({ id: 999, status: 'approved', external_reference: pedidoId, transaction_amount: 2000 });

    const notificacion = { type: 'payment', data: { id: '999' } };
    await request(app).post('/api/webhooks/mercadopago').send(notificacion).expect(200);
    await request(app).post('/api/webhooks/mercadopago').send(notificacion).expect(200);

    expect(mp.obtenerPago).toHaveBeenCalledWith('999');
    const [pedido] = await pedidosEnExcel();
    expect(pedido).toMatchObject({ estado: 'approved', mp_payment_id: '999' });
    expect(await stockDe('A')).toBe(3);
  });

  it('acepta el formato IPN por query string', async () => {
    const pedidoId = await crearPedido();
    mp.obtenerPago.mockResolvedValue({ id: 5, status: 'rejected', external_reference: pedidoId, transaction_amount: 2000 });
    await request(app).post('/api/webhooks/mercadopago?topic=payment&id=5').expect(200);
    const [pedido] = await pedidosEnExcel();
    expect(pedido.estado).toBe('rejected');
    expect(await stockDe('A')).toBe(5);
  });

  it('marca para revisar si el monto pagado es menor al total', async () => {
    const pedidoId = await crearPedido();
    mp.obtenerPago.mockResolvedValue({ id: 7, status: 'approved', external_reference: pedidoId, transaction_amount: 10 });
    await request(app).post('/api/webhooks/mercadopago').send({ type: 'payment', data: { id: '7' } }).expect(200);
    const [pedido] = await pedidosEnExcel();
    expect(pedido.estado).toBe('revisar_monto');
    expect(await stockDe('A')).toBe(5);
  });

  it('ignora notificaciones que no son de pagos', async () => {
    await request(app).post('/api/webhooks/mercadopago').send({ type: 'merchant_order', data: { id: '1' } }).expect(200);
    expect(mp.obtenerPago).not.toHaveBeenCalled();
  });
});

describe('GET /api/config', () => {
  it('devuelve los párrafos de quienes-somos.txt sin los comentarios', async () => {
    await fs.writeFile(path.join(dir, 'quienes-somos.txt'), '# comentario\nPrimer párrafo\nsigue acá.\n\nSegundo.\n');
    const res = await request(app).get('/api/config').expect(200);
    expect(res.body.quienesSomos).toEqual(['Primer párrafo sigue acá.', 'Segundo.']);
    expect(res.body.local).toBeNull();
  });

  it('incluye el local solo si tiene dirección', async () => {
    const conLocal = crearApp({
      config: { dataDir: dir, portada: [], local: { direccion: 'Calle 1 123, Lanús', horarios: 'Lun a Vie', comoLlegar: '' } },
      mp,
    });
    const res = await request(conLocal).get('/api/config').expect(200);
    expect(res.body.local.direccion).toBe('Calle 1 123, Lanús');
    expect(res.body.quienesSomos).toEqual([]);
  });
});
