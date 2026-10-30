import { Link } from 'react-router-dom';

export default function NoEncontrado() {
  return (
    <div className="vacio">
      <h1>Página no encontrada</h1>
      <Link to="/" className="boton">Ir al catálogo</Link>
    </div>
  );
}
