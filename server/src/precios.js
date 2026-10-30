// Precio por mayor: se aplica cuando las unidades de productos con la misma categoría y presentación
// (p. ej. todas las fragancias de 125 cc) suman al menos `mayor_desde`. Se pueden mezclar fragancias.
// La misma regla está copiada en client/src/precios.js para mostrar los precios en el carrito.
// items: [{ precio, precio_mayor, mayor_desde, categoria, presentacion, cantidad }]
// Devuelve el precio unitario que corresponde a cada ítem, en el mismo orden.
export function preciosUnitarios(items) {
  const grupo = (i) => `${i.categoria}|${i.presentacion}`;
  const unidades = new Map();
  for (const i of items) {
    if (i.precio_mayor) unidades.set(grupo(i), (unidades.get(grupo(i)) || 0) + i.cantidad);
  }
  return items.map((i) => (i.precio_mayor && unidades.get(grupo(i)) >= i.mayor_desde ? i.precio_mayor : i.precio));
}
