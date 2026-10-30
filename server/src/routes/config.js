import { Router } from 'express';
import { METODOS_ENTREGA } from '../entregas.js';
import { leerQuienesSomos } from '../db/quienes-somos.js';
import { asincrono } from '../http.js';

export function rutasConfig({ config, productos }) {
  const router = Router();
  router.get('/', asincrono(async (req, res) => {
    // Las categorías salen del Excel, en el orden en que aparecen (para el menú del header).
    const categorias = [...new Set((await productos.listar()).map((p) => p.categoria).filter(Boolean))];
    res.json({
      nombreTienda: config.nombreTienda,
      whatsapp: config.whatsapp,
      instagram: config.instagram,
      metodosEntrega: METODOS_ENTREGA,
      portada: config.portada.map((archivo) => `/imagenes/${encodeURIComponent(archivo)}`),
      categorias,
      quienesSomos: await leerQuienesSomos(config.dataDir),
      local: config.local?.direccion ? config.local : null,
    });
  }));
  return router;
}
