import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { actualizarFilas, agregarFila, crearLibro, leerFilas } from '../src/db/excel.js';

let dir;
let archivo;
const COLS = ['id', 'nombre', 'stock'];

beforeEach(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), 'excel-'));
  archivo = path.join(dir, 'datos.xlsx');
});
afterEach(() => fs.rm(dir, { recursive: true, force: true }));

describe('excel', () => {
  it('crea el libro con encabezados y no pisa uno existente', async () => {
    expect(await crearLibro(archivo, 'hoja', COLS, [{ id: 'A', nombre: 'Uno', stock: 3 }])).toBe(true);
    expect(await crearLibro(archivo, 'hoja', COLS, [])).toBe(false);
    expect(await leerFilas(archivo, 'hoja')).toEqual([{ id: 'A', nombre: 'Uno', stock: 3 }]);
  });

  it('agregarFila crea el archivo si no existe', async () => {
    await agregarFila(archivo, 'hoja', COLS, { id: 'B', nombre: 'Dos', stock: 1 });
    expect(await leerFilas(archivo, 'hoja')).toEqual([{ id: 'B', nombre: 'Dos', stock: 1 }]);
  });

  it('serializa escrituras concurrentes sin perder filas', async () => {
    await crearLibro(archivo, 'hoja', COLS);
    await Promise.all(Array.from({ length: 20 }, (_, i) =>
      agregarFila(archivo, 'hoja', COLS, { id: `X${i}`, nombre: `N${i}`, stock: i })));
    const filas = await leerFilas(archivo, 'hoja');
    expect(filas).toHaveLength(20);
    expect(new Set(filas.map((f) => f.id)).size).toBe(20);
  });

  it('actualizarFilas modifica solo los registros indicados', async () => {
    await crearLibro(archivo, 'hoja', COLS, [
      { id: 'A', nombre: 'Uno', stock: 3 },
      { id: 'B', nombre: 'Dos', stock: 5 },
    ]);
    const n = await actualizarFilas(archivo, 'hoja', (f) => (f.id === 'B' ? { stock: f.stock - 2 } : null));
    expect(n).toBe(1);
    expect(await leerFilas(archivo, 'hoja')).toEqual([
      { id: 'A', nombre: 'Uno', stock: 3 },
      { id: 'B', nombre: 'Dos', stock: 3 },
    ]);
  });

  it('ignora mayúsculas y espacios en los encabezados', async () => {
    await crearLibro(archivo, 'hoja', [' ID ', 'Nombre'], [{ ' ID ': 'A', Nombre: 'Uno' }]);
    expect(await leerFilas(archivo, 'hoja')).toEqual([{ id: 'A', nombre: 'Uno' }]);
  });
});
