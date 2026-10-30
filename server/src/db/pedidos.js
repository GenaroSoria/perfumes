import crypto from 'node:crypto';
import path from 'node:path';
import { actualizarFilas, agregarFila, leerFilas } from './excel.js';
import { ARCHIVO_PEDIDOS, COLUMNAS_PEDIDOS, HOJA_PEDIDOS } from './esquema.js';

const nuevoId = () => crypto.randomBytes(4).toString('hex').toUpperCase();

function desdeFila(fila) {
  let items = [];
  try {
    items = JSON.parse(fila.items || '[]');
  } catch {
    // el dueño pudo haber editado la celda a mano
  }
  return { ...fila, id: String(fila.id), items, total: Number(fila.total) || 0 };
}

export function crearRepoPedidos(dataDir) {
  const archivo = path.join(dataDir, ARCHIVO_PEDIDOS);

  return {
    // datos: { nombre, email, telefono, items: [{ id, nombre, precio, cantidad }], total, metodo_entrega, direccion }
    async crear(datos) {
      const pedido = {
        id: nuevoId(),
        fecha: new Date().toISOString(),
        estado: 'pendiente',
        mp_payment_id: '',
        actualizado: '',
        ...datos,
      };
      await agregarFila(archivo, HOJA_PEDIDOS, COLUMNAS_PEDIDOS, { ...pedido, items: JSON.stringify(pedido.items) });
      return pedido;
    },

    async obtener(id) {
      let filas;
      try {
        filas = await leerFilas(archivo, HOJA_PEDIDOS);
      } catch (err) {
        if (err.code === 'ENOENT') return null;
        throw err;
      }
      const fila = filas.find((f) => String(f.id) === String(id));
      return fila ? desdeFila(fila) : null;
    },

    async marcarError(id) {
      await actualizarFilas(archivo, HOJA_PEDIDOS, (f) =>
        String(f.id) === id ? { estado: 'error_mp', actualizado: new Date().toISOString() } : null);
    },

    // Registra el estado informado por Mercado Pago. `aprobadoAhora` es true solo la primera vez
    // que el pedido pasa a "approved", para descontar stock una única vez aunque lleguen
    // notificaciones repetidas. Una notificación vieja de "pendiente" no pisa un "approved".
    async registrarPago(id, estado, paymentId) {
      let resultado = null;
      await actualizarFilas(archivo, HOJA_PEDIDOS, (fila) => {
        if (String(fila.id) !== String(id)) return null;
        const yaAprobado = fila.estado === 'approved';
        if (yaAprobado && ['approved', 'pending', 'in_process'].includes(estado)) {
          resultado = { pedido: desdeFila(fila), aprobadoAhora: false };
          return null;
        }
        resultado = { pedido: desdeFila({ ...fila, estado }), aprobadoAhora: estado === 'approved' };
        return { estado, mp_payment_id: String(paymentId), actualizado: new Date().toISOString() };
      });
      return resultado;
    },
  };
}
