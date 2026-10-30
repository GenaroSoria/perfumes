import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { preciosUnitarios } from '../precios.js';

const CLAVE = 'carrito';
const CarritoContext = createContext(null);

function cargar() {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE));
    return Array.isArray(guardado) ? guardado : [];
  } catch {
    return [];
  }
}

// Los precios del carrito son solo para mostrar: el servidor recalcula todo con el Excel.
export function CarritoProvider({ children }) {
  const [items, setItems] = useState(cargar);

  useEffect(() => {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(items));
    } catch {
      // sin almacenamiento disponible: el carrito vive solo en memoria
    }
  }, [items]);

  const valor = useMemo(() => {
    // precioUnitario ya tiene aplicado el precio por mayor si corresponde.
    const unitarios = preciosUnitarios(items);
    const conPrecio = items.map((i, n) => ({ ...i, precioUnitario: unitarios[n], porMayor: unitarios[n] < i.precio }));
    return {
      items: conPrecio,
      cantidadTotal: items.reduce((s, i) => s + i.cantidad, 0),
      total: conPrecio.reduce((s, i) => s + i.precioUnitario * i.cantidad, 0),
      agregar(producto, cantidad = 1) {
        setItems((prev) => {
          const existente = prev.find((i) => i.id === producto.id);
          if (existente) {
            return prev.map((i) => (i.id === producto.id ? { ...i, cantidad: Math.min(i.cantidad + cantidad, producto.stock) } : i));
          }
          const { id, precio, imagen, stock, categoria, presentacion, precio_mayor, mayor_desde } = producto;
          const nombre = [producto.nombre, presentacion].filter(Boolean).join(' ');
          return [...prev, {
            id, nombre, precio, imagen, stock, categoria, presentacion, precio_mayor, mayor_desde, cantidad: Math.min(cantidad, stock),
          }];
        });
      },
      cambiarCantidad(id, cantidad) {
        setItems((prev) => prev.map((i) => (i.id === id ? { ...i, cantidad: Math.max(1, Math.min(cantidad, i.stock)) } : i)));
      },
      quitar(id) {
        setItems((prev) => prev.filter((i) => i.id !== id));
      },
      vaciar() {
        setItems([]);
      },
    };
  }, [items]);

  return <CarritoContext.Provider value={valor}>{children}</CarritoContext.Provider>;
}

export const useCarrito = () => useContext(CarritoContext);
