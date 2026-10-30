import { Router } from 'express';
import { asincrono, ErrorHttp } from '../http.js';

// Datos mínimos para la página de resultado del pago; no expone datos personales.
export function rutasPedidos({ pedidos }) {
  const router = Router();
  router.get('/:id', asincrono(async (req, res) => {
    const pedido = await pedidos.obtener(req.params.id);
    if (!pedido) throw new ErrorHttp(404, 'Pedido no encontrado');
    res.json({ id: pedido.id, estado: pedido.estado, total: pedido.total, metodo_entrega: pedido.metodo_entrega });
  }));
  return router;
}
