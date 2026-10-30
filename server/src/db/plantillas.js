import fs from 'node:fs/promises';
import path from 'node:path';
import { CATALOGO_INICIAL } from './catalogo-inicial.js';
import { crearLibro } from './excel.js';
import {
  ARCHIVO_PEDIDOS, ARCHIVO_PRODUCTOS, COLUMNAS_PEDIDOS, COLUMNAS_PRODUCTOS, HOJA_PEDIDOS, HOJA_PRODUCTOS,
} from './esquema.js';
import { ARCHIVO_QUIENES_SOMOS, QUIENES_SOMOS_INICIAL } from './quienes-somos.js';

// Crea productos.xlsx (con el catálogo inicial), pedidos.xlsx y quienes-somos.txt si no existen.
// Devuelve los archivos creados.
export async function crearArchivosDeDatos(dataDir) {
  const creados = [];
  const productos = path.join(dataDir, ARCHIVO_PRODUCTOS);
  const pedidos = path.join(dataDir, ARCHIVO_PEDIDOS);
  const quienesSomos = path.join(dataDir, ARCHIVO_QUIENES_SOMOS);
  if (await crearLibro(productos, HOJA_PRODUCTOS, COLUMNAS_PRODUCTOS, CATALOGO_INICIAL)) creados.push(productos);
  if (await crearLibro(pedidos, HOJA_PEDIDOS, COLUMNAS_PEDIDOS)) creados.push(pedidos);
  try {
    await fs.writeFile(quienesSomos, QUIENES_SOMOS_INICIAL, { flag: 'wx' });
    creados.push(quienesSomos);
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
  return creados;
}
