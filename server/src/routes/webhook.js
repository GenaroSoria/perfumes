import { Router } from 'express';

// Notificaciones de Mercado Pago. Llegan como webhook ({ type, data: { id } }) o como IPN
// (?topic=payment&id=...). Nunca se confía en el contenido: el pago se consulta en la API de MP.
export function rutasWebhook({ mp, pedidos, productos }) {
  const router = Router();

  router.post('/', async (req, res) => {
    const tipo = req.body?.type || req.query.type || req.query.topic;
    const pagoId = req.body?.data?.id || req.query['data.id'] || req.query.id;
    if (tipo !== 'payment' || !pagoId) return res.sendStatus(200);

    try {
      const pago = await mp.obtenerPago(pagoId);
      const pedidoId = pago.external_reference;
      const pedido = pedidoId && (await pedidos.obtener(pedidoId));
      if (!pedido) {
        console.warn(`Pago ${pagoId} sin pedido asociado (external_reference=${pedidoId})`);
        return res.sendStatus(200);
      }

      let estado = pago.status;
      if (estado === 'approved' && Number(pago.transaction_amount) + 0.01 < pedido.total) {
        console.warn(`Pago ${pagoId}: monto ${pago.transaction_amount} menor al total ${pedido.total} del pedido ${pedidoId}`);
        estado = 'revisar_monto';
      }

      const resultado = await pedidos.registrarPago(pedidoId, estado, pago.id);
      if (resultado?.aprobadoAhora) {
        try {
          await productos.descontarStock(resultado.pedido.items);
        } catch (err) {
          // El pago ya está registrado; el stock se corrige a mano si productos.xlsx estaba abierto.
          console.error(`Pedido ${pedidoId} aprobado pero no se pudo descontar stock:`, err.message);
        }
      }
      res.sendStatus(200);
    } catch (err) {
      console.error(`Error procesando notificación del pago ${pagoId}:`, err);
      res.sendStatus(500); // Mercado Pago reintenta
    }
  });

  return router;
}
