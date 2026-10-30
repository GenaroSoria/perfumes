import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import { crearRepoPedidos } from './db/pedidos.js';
import { crearRepoProductos } from './db/productos.js';
import { rutasCheckout } from './routes/checkout.js';
import { rutasConfig } from './routes/config.js';
import { rutasPedidos } from './routes/pedidos.js';
import { rutasProductos } from './routes/productos.js';
import { rutasWebhook } from './routes/webhook.js';

// mp: { crearPreferencia(body), obtenerPago(id) } (ver mp.js)
export function crearApp({ config, mp }) {
  const ctx = {
    config,
    mp,
    productos: crearRepoProductos(config.dataDir),
    pedidos: crearRepoPedidos(config.dataDir),
  };

  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '100kb' }));

  app.use('/imagenes', express.static(path.join(config.dataDir, 'imagenes')));
  app.use('/api/config', rutasConfig(ctx));
  app.use('/api/productos', rutasProductos(ctx));
  app.use('/api/checkout', rutasCheckout(ctx));
  app.use('/api/pedidos', rutasPedidos(ctx));
  app.use('/api/webhooks/mercadopago', rutasWebhook(ctx));
  app.use('/api', (req, res) => res.status(404).json({ error: 'No encontrado' }));

  // En producción el mismo servidor entrega el frontend compilado.
  if (config.clientDist && fs.existsSync(config.clientDist)) {
    app.use(express.static(config.clientDist));
    app.get('*', (req, res) => res.sendFile(path.join(config.clientDist, 'index.html')));
  }

  // Express reconoce el manejador de errores por tener 4 parámetros.
  app.use((err, req, res, next) => {
    const status = err.status || 500;
    if (status >= 500) console.error(err);
    res.status(status).json({ error: err.expose ? err.message : 'Ocurrió un error, probá de nuevo.' });
  });

  return app;
}
