import { Link } from 'react-router-dom';
import ImagenProducto from '../components/ImagenProducto.jsx';
import { useCarrito } from '../context/CarritoContext.jsx';
import { precio } from '../util.js';

export default function Carrito() {
  const { items, total, cambiarCantidad, quitar } = useCarrito();

  if (items.length === 0) {
    return (
      <div className="vacio">
        <h1>Tu carrito está vacío</h1>
        <Link to="/" className="boton">Ver catálogo</Link>
      </div>
    );
  }

  return (
    <>
      <h1>Carrito</h1>
      <ul className="lista-carrito">
        {items.map((item) => (
          <li key={item.id} className="item-carrito">
            <ImagenProducto producto={item} className="miniatura" />
            <div className="item-nombre">
              <Link to={`/producto/${encodeURIComponent(item.id)}`}>{item.nombre}</Link>
              <span className="detalle">
                {precio(item.precioUnitario)} c/u
                {item.porMayor && <> · <span className="etiqueta-mayor">precio por mayor</span></>}
              </span>
            </div>
            <input
              type="number"
              min="1"
              max={item.stock}
              value={item.cantidad}
              onChange={(e) => cambiarCantidad(item.id, Number(e.target.value) || 1)}
              aria-label={`Cantidad de ${item.nombre}`}
            />
            <span className="item-subtotal">{precio(item.precioUnitario * item.cantidad)}</span>
            <button className="boton-texto" onClick={() => quitar(item.id)} aria-label={`Quitar ${item.nombre}`}>✕</button>
          </li>
        ))}
      </ul>
      <div className="resumen">
        <p>Total productos: <strong>{precio(total)}</strong></p>
        <p className="detalle">El precio por mayor se aplica al llevar la cantidad mínima de un mismo tamaño, combinando fragancias.</p>
        <p className="detalle">El costo de envío (si corresponde) se coordina aparte por WhatsApp.</p>
        <Link to="/checkout" className="boton">Continuar con la compra</Link>
      </div>
    </>
  );
}
