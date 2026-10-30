import { useEffect, useState } from 'react';
import { api } from './api.js';

const formatoARS = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
export const precio = (n) => formatoARS.format(n);

export const linkWhatsApp = (numero, mensaje) =>
  numero ? `https://wa.me/${numero}${mensaje ? `?text=${encodeURIComponent(mensaje)}` : ''}` : null;

export const linkInstagram = (usuario) => (usuario ? `https://www.instagram.com/${usuario}/` : null);

// La configuración pública de la tienda se pide una sola vez.
let promesaConfig;
export function useConfig() {
  const [config, setConfig] = useState(null);
  useEffect(() => {
    promesaConfig ??= api.config().catch((err) => {
      promesaConfig = undefined;
      throw err;
    });
    promesaConfig.then(setConfig).catch(() => {});
  }, []);
  return config;
}
