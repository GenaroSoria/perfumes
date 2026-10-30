# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Proyecto

Tienda web de **perfumes textiles**: catálogo, carrito, pago con **Mercado Pago (Checkout Pro)**, links a **WhatsApp** e **Instagram**, y entrega por **retiro en persona** o envío por **Andreani / Correo Argentino / Via Cargo**. El envío **no se cobra en la web**: se coordina y abona aparte por WhatsApp (la página de resultado arma el mensaje con el n.º de pedido). No hay panel de admin: el dueño edita los productos directamente en Excel. La UI y el código están en español (Argentina) y los precios en ARS.

## Comandos

Monorepo con npm workspaces (`server`, `client`). Requiere Node >= 20. Todo se corre desde la raíz:

- `npm install`
- `npm run setup-data`: crea `server/data/productos.xlsx` (con ejemplos) y `pedidos.xlsx` si no existen. Nunca pisa archivos existentes.
- `npm run dev`: servidor en :3001 (`node --watch`) + Vite en :5173 (el proxy reenvía `/api` e `/imagenes` al servidor).
- `npm test`: tests del servidor (vitest + supertest).
- Un solo test: `npm test -w server -- -t "descuenta stock"` o `npm test -w server -- test/excel.test.js`.
- `npm run build` y después `npm start`: Express sirve `client/dist` y hace fallback de SPA.

Configuración en `server/.env` (copiar de `server/.env.example`): `MP_ACCESS_TOKEN`, `PUBLIC_URL`, `CLIENT_URL`, `WHATSAPP_NUMBER`, `INSTAGRAM_USER`, `NOMBRE_TIENDA`, `PORTADA_IMAGENES` (archivos de `data/imagenes` para el carrusel de la portada), `DIRECCION` / `HORARIOS` / `COMO_LLEGAR` (local físico en `/nosotros`; sin `DIRECCION` no se muestra), `DATA_DIR`. El texto de "¿Quiénes somos?" está en `data/quienes-somos.txt` (párrafos separados por línea en blanco, `#` = comentario; se lee en cada request). Un `WHATSAPP_NUMBER` de 10 dígitos recibe el prefijo `549` automáticamente. El cliente no tiene variables de entorno: pide WhatsApp, Instagram, los métodos de entrega y las imágenes de portada a `GET /api/config`. El logo es `client/public/logo.jpg`.

## Arquitectura

**El Excel es la base de datos y solo `server/src/db/excel.js` lo toca.** Cada hoja es una tabla: la fila 1 tiene los encabezados (se leen en minúsculas y sin espacios) y cada fila es un registro. Esa capa:
- serializa las escrituras de cada archivo con una cola en memoria (asume **un solo proceso**; no correr varias instancias);
- escribe a un `.tmp` y renombra;
- reintenta con backoff ante `EBUSY`/`EPERM`, que es lo que pasa cuando el archivo está abierto en Excel en Windows.

Para read-modify-write usar `actualizarFilas(archivo, hoja, mutador)`: el mutador corre con el lock tomado.

- `productos.xlsx` lo edita el dueño a mano. Columnas: `id`, `categoria` (arma los filtros del catálogo), `nombre`, `presentacion` (texto libre: "½ L", "5 kg"; el mismo nombre puede repetirse en varias presentaciones, y en carrito/pedido/MP se muestra `nombre + presentacion`), `aroma`, `descripcion`, `precio`, `precio_mayor`, `mayor_desde` (por defecto 6), `stock`, `imagen_url`, `activo`. El precio por mayor se aplica cuando las unidades de productos con la misma `categoria` + `presentacion` (p. ej. todas las fragancias de 125 cc) suman `mayor_desde`; la regla está en `server/src/precios.js` (la que cobra) y copiada en `client/src/precios.js` (solo para mostrar). `npm run setup-data` lo crea con el catálogo de `db/catalogo-inicial.js` (transcripto de "lista de precios nueva.pdf"; PRECIOS.xlsx solo tiene esa lista como imagen). `db/productos.js` lo relee cuando cambia su `mtime` (no hace falta reiniciar). Las filas sin id, nombre o precio válido se descartan en silencio; además la web solo muestra (y vende) productos con `imagen_url` (salvo las categorías de `CATEGORIAS_SIN_FOTO` en `db/productos.js`), y `activo` = no / false / 0 oculta el producto. `imagen_url` puede ser una URL o el nombre de un archivo en `server/data/imagenes/`.
- En las categorías de `CATEGORIAS_CON_VARIANTES` (`routes/productos.js`, hoy "Perfumes para ropa") `GET /api/productos` devuelve una sola tarjeta por `nombre` (la primera presentación del Excel) con todos los tamaños en `variantes`; la página del producto tiene un selector de tamaño. Cada tamaño sigue siendo una fila con su id, precio y stock.
- `pedidos.xlsx` lo escribe solo el servidor. Es un archivo aparte para que tener abierto el de productos no bloquee el registro de pedidos. `items` se guarda como JSON.
- Las columnas están en `db/esquema.js`. Para agregar una columna, cambiarla ahí; los archivos existentes necesitan el encabezado agregado a mano.

**Flujo de pago** (`routes/checkout.js` y luego `routes/webhook.js`):
1. `POST /api/checkout` toma del cliente solo `id` y `cantidad`; precio y stock salen del Excel. Crea el pedido `pendiente`, después la preferencia de MP con `external_reference = pedido.id`, y devuelve `initPoint`. Si MP falla, el pedido queda `error_mp`.
2. MP notifica a `POST /api/webhooks/mercadopago` (en formato webhook o IPN). Nunca se confía en el body: se consulta el pago con `mp.obtenerPago`. `pedidos.registrarPago` es idempotente: el stock se descuenta solo la primera vez que el pedido pasa a `approved`, y un `pending` que llega tarde no pisa un `approved`. Si el monto pagado es menor al total, el estado queda `revisar_monto`.
3. `notification_url` y `auto_return` solo se envían si `PUBLIC_URL` / `CLIENT_URL` son https y no son localhost, porque MP los rechaza. Para probar webhooks en local, usar un túnel (ngrok) en `PUBLIC_URL`.

**Inyección de dependencias:** `crearApp({ config, mp })` en `server/src/app.js` recibe la config y el cliente de MP (`{ crearPreferencia, obtenerPago }`, de `src/mp.js`). Los tests pasan un mock de MP y un `dataDir` temporal. Los métodos de entrega están en `server/src/entregas.js` y el cliente los recibe por `/api/config`.

**Cliente:** React + react-router. El carrito está en `context/CarritoContext.jsx` y persiste en `localStorage`; sus precios son solo para mostrar. MP vuelve a `/pago/exito|pendiente|error?external_reference=<pedido>`, y `PagoResultado` vacía el carrito y arma el link de WhatsApp para coordinar la entrega.
