import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCarrito } from '../context/CarritoContext.jsx';
import { precio } from '../util.js';
import ImagenProducto from './ImagenProducto.jsx';

// Productos con tamaños (perfumes textiles): la foto es un carrusel con una diapositiva por tamaño.
// Al pasar de foto cambian el tamaño, el precio y lo que agrega el botón. Arranca en el primero (125 cc).
export default function TarjetaProducto({ producto }) {
  const { agregar } = useCarrito();
  const opciones = producto.variantes?.length > 1 ? producto.variantes : [producto];
  const [indice, setIndice] = useState(() => Math.max(0, opciones.findIndex((v) => v.id === producto.id)));
  const toqueX = useRef(null);
  const actual = opciones[indice] || producto;
  const sinStock = actual.stock <= 0;
  const enlace = `/producto/${encodeURIComponent(actual.id)}`;
  const ir = (i) => setIndice((i + opciones.length) % opciones.length);

  // Deslizar con el dedo en el celular.
  const alTocar = (e) => { toqueX.current = e.touches[0].clientX; };
  const alSoltar = (e) => {
    if (toqueX.current == null) return;
    const dx = e.changedTouches[0].clientX - toqueX.current;
    toqueX.current = null;
    if (Math.abs(dx) > 40) ir(indice + (dx < 0 ? 1 : -1));
  };

  return (
    <article className="tarjeta">
      <div className="tarjeta-media" onTouchStart={alTocar} onTouchEnd={alSoltar}>
        <Link to={enlace} tabIndex={-1} aria-hidden="true">
          <ImagenProducto producto={actual} />
        </Link>
        {opciones.length > 1 && (
          <>
            <span className="tarjeta-tamano">{actual.presentacion}</span>
            <button className="tarjeta-flecha tarjeta-anterior" onClick={() => ir(indice - 1)} aria-label="Tamaño anterior">‹</button>
            <button className="tarjeta-flecha tarjeta-siguiente" onClick={() => ir(indice + 1)} aria-label="Tamaño siguiente">›</button>
            <div className="tarjeta-puntos">
              {opciones.map((v, i) => (
                <button
                  key={v.id}
                  className={i === indice ? 'activo' : ''}
                  onClick={() => ir(i)}
                  aria-label={`Ver ${v.presentacion}`}
                  aria-current={i === indice}
                />
              ))}
            </div>
          </>
        )}
      </div>
      <Link to={enlace} className="tarjeta-link">
        <div className="tarjeta-cuerpo">
          <h3>{actual.nombre}</h3>
          <p className="detalle">
            {[actual.presentacion, actual.categoria].filter(Boolean).join(' · ')}
          </p>
          <p className="precio">{precio(actual.precio)}</p>
          {actual.precio_mayor && (
            <p className="precio-mayor">Por mayor: {precio(actual.precio_mayor)} c/u (desde {actual.mayor_desde})</p>
          )}
        </div>
      </Link>
      <button className="boton" disabled={sinStock} onClick={() => agregar(actual)}>
        {sinStock ? 'Sin stock' : 'Agregar al carrito'}
      </button>
    </article>
  );
}
