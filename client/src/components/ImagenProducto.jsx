// Sin foto cargada en el Excel se muestra un frasco ilustrado con la inicial del aroma (o del nombre).
export default function ImagenProducto({ producto, className = '' }) {
  if (producto.imagen) {
    return <img className={`imagen-producto ${className}`} src={producto.imagen} alt={producto.nombre} loading="lazy" />;
  }
  const inicial = (producto.aroma || producto.nombre || '?').charAt(0).toUpperCase();
  return (
    <div className={`imagen-producto imagen-vacia ${className}`} aria-hidden="true">
      <span>{inicial}</span>
    </div>
  );
}
