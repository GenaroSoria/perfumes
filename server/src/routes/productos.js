import { Router } from 'express';
import { asincrono, ErrorHttp } from '../http.js';

const publico = ({ activo, ...p }) => p;

// En estas categorías cada producto (mismo nombre) se lista una sola vez, con su primera presentación
// del Excel, y todos sus tamaños van en `variantes` para elegir en la página del producto.
// Cada tamaño sigue siendo una fila (con su id, precio y stock) del Excel.
const CATEGORIAS_CON_VARIANTES = new Set(['Perfumes para ropa']);
const grupo = (p) => (CATEGORIAS_CON_VARIANTES.has(p.categoria) ? `${p.categoria}|${p.nombre}` : null);

export function rutasProductos({ productos }) {
  const router = Router();

  router.get('/', asincrono(async (req, res) => {
    const lista = await productos.listar();
    const porGrupo = new Map();
    for (const p of lista) {
      const g = grupo(p);
      if (g) porGrupo.set(g, [...(porGrupo.get(g) || []), publico(p)]);
    }
    const vistos = new Set();
    const resultado = [];
    for (const p of lista) {
      const g = grupo(p);
      if (!g) resultado.push(publico(p));
      else if (!vistos.has(g)) {
        vistos.add(g);
        resultado.push({ ...publico(p), variantes: porGrupo.get(g) });
      }
    }
    res.json(resultado);
  }));

  router.get('/:id', asincrono(async (req, res) => {
    const producto = await productos.obtener(req.params.id);
    if (!producto) throw new ErrorHttp(404, 'Producto no encontrado');
    const g = grupo(producto);
    const variantes = g && (await productos.listar()).filter((p) => grupo(p) === g).map(publico);
    res.json({ ...publico(producto), ...(variantes && { variantes }) });
  }));

  return router;
}
