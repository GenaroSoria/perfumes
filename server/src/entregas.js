// Métodos de entrega. El envío no se cobra en la web: se coordina y abona aparte por WhatsApp.
export const METODOS_ENTREGA = [
  { id: 'retiro', nombre: 'Retiro en persona', requiereDireccion: false },
  { id: 'andreani', nombre: 'Andreani', requiereDireccion: true, url: 'https://www.andreani.com/' },
  { id: 'correo_argentino', nombre: 'Correo Argentino', requiereDireccion: true, url: 'https://www.correoargentino.com.ar/' },
  { id: 'via_cargo', nombre: 'Via Cargo', requiereDireccion: true, url: 'https://www.viacargo.com.ar/' },
];

export const buscarMetodo = (id) => METODOS_ENTREGA.find((m) => m.id === id);
