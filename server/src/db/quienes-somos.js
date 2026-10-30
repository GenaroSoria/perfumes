// Texto de "¿Quiénes somos?": un .txt en la carpeta de datos que el dueño edita con el Bloc de notas.
// Cada párrafo va separado por una línea en blanco; las líneas que empiezan con # se ignoran.
import fs from 'node:fs/promises';
import path from 'node:path';

export const ARCHIVO_QUIENES_SOMOS = 'quienes-somos.txt';

export const QUIENES_SOMOS_INICIAL = `# Texto de la sección "¿Quiénes somos?" de la web.
# Separá cada párrafo con una línea en blanco. Las líneas que empiezan con # no se muestran.
# Los cambios se ven al recargar la página, sin reiniciar nada.

En Perfumes Marcia ofrecemos perfumes textiles, desodorantes de ambiente y productos de limpieza para tu casa, tu negocio o tu emprendimiento.

Trabajamos con fragancias seleccionadas y presentaciones para todos los usos: desde envases chicos para probar hasta bidones de 5 litros para quienes compran por mayor.

Nos gusta atender de cerca: escribinos por WhatsApp o Instagram y te ayudamos a elegir el aroma ideal.
`;

export async function leerQuienesSomos(dataDir) {
  let texto;
  try {
    texto = await fs.readFile(path.join(dataDir, ARCHIVO_QUIENES_SOMOS), 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
  return texto
    .split(/\r?\n/)
    .filter((linea) => !linea.trim().startsWith('#'))
    .join('\n')
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, ' ').trim())
    .filter(Boolean);
}
