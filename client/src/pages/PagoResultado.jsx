import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { IconoWhatsApp } from '../components/Iconos.jsx';
import { useCarrito } from '../context/CarritoContext.jsx';
import { linkWhatsApp, useConfig } from '../util.js';

const TEXTOS = {
  exito: { titulo: '¡Gracias por tu compra!', texto: 'Recibimos tu pago.' },
  pendiente: { titulo: 'Pago pendiente', texto: 'Tu pago está en proceso. Te avisamos cuando se acredite.' },
  error: { titulo: 'El pago no se completó', texto: 'No se realizó ningún cobro. Podés intentarlo de nuevo.' },
};

// Mercado Pago vuelve acá con ?external_reference=<id del pedido>&payment_id=...&status=...
export default function PagoResultado({ tipo }) {
  const [params] = useSearchParams();
  const pedidoId = params.get('external_reference');
  const config = useConfig();
  const { vaciar } = useCarrito();
  const [pedido, setPedido] = useState(null);

  useEffect(() => {
    if (tipo !== 'error') vaciar();
  }, [tipo]); // vaciar cambia en cada render del carrito

  useEffect(() => {
    if (pedidoId) api.pedido(pedidoId).then(setPedido).catch(() => {});
  }, [pedidoId]);

  const metodo = config?.metodosEntrega.find((m) => m.id === pedido?.metodo_entrega);
  let mensaje = `Hola! Hice el pedido #${pedidoId || ''}`;
  if (metodo?.requiereDireccion) mensaje += ` con envío por ${metodo.nombre}. Quiero coordinar el envío.`;
  else if (metodo) mensaje += ' para retirar. ¿Cuándo puedo pasar?';
  const whatsapp = tipo !== 'error' && linkWhatsApp(config?.whatsapp, mensaje);

  const { titulo, texto } = TEXTOS[tipo];

  return (
    <div className="resultado">
      <h1>{titulo}</h1>
      <p>{texto}</p>
      {pedidoId && <p>Número de pedido: <strong>#{pedidoId}</strong></p>}
      {whatsapp && (
        <>
          <p>
            {metodo?.requiereDireccion
              ? 'Escribinos por WhatsApp para coordinar el envío y su costo.'
              : 'Escribinos por WhatsApp para coordinar la entrega.'}
          </p>
          <a className="boton boton-whatsapp" href={whatsapp} target="_blank" rel="noopener noreferrer">
            <IconoWhatsApp /> Coordinar por WhatsApp
          </a>
        </>
      )}
      <p>
        {tipo === 'error' ? <Link to="/checkout">Volver a intentar</Link> : <Link to="/">Volver al catálogo</Link>}
      </p>
    </div>
  );
}
