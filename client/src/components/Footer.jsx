import { Link } from 'react-router-dom';
import { linkInstagram, linkWhatsApp, useConfig } from '../util.js';
import { IconoInstagram, IconoWhatsApp } from './Iconos.jsx';

export default function Footer() {
  const config = useConfig();
  const whatsapp = linkWhatsApp(config?.whatsapp, 'Hola! Quería hacer una consulta.');
  const instagram = linkInstagram(config?.instagram);
  const local = config?.local;

  return (
    <footer className="footer">
      <div className="contenedor footer-grilla">
        <div>
          <p className="footer-titulo">{config?.nombreTienda || 'Perfumes Marcia'}</p>
          <p>Perfumes textiles, aromas y limpieza.</p>
        </div>
        <div>
          <p className="footer-titulo">Local</p>
          {local ? (
            <>
              <p>{local.direccion}</p>
              {local.horarios && <p>{local.horarios}</p>}
            </>
          ) : (
            <p>Retiro en persona coordinado por WhatsApp.</p>
          )}
          <p><Link to="/nosotros#ubicacion">Cómo llegar</Link></p>
        </div>
        <div>
          <p className="footer-titulo">Contacto</p>
          <div className="redes">
            {whatsapp && <a href={whatsapp} target="_blank" rel="noopener noreferrer"><IconoWhatsApp size={18} /> WhatsApp</a>}
            {instagram && <a href={instagram} target="_blank" rel="noopener noreferrer"><IconoInstagram size={18} /> @{config.instagram}</a>}
          </div>
        </div>
        <div>
          <p className="footer-titulo">Envíos</p>
          <p>Andreani, Correo Argentino y Via Cargo, o retiro en persona.</p>
        </div>
      </div>
      <p className="contenedor footer-legal">© {new Date().getFullYear()} {config?.nombreTienda || 'Perfumes Marcia'}</p>
    </footer>
  );
}
