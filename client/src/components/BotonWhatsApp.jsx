import { linkWhatsApp, useConfig } from '../util.js';
import { IconoWhatsApp } from './Iconos.jsx';

export default function BotonWhatsApp() {
  const config = useConfig();
  const href = linkWhatsApp(config?.whatsapp, 'Hola! Quería hacer una consulta.');
  if (!href) return null;
  return (
    <a className="whatsapp-flotante" href={href} target="_blank" rel="noopener noreferrer" aria-label="Escribinos por WhatsApp">
      <IconoWhatsApp size={30} />
    </a>
  );
}
