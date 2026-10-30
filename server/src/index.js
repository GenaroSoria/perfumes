import { crearApp } from './app.js';
import { config } from './config.js';
import { crearClienteMP } from './mp.js';

if (!config.mpAccessToken) console.warn('Falta MP_ACCESS_TOKEN: el checkout va a responder 503.');
if (!config.publicUrl) console.warn('Falta PUBLIC_URL: Mercado Pago no podrá notificar los pagos.');
if (!config.whatsapp) console.warn('Falta WHATSAPP_NUMBER: los links de WhatsApp no van a funcionar.');

const app = crearApp({ config, mp: crearClienteMP(config.mpAccessToken) });

app.listen(config.port, () => {
  console.log(`Servidor en http://localhost:${config.port} (datos en ${config.dataDir})`);
});
