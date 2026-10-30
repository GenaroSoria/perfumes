// Única capa que lee y escribe los archivos .xlsx.
// - Cada hoja es una tabla: la fila 1 tiene los encabezados y cada fila siguiente es un registro.
// - Las escrituras sobre un mismo archivo se serializan con una cola en memoria (un solo proceso).
// - Se escribe a un temporal y se renombra, para no dejar el archivo a medio escribir.
// - Si Excel tiene el archivo abierto, Windows bloquea el reemplazo: se reintenta con backoff.
import fs from 'node:fs/promises';
import ExcelJS from 'exceljs';

const colas = new Map();

function conLock(archivo, fn) {
  const previo = colas.get(archivo) || Promise.resolve();
  const actual = previo.then(fn, fn);
  colas.set(archivo, actual.catch(() => {}));
  return actual;
}

const CODIGOS_BLOQUEO = new Set(['EBUSY', 'EPERM', 'EACCES']);
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

async function conReintentos(fn, intentos = 5) {
  for (let i = 0; ; i++) {
    try {
      return await fn();
    } catch (err) {
      if (!CODIGOS_BLOQUEO.has(err.code) || i >= intentos - 1) {
        if (CODIGOS_BLOQUEO.has(err.code)) {
          err.message = `No se pudo escribir el archivo (¿está abierto en Excel?): ${err.message}`;
        }
        throw err;
      }
      await esperar(200 * 2 ** i);
    }
  }
}

const normalizarEncabezado = (v) => String(valorCelda(v)).trim().toLowerCase();

function valorCelda(v) {
  if (v == null) return '';
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'object') {
    if ('result' in v) return valorCelda(v.result); // fórmula
    if (Array.isArray(v.richText)) return v.richText.map((t) => t.text).join('');
    if ('text' in v) return valorCelda(v.text); // hipervínculo
    if ('error' in v) return '';
  }
  return v;
}

async function abrir(archivo) {
  const libro = new ExcelJS.Workbook();
  await libro.xlsx.readFile(archivo);
  return libro;
}

function obtenerHoja(libro, nombreHoja, archivo) {
  const hoja = libro.getWorksheet(nombreHoja);
  if (!hoja) throw new Error(`El archivo ${archivo} no tiene una hoja llamada "${nombreHoja}"`);
  return hoja;
}

// Devuelve [{ columna: índice (1-based), nombre }]
function encabezados(hoja) {
  const lista = [];
  hoja.getRow(1).eachCell((celda, columna) => {
    const nombre = normalizarEncabezado(celda.value);
    if (nombre) lista.push({ columna, nombre });
  });
  return lista;
}

function filaAObjeto(fila, cols) {
  const obj = {};
  let vacia = true;
  for (const { columna, nombre } of cols) {
    const v = valorCelda(fila.getCell(columna).value);
    if (v !== '') vacia = false;
    obj[nombre] = v;
  }
  return vacia ? null : obj;
}

async function guardar(libro, archivo) {
  const temporal = `${archivo}.${process.pid}.tmp`;
  await libro.xlsx.writeFile(temporal);
  try {
    await conReintentos(() => fs.rename(temporal, archivo));
  } catch (err) {
    await fs.rm(temporal, { force: true });
    throw err;
  }
}

export async function leerFilas(archivo, nombreHoja) {
  const libro = await abrir(archivo);
  const hoja = obtenerHoja(libro, nombreHoja, archivo);
  const cols = encabezados(hoja);
  const filas = [];
  hoja.eachRow((fila, numero) => {
    if (numero === 1) return;
    const obj = filaAObjeto(fila, cols);
    if (obj) filas.push(obj);
  });
  return filas;
}

async function existe(archivo) {
  try {
    await fs.access(archivo);
    return true;
  } catch {
    return false;
  }
}

// Crea un libro con una hoja y sus encabezados. No pisa un archivo existente.
export async function crearLibro(archivo, nombreHoja, columnas, filas = []) {
  return conLock(archivo, async () => {
    if (await existe(archivo)) return false;
    const libro = new ExcelJS.Workbook();
    const hoja = libro.addWorksheet(nombreHoja);
    hoja.columns = columnas.map((c) => ({ header: c, key: c, width: Math.max(12, c.length + 4) }));
    hoja.getRow(1).font = { bold: true };
    hoja.views = [{ state: 'frozen', ySplit: 1 }];
    for (const f of filas) hoja.addRow(f);
    await guardar(libro, archivo);
    return true;
  });
}

// Agrega un registro al final. Si el archivo no existe, lo crea con `columnas` como encabezados.
export async function agregarFila(archivo, nombreHoja, columnas, objeto) {
  if (!(await existe(archivo))) await crearLibro(archivo, nombreHoja, columnas);
  return conLock(archivo, async () => {
    const libro = await abrir(archivo);
    const hoja = obtenerHoja(libro, nombreHoja, archivo);
    const cols = encabezados(hoja);
    const fila = hoja.getRow(hoja.rowCount + 1);
    for (const { columna, nombre } of cols) {
      if (objeto[nombre] !== undefined) fila.getCell(columna).value = objeto[nombre];
    }
    fila.commit();
    await guardar(libro, archivo);
    return objeto;
  });
}

// Recorre los registros con el lock tomado. `mutador(registro)` devuelve los campos a cambiar
// (o null para dejarlo igual). Devuelve la cantidad de registros modificados.
export async function actualizarFilas(archivo, nombreHoja, mutador) {
  return conLock(archivo, async () => {
    const libro = await abrir(archivo);
    const hoja = obtenerHoja(libro, nombreHoja, archivo);
    const cols = encabezados(hoja);
    const indice = new Map(cols.map((c) => [c.nombre, c.columna]));
    let modificados = 0;
    hoja.eachRow((fila, numero) => {
      if (numero === 1) return;
      const obj = filaAObjeto(fila, cols);
      if (!obj) return;
      const cambios = mutador(obj);
      if (!cambios) return;
      for (const [nombre, valor] of Object.entries(cambios)) {
        const columna = indice.get(nombre);
        if (columna) fila.getCell(columna).value = valor;
      }
      modificados++;
    });
    if (modificados > 0) await guardar(libro, archivo);
    return modificados;
  });
}
