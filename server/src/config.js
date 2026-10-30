import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raizServidor = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const sinBarraFinal = (url) => (url || '').trim().replace(/\/+$/, '');

// wa.me necesita el código de país: un celular argentino de 10 dígitos (ej. 1156433397) pasa a 549...
function numeroWhatsApp(valor) {
  const digitos = (valor || '').replace(/\D/g, '');
  return digitos.length === 10 ? `549${digitos}` : digitos;
}

export const config = {
  port: Number(process.env.PORT) || 3001,
  mpAccessToken: (process.env.MP_ACCESS_TOKEN || '').trim(),
  publicUrl: sinBarraFinal(process.env.PUBLIC_URL),
  clientUrl: sinBarraFinal(process.env.CLIENT_URL) || 'http://localhost:5173',
  nombreTienda: process.env.NOMBRE_TIENDA || 'Perfumes Marcia',
  whatsapp: numeroWhatsApp(process.env.WHATSAPP_NUMBER),
  instagram: (process.env.INSTAGRAM_USER || '').replace(/^@/, '').trim(),
  // Local físico: si DIRECCION está vacía, la web no muestra la sección de ubicación.
  local: {
    direccion: (process.env.DIRECCION || '').trim(),
    horarios: (process.env.HORARIOS || '').trim(),
    comoLlegar: (process.env.COMO_LLEGAR || '').trim(),
  },
  // Archivos de data/imagenes para el carrusel de la portada, separados por coma
  portada: (process.env.PORTADA_IMAGENES || '').split(',').map((s) => s.trim()).filter(Boolean),
  dataDir: process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(raizServidor, 'data'),
  clientDist: path.resolve(raizServidor, '..', 'client', 'dist'),
};
