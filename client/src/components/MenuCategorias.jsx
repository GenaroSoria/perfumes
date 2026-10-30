import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Menú desplegable del header: lleva al catálogo filtrado por la categoría elegida.
export default function MenuCategorias({ categorias }) {
  const [abierto, setAbierto] = useState(false);
  const raiz = useRef(null);
  const navegar = useNavigate();

  useEffect(() => {
    if (!abierto) return;
    const cerrarAfuera = (e) => { if (!raiz.current?.contains(e.target)) setAbierto(false); };
    const cerrarConEscape = (e) => { if (e.key === 'Escape') setAbierto(false); };
    document.addEventListener('mousedown', cerrarAfuera);
    document.addEventListener('keydown', cerrarConEscape);
    return () => {
      document.removeEventListener('mousedown', cerrarAfuera);
      document.removeEventListener('keydown', cerrarConEscape);
    };
  }, [abierto]);

  if (!categorias?.length) return null;

  const elegir = (categoria) => {
    setAbierto(false);
    navegar(categoria ? `/?categoria=${encodeURIComponent(categoria)}` : '/', { state: { irAProductos: true } });
  };

  return (
    <div className="menu-categorias" ref={raiz}>
      <button className="menu-boton" aria-haspopup="true" aria-expanded={abierto} onClick={() => setAbierto((a) => !a)}>
        Categorías <span aria-hidden="true">▾</span>
      </button>
      {abierto && (
        <ul className="menu-lista">
          <li><button onClick={() => elegir('')}>Todas</button></li>
          {categorias.map((c) => <li key={c}><button onClick={() => elegir(c)}>{c}</button></li>)}
        </ul>
      )}
    </div>
  );
}
