import { Link, NavLink } from 'react-router-dom';
import { useCarrito } from '../context/CarritoContext.jsx';
import { linkInstagram, useConfig } from '../util.js';
import { IconoCarrito, IconoInstagram } from './Iconos.jsx';
import MenuCategorias from './MenuCategorias.jsx';

export default function Header() {
  const { cantidadTotal } = useCarrito();
  const config = useConfig();
  const instagram = linkInstagram(config?.instagram);

  return (
    <header className="header">
      <div className="contenedor header-fila">
        <Link to="/" className="logo">
          <span className="logo-imagen"><img src="/logo.jpg" alt="" /></span>
          <span className="logo-texto">{config?.nombreTienda || 'Perfumes Marcia'}</span>
        </Link>
        <nav className="nav">
          <NavLink to="/" end className="nav-catalogo">Catálogo</NavLink>
          <MenuCategorias categorias={config?.categorias} />
          <NavLink to="/nosotros">Nosotros</NavLink>
          {instagram && (
            <a href={instagram} target="_blank" rel="noopener noreferrer" className="nav-icono" aria-label={`Instagram @${config.instagram}`}>
              <IconoInstagram size={20} />
            </a>
          )}
          <NavLink to="/carrito" className="nav-icono nav-carrito" aria-label={`Carrito, ${cantidadTotal} productos`}>
            <IconoCarrito size={20} />
            {cantidadTotal > 0 && <span className="globo">{cantidadTotal}</span>}
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
