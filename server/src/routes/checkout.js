import { Router } from 'express';
import { buscarMetodo } from '../entregas.js';
import { asincrono, ErrorHttp } from '../http.js';
import { preciosUnitarios } from '../precios.js';

const texto = (v, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Mercado Pago no acepta localhost en notification_url ni en auto_return.
const esPublica = (url) => /^https:\/\//.test(url) && !/localhost|127\.0\.0\.1/.test(url);

function validarCliente(cliente = {}) {
  const datos = { nombre: texto(cliente.nombre), email: texto(cliente.email), telefono: texto(cliente.telefono, 40) };
  if (!datos.nombre) throw new ErrorHttp(400, 'Falta el nombre');
  if (!EMAIL.test(datos.email)) throw new ErrorHttp(400, 'El email no es válido');
  if (!datos.telefono) throw new ErrorHttp(400, 'Falta el teléfono');
  return datos;
}

function validarEntrega(entrega = {}) {
  const metodo = buscarMetodo(entrega.metodo);
  if (!metodo) throw new ErrorHttp(400, 'Elegí un método de entrega');
  if (!metodo.requiereDireccion) return { metodo, direccion: '' };
  const d = entrega.direccion || {};
  const campos = { calle: texto(d.calle), numero: texto(d.numero, 20), ciudad: texto(d.ciudad), provincia: texto(d.provincia), cp: texto(d.cp, 10) };
  const faltante = Object.entries(campos).find(([, v]) => !v);
  if (faltante) throw new ErrorHttp(400, `Falta completar la dirección (${faltante[0]})`);
  const notas = texto(d.notas);
  const direccion = `${campos.calle} ${campos.numero}, ${campos.ciudad}, ${campos.provincia} (CP ${campos.cp})${notas ? ` - ${notas}` : ''}`;
  return { metodo, direccion };
}

// Arma los ítems con precio y stock del Excel; del cliente solo se toman id y cantidad.
async function armarItems(itemsCliente, productos) {
  if (!Array.isArray(itemsCliente) || itemsCliente.length === 0) throw new ErrorHttp(400, 'El carrito está vacío');
  const cantidades = new Map();
  for (const item of itemsCliente) {
    const cantidad = Number(item?.cantidad);
    if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 99) throw new ErrorHttp(400, 'Cantidad inválida');
    const id = String(item.id);
    cantidades.set(id, (cantidades.get(id) || 0) + cantidad);
  }
  const lineas = [];
  for (const [id, cantidad] of cantidades) {
    const producto = await productos.obtener(id);
    if (!producto) throw new ErrorHttp(400, 'Uno de los productos del carrito ya no está disponible');
    // Hay productos con el mismo nombre en distintas presentaciones (¼ L, ½ L, 1 L...).
    const nombre = [producto.nombre, producto.presentacion].filter(Boolean).join(' ');
    if (producto.stock < cantidad) {
      throw new ErrorHttp(400, `No hay stock suficiente de "${nombre}" (quedan ${producto.stock})`);
    }
    lineas.push({ ...producto, nombre, cantidad });
  }
  const precios = preciosUnitarios(lineas);
  return lineas.map((l, i) => ({ id: l.id, nombre: l.nombre, precio: precios[i], cantidad: l.cantidad }));
}

export function rutasCheckout({ config, mp, productos, pedidos }) {
  const router = Router();

  router.post('/', asincrono(async (req, res) => {
    if (mp.disponible === false) throw new ErrorHttp(503, 'Los pagos online no están disponibles en este momento.');
    const cliente = validarCliente(req.body?.cliente);
    const { metodo, direccion } = validarEntrega(req.body?.entrega);
    const items = await armarItems(req.body?.items, productos);
    const total = items.reduce((s, i) => s + i.precio * i.cantidad, 0);

    const pedido = await pedidos.crear({ ...cliente, items, total, metodo_entrega: metodo.id, direccion });

    const volverA = (estado) => `${config.clientUrl}/pago/${estado}`;
    const preferencia = {
      items: items.map((i) => ({ id: i.id, title: i.nombre, quantity: i.cantidad, unit_price: i.precio, currency_id: 'ARS' })),
      payer: { name: cliente.nombre, email: cliente.email },
      external_reference: pedido.id,
      back_urls: { success: volverA('exito'), pending: volverA('pendiente'), failure: volverA('error') },
      ...(esPublica(config.clientUrl) && { auto_return: 'approved' }),
      ...(esPublica(config.publicUrl) && { notification_url: `${config.publicUrl}/api/webhooks/mercadopago` }),
    };

    let respuesta;
    try {
      respuesta = await mp.crearPreferencia(preferencia);
    } catch (err) {
      await pedidos.marcarError(pedido.id).catch(() => {});
      if (err.expose) throw err;
      console.error('Error creando preferencia de Mercado Pago:', err);
      throw new ErrorHttp(502, 'No se pudo iniciar el pago. Probá de nuevo en unos minutos.');
    }

    res.status(201).json({ pedidoId: pedido.id, total, initPoint: respuesta.init_point });
  }));

  return router;
}
