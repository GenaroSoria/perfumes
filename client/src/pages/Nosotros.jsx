import { linkInstagram, linkWhatsApp, useConfig } from '../util.js';

// "¿Quiénes somos?" sale de server/data/quienes-somos.txt y el local de DIRECCION/HORARIOS/COMO_LLEGAR del .env.
export default function Nosotros() {
  const config = useConfig();
  if (!config) return <p className="cargando">Cargando…</p>;

  const { local, quienesSomos = [] } = config;
  const whatsapp = linkWhatsApp(config.whatsapp, 'Hola! Quería consultar cómo llegar al local.');
  const instagram = linkInstagram(config.instagram);
  const destino = local && encodeURIComponent(local.direccion);

  return (
    <div className="nosotros">
      <section className="seccion">
        <p className="sobretitulo">Nosotros</p>
        <h1>¿Quiénes somos?</h1>
        {quienesSomos.map((parrafo, i) => <p key={i} className="texto-largo">{parrafo}</p>)}
      </section>

      <section className="seccion" id="ubicacion">
        <p className="sobretitulo">Local</p>
        <h2>Dónde encontrarnos</h2>
        {local ? (
          <div className="ubicacion">
            <dl className="datos-local">
              <dt>Dirección</dt>
              <dd>{local.direccion}</dd>
              {local.horarios && <><dt>Horarios</dt><dd>{local.horarios}</dd></>}
              {local.comoLlegar && <><dt>Cómo llegar</dt><dd>{local.comoLlegar}</dd></>}
            </dl>
            <div className="acciones-local">
              <a className="boton" href={`https://www.google.com/maps/dir/?api=1&destination=${destino}`} target="_blank" rel="noopener noreferrer">
                Cómo llegar
              </a>
              {whatsapp && <a className="boton boton-secundario" href={whatsapp} target="_blank" rel="noopener noreferrer">Consultar por WhatsApp</a>}
            </div>
            <iframe
              className="mapa"
              title={`Mapa: ${local.direccion}`}
              src={`https://maps.google.com/maps?q=${destino}&output=embed`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        ) : (
          <p className="texto-largo">
            Coordinamos los retiros en persona por{' '}
            {whatsapp ? <a href={whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp</a> : 'WhatsApp'}
            {instagram && <> o <a href={instagram} target="_blank" rel="noopener noreferrer">Instagram</a></>}.
          </p>
        )}
      </section>
    </div>
  );
}
