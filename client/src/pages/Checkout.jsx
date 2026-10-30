import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useCarrito } from '../context/CarritoContext.jsx';
import { precio, useConfig } from '../util.js';

const DIRECCION_VACIA = { calle: '', numero: '', ciudad: '', provincia: '', cp: '', notas: '' };

export default function Checkout() {
  const { items, total } = useCarrito();
  const config = useConfig();
  const [cliente, setCliente] = useState({ nombre: '', email: '', telefono: '' });
  const [metodo, setMetodo] = useState('retiro');
  const [direccion, setDireccion] = useState(DIRECCION_VACIA);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  if (items.length === 0) {
    return (
      <div className="vacio">
        <h1>No hay productos en el carrito</h1>
        <Link to="/" className="boton">Ver catálogo</Link>
      </div>
    );
  }

  const metodos = config?.metodosEntrega || [];
  const metodoActual = metodos.find((m) => m.id === metodo);
  const conEnvio = metodoActual?.requiereDireccion;

  const campoCliente = (campo) => (e) => setCliente({ ...cliente, [campo]: e.target.value });
  const campoDireccion = (campo) => (e) => setDireccion({ ...direccion, [campo]: e.target.value });

  async function pagar(e) {
    e.preventDefault();
    setEnviando(true);
    setError('');
    try {
      const { initPoint } = await api.checkout({
        cliente,
        entrega: { metodo, ...(conEnvio && { direccion }) },
        items: items.map(({ id, cantidad }) => ({ id, cantidad })),
      });
      window.location.href = initPoint;
    } catch (err) {
      setError(err.message);
      setEnviando(false);
    }
  }

  return (
    <form className="checkout" onSubmit={pagar}>
      <h1>Finalizar compra</h1>

      <fieldset>
        <legend>Tus datos</legend>
        <label>Nombre y apellido<input required value={cliente.nombre} onChange={campoCliente('nombre')} autoComplete="name" /></label>
        <label>Email<input required type="email" value={cliente.email} onChange={campoCliente('email')} autoComplete="email" /></label>
        <label>Teléfono / WhatsApp<input required type="tel" value={cliente.telefono} onChange={campoCliente('telefono')} autoComplete="tel" /></label>
      </fieldset>

      <fieldset>
        <legend>Entrega</legend>
        <div className="opciones-entrega">
          {metodos.map((m) => (
            <label key={m.id} className={`opcion ${metodo === m.id ? 'opcion-activa' : ''}`}>
              <input type="radio" name="metodo" value={m.id} checked={metodo === m.id} onChange={() => setMetodo(m.id)} />
              {m.nombre}
            </label>
          ))}
        </div>

        {conEnvio && (
          <>
            <p className="aviso">
              El costo de envío por {metodoActual.nombre} se coordina y abona aparte por WhatsApp, después de la compra.
              {metodoActual.url && <> Podés ver tarifas en <a href={metodoActual.url} target="_blank" rel="noopener noreferrer">su página</a>.</>}
            </p>
            <div className="grilla-form">
              <label className="ancho-2">Calle<input required value={direccion.calle} onChange={campoDireccion('calle')} autoComplete="address-line1" /></label>
              <label>Número<input required value={direccion.numero} onChange={campoDireccion('numero')} /></label>
              <label>Ciudad<input required value={direccion.ciudad} onChange={campoDireccion('ciudad')} autoComplete="address-level2" /></label>
              <label>Provincia<input required value={direccion.provincia} onChange={campoDireccion('provincia')} autoComplete="address-level1" /></label>
              <label>Código postal<input required value={direccion.cp} onChange={campoDireccion('cp')} autoComplete="postal-code" /></label>
              <label className="ancho-3">Piso, depto u otras indicaciones (opcional)<input value={direccion.notas} onChange={campoDireccion('notas')} /></label>
            </div>
          </>
        )}
      </fieldset>

      <div className="resumen">
        <ul className="lista-resumen">
          {items.map((i) => <li key={i.id}>{i.cantidad} × {i.nombre} <span>{precio(i.precioUnitario * i.cantidad)}</span></li>)}
        </ul>
        <p>Total a pagar: <strong>{precio(total)}</strong>{conEnvio && <span className="detalle"> + envío a coordinar</span>}</p>
        {error && <p className="aviso aviso-error">{error}</p>}
        <button className="boton boton-mp" type="submit" disabled={enviando || !config}>
          {enviando ? 'Redirigiendo a Mercado Pago…' : 'Pagar con Mercado Pago'}
        </button>
      </div>
    </form>
  );
}
