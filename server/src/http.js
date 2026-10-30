// Error cuyo mensaje se puede mostrar al cliente tal cual.
export class ErrorHttp extends Error {
  constructor(status, mensaje) {
    super(mensaje);
    this.status = status;
    this.expose = true;
  }
}

// Express 4 no captura rechazos de handlers async.
export const asincrono = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
