async function pedir(url, opciones = {}) {
  let respuesta;
  try {
    respuesta = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...opciones });
  } catch {
    throw new Error('No hay conexión con el servidor.');
  }
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) throw new Error(datos.error || 'Ocurrió un error, probá de nuevo.');
  return datos;
}

export const api = {
  config: () => pedir('/api/config'),
  productos: () => pedir('/api/productos'),
  producto: (id) => pedir(`/api/productos/${encodeURIComponent(id)}`),
  pedido: (id) => pedir(`/api/pedidos/${encodeURIComponent(id)}`),
  checkout: (datos) => pedir('/api/checkout', { method: 'POST', body: JSON.stringify(datos) }),
};
