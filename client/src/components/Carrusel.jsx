import { useEffect, useState } from 'react';

const INTERVALO_MS = 5000;

// Muestra las imágenes completas (sin recortar): son flyers con texto.
export default function Carrusel({ imagenes }) {
  const [actual, setActual] = useState(0);
  const [pausado, setPausado] = useState(false);
  const total = imagenes.length;

  useEffect(() => {
    if (total < 2 || pausado) return undefined;
    const id = setInterval(() => setActual((i) => (i + 1) % total), INTERVALO_MS);
    return () => clearInterval(id);
  }, [total, pausado]);

  if (total === 0) return null;
  const ir = (i) => setActual((i + total) % total);

  return (
    <section
      className="carrusel"
      aria-roledescription="carrusel"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
    >
      {imagenes.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          className={`carrusel-imagen ${i === actual ? 'carrusel-activa' : ''}`}
          loading={i === 0 ? 'eager' : 'lazy'}
        />
      ))}
      {total > 1 && (
        <>
          <button className="carrusel-flecha carrusel-anterior" onClick={() => ir(actual - 1)} aria-label="Imagen anterior">‹</button>
          <button className="carrusel-flecha carrusel-siguiente" onClick={() => ir(actual + 1)} aria-label="Imagen siguiente">›</button>
          <div className="carrusel-puntos">
            {imagenes.map((src, i) => (
              <button
                key={src}
                className={i === actual ? 'activo' : ''}
                onClick={() => ir(i)}
                aria-label={`Ver imagen ${i + 1}`}
                aria-current={i === actual}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
