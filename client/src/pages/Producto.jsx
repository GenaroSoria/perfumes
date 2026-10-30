import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import ImagenProducto from '../components/ImagenProducto.jsx';
import { useCarrito } from '../context/CarritoContext.jsx';
import { precio } from '../util.js';

export default function Producto() {
  const { id } = useParams();
  const navegar = useNavigate();
  const { agregar } = useCarrito();
  const [base, setBase] = useState(null);
  const [elegido, setElegido] = useState(null);
  const [error, setError] = useState('');
  const [cantidad, setCantidad] = useState(1);

  useEffect(() => {
    setBase(null);
    setElegido(null);
    setError('');
    api.producto(id).then(setBase).catch((e) => setError(e.message));
  }, [id]);

  if (error) return <p className="aviso aviso-error">{error} <Link to="/">Volver al catálogo</Link></p>;
  if (!base) return <p className="cargando">Cargando…</p>;

  // Con tamaños (perfumes textiles), cada tamaño es un producto aparte del Excel con su precio y stock.
  const variantes = base.variantes || [];
  const producto = variantes.find((v) => v.id === elegido) || base;
  const sinStock = producto.stock <= 0;
  const elegir = (v) => {
    setElegido(v.id);
    setCantidad(1);
  };

  return (
    <div className="producto">
      <ImagenProducto producto={producto} className="producto-imagen" />
      <div className="producto-info">
        <Link to="/" className="volver">← Catálogo</Link>
        <h1>{producto.nombre}</h1>
        <p className="detalle">
          {[producto.categoria, variantes.length === 0 && producto.presentacion, producto.aroma && `Aroma: ${producto.aroma}`]
            .filter(Boolean).join(' · ')}
        </p>

        {variantes.length > 1 && (
          <div className="tamanos" role="radiogroup" aria-label="Tamaño">
            <p className="tamanos-titulo">Tamaño</p>
            {variantes.map((v) => (
              <button
                key={v.id}
                role="radio"
                aria-checked={v.id === producto.id}
                className={`tamano${v.id === producto.id ? ' activo' : ''}`}
                onClick={() => elegir(v)}
              >
                {v.presentacion}
              </button>
            ))}
          </div>
        )}

        <p className="precio precio-grande">{precio(producto.precio)}</p>
        {producto.precio_mayor && (
          <p className="precio-mayor">
            Por mayor: {precio(producto.precio_mayor)} c/u llevando {producto.mayor_desde} o más
            {producto.presentacion && ` de ${producto.presentacion}`} (podés combinar fragancias).
          </p>
        )}
        {producto.descripcion && <p>{producto.descripcion}</p>}

        {sinStock ? (
          <p className="aviso">Sin stock por el momento.</p>
        ) : (
          <div className="comprar">
            <label>
              Cantidad
              <input
                type="number"
                min="1"
                max={producto.stock}
                value={cantidad}
                onChange={(e) => setCantidad(Math.max(1, Math.min(Number(e.target.value) || 1, producto.stock)))}
              />
            </label>
            <button className="boton" onClick={() => { agregar(producto, cantidad); navegar('/carrito'); }}>
              Agregar al carrito
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
