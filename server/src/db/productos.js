import fs from 'node:fs/promises';
import path from 'node:path';
import { actualizarFilas, leerFilas } from './excel.js';
import { ARCHIVO_PRODUCTOS, HOJA_PRODUCTOS } from './esquema.js';

const NO_ACTIVO = new Set(['no', 'false', '0', 'n']);

// En la web solo se muestran (y se venden) los productos activos que ya tienen precio y foto.
// Las filas sin precio se descartan en normalizar(). Estas categorías se muestran aunque no tengan foto.
const CATEGORIAS_SIN_FOTO = new Set(['Perfumes para ropa']);
const visible = (p) => p.activo && (Boolean(p.imagen) || CATEGORIAS_SIN_FOTO.has(p.categoria));

function normalizar(fila) {
  const id = String(fila.id ?? '').trim();
  const nombre = String(fila.nombre ?? '').trim();
  const precio = Number(fila.precio);
  if (!id || !nombre || !Number.isFinite(precio) || precio <= 0) return null;
  const imagen = String(fila.imagen_url ?? '').trim();
  // Precio por mayor: solo si es un número menor al precio normal. Por defecto, desde 6 unidades.
  const precioMayor = Number(fila.precio_mayor);
  const mayorDesde = Math.floor(Number(fila.mayor_desde));
  const conMayor = Number.isFinite(precioMayor) && precioMayor > 0 && precioMayor < precio;
  return {
    id,
    nombre,
    categoria: String(fila.categoria ?? '').trim(),
    presentacion: String(fila.presentacion ?? '').trim(),
    descripcion: String(fila.descripcion ?? '').trim(),
    aroma: String(fila.aroma ?? '').trim(),
    precio,
    precio_mayor: conMayor ? precioMayor : null,
    mayor_desde: conMayor ? (mayorDesde >= 2 ? mayorDesde : 6) : null,
    stock: Math.max(0, Math.floor(Number(fila.stock) || 0)),
    // imagen_url puede ser una URL completa o el nombre de un archivo en data/imagenes
    imagen: !imagen ? null : /^https?:\/\//i.test(imagen) ? imagen : `/imagenes/${encodeURIComponent(imagen)}`,
    activo: !NO_ACTIVO.has(String(fila.activo ?? '').trim().toLowerCase()),
  };
}

export function crearRepoProductos(dataDir) {
  const archivo = path.join(dataDir, ARCHIVO_PRODUCTOS);
  // El dueño edita el Excel a mano: se relee cuando cambia la fecha de modificación.
  let cache = null;

  async function todos() {
    let stat;
    try {
      stat = await fs.stat(archivo);
    } catch (err) {
      if (err.code === 'ENOENT') throw new Error(`No existe ${archivo}. Correr "npm run setup-data".`);
      throw err;
    }
    if (!cache || cache.mtimeMs !== stat.mtimeMs) {
      const filas = await leerFilas(archivo, HOJA_PRODUCTOS);
      cache = { mtimeMs: stat.mtimeMs, productos: filas.map(normalizar).filter(Boolean) };
    }
    return cache.productos;
  }

  return {
    async listar() {
      return (await todos()).filter(visible);
    },

    async obtener(id) {
      return (await todos()).find((p) => visible(p) && p.id === String(id)) || null;
    },

    // items: [{ id, cantidad }]
    async descontarStock(items) {
      const porId = new Map(items.map((i) => [String(i.id), i.cantidad]));
      await actualizarFilas(archivo, HOJA_PRODUCTOS, (fila) => {
        const cantidad = porId.get(String(fila.id ?? '').trim());
        if (!cantidad) return null;
        return { stock: Math.max(0, (Number(fila.stock) || 0) - cantidad) };
      });
      cache = null;
    },
  };
}
