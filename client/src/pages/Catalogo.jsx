import { useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import Carrusel from '../components/Carrusel.jsx';
import TarjetaProducto from '../components/TarjetaProducto.jsx';
import { useConfig } from '../util.js';

const sinAcentos = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export default function Catalogo() {
  const [productos, setProductos] = useState(null);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  // La categoría va en la URL (/?categoria=...) para que el menú del header pueda elegirla.
  const [parametros, setParametros] = useSearchParams();
  const categoria = parametros.get('categoria') || '';
  const setCategoria = (c) => setParametros(c ? { categoria: c } : {});
  const config = useConfig();

  const ubicacion = useLocation();

  useEffect(() => {
    api.productos().then(setProductos).catch((e) => setError(e.message));
  }, []);

  // Al elegir una categoría desde el menú del header, bajar hasta los productos (si no, el carrusel tapa todo).
  const irAProductos = Boolean(productos) && ubicacion.state?.irAProductos;
  useEffect(() => {
    if (irAProductos) document.getElementById('categorias')?.scrollIntoView({ behavior: 'smooth' });
  }, [irAProductos, ubicacion.key]);

  // Las categorías salen del Excel, en el orden en que aparecen.
  const categorias = [...new Set((productos || []).map((p) => p.categoria).filter(Boolean))];
  const termino = sinAcentos(busqueda.trim());
  const visibles = (productos || []).filter((p) =>
    (!categoria || p.categoria === categoria)
    && (!termino || sinAcentos(`${p.nombre} ${p.categoria} ${p.presentacion} ${(p.variantes || []).map((v) => v.presentacion).join(' ')} ${p.aroma} ${p.descripcion}`).includes(termino)));

  return (
    <>
      <Carrusel imagenes={config?.portada || []} />
      <section className="portada">
        <h1>Perfumes textiles</h1>
        <p>Aromas para tu ropa y tus ambientes, y productos de limpieza.</p>
      </section>

      {productos?.length === 0 && (
        <p className="vacio-catalogo">
          Estamos cargando nuestros productos. Mientras tanto, consultanos por WhatsApp o Instagram.
        </p>
      )}

      {productos?.length > 0 && <input
        className="buscador"
        type="search"
        placeholder="Buscar por nombre, aroma o categoría…"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        aria-label="Buscar productos"
      />}

      {categorias.length > 1 && (
        <div className="categorias" id="categorias" role="group" aria-label="Filtrar por categoría">
          {['', ...categorias].map((c) => (
            <button
              key={c || 'todas'}
              className={`categoria${categoria === c ? ' activa' : ''}`}
              aria-pressed={categoria === c}
              onClick={() => setCategoria(c)}
            >
              {c || 'Todas'}
            </button>
          ))}
        </div>
      )}

      {error && <p className="aviso aviso-error">{error}</p>}
      {!productos && !error && <p className="cargando">Cargando productos…</p>}
      {productos?.length > 0 && visibles.length === 0 && <p className="cargando">No encontramos productos.</p>}

      <div className="grilla">
        {visibles.map((p) => <TarjetaProducto key={p.id} producto={p} />)}
      </div>
    </>
  );
}
