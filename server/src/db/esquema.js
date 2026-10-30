export const ARCHIVO_PRODUCTOS = 'productos.xlsx';
export const HOJA_PRODUCTOS = 'productos';
export const COLUMNAS_PRODUCTOS = [
  'id', 'categoria', 'nombre', 'presentacion', 'aroma', 'descripcion', 'precio', 'precio_mayor', 'mayor_desde',
  'stock', 'imagen_url', 'activo',
];

export const ARCHIVO_PEDIDOS = 'pedidos.xlsx';
export const HOJA_PEDIDOS = 'pedidos';
export const COLUMNAS_PEDIDOS = [
  'id', 'fecha', 'nombre', 'email', 'telefono', 'items', 'total',
  'metodo_entrega', 'direccion', 'estado', 'mp_payment_id', 'actualizado',
];
