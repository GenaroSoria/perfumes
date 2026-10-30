import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';
import { ErrorHttp } from './http.js';

// Interfaz mínima sobre el SDK; en los tests se reemplaza por un mock con la misma forma.
export function crearClienteMP(accessToken) {
  if (!accessToken) {
    const noConfigurado = async () => {
      throw new ErrorHttp(503, 'Los pagos online no están disponibles en este momento.');
    };
    return { disponible: false, crearPreferencia: noConfigurado, obtenerPago: noConfigurado };
  }
  const cliente = new MercadoPagoConfig({ accessToken, options: { timeout: 10000 } });
  const preferencias = new Preference(cliente);
  const pagos = new Payment(cliente);
  return {
    disponible: true,
    crearPreferencia: (body) => preferencias.create({ body }),
    obtenerPago: (id) => pagos.get({ id }),
  };
}
