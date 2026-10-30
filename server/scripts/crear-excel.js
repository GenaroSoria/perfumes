import fs from 'node:fs/promises';
import { config } from '../src/config.js';
import { crearArchivosDeDatos } from '../src/db/plantillas.js';

await fs.mkdir(config.dataDir, { recursive: true });
const creados = await crearArchivosDeDatos(config.dataDir);
if (creados.length) creados.forEach((a) => console.log(`Creado: ${a}`));
else console.log(`Los archivos ya existen en ${config.dataDir}; no se modificó nada.`);
