// Convierte cualquier error de Axios en un ErrorApi con la misma forma.
// El backend responde con application/problem+json: { status, title, detail, codigo?, errores? }.

/** Mensajes de respaldo si el backend no envía `detail`. */
const MENSAJES_POR_CODIGO = {
  TIENDA_NO_DISPONIBLE: 'Esta tienda no existe o todavía no está publicada.',
  SUSCRIPCION_REQUERIDA: 'La tienda está en modo de solo lectura. Contrata un plan para seguir configurándola.',
  TIENDA_DESACTIVADA: 'La tienda está desactivada. Reactívala para hacer cambios.',
  LIMITE_PLAN: 'Alcanzaste el límite de tu plan.',
  FUNCIONALIDAD_NO_INCLUIDA: 'Esta funcionalidad no está incluida en tu plan.',
}

const MENSAJES_POR_ESTADO = {
  400: 'Revisa los datos ingresados.',
  401: 'Tu sesión expiró. Vuelve a iniciar sesión.',
  403: 'No tienes permiso para realizar esta acción.',
  404: 'No se encontró lo que buscas.',
  409: 'La operación no se pudo completar.',
  500: 'Ocurrió un error en el servidor. Inténtalo más tarde.',
}

export class ErrorApi extends Error {
  constructor({ status, mensaje, codigo = null, errores = {} }) {
    super(mensaje)
    this.name = 'ErrorApi'
    /** Código HTTP, o 0 si no hubo respuesta del servidor. */
    this.status = status
    /** Código de negocio del backend, por ejemplo LIMITE_PLAN. */
    this.codigo = codigo
    /** Errores de validación por campo: { correoElectronico: 'mensaje' }. */
    this.errores = errores
  }
}

export function normalizarError(error) {
  if (error instanceof ErrorApi) {
    return error
  }

  if (!error?.response) {
    return new ErrorApi({
      status: 0,
      mensaje: 'No se pudo conectar con el servidor. Verifica que el backend esté en marcha.',
    })
  }

  const { status, data } = error.response
  const cuerpo = data && typeof data === 'object' ? data : {}

  return new ErrorApi({
    status,
    codigo: cuerpo.codigo ?? null,
    errores: cuerpo.errores ?? {},
    mensaje:
      cuerpo.detail ||
      MENSAJES_POR_CODIGO[cuerpo.codigo] ||
      MENSAJES_POR_ESTADO[status] ||
      'Ocurrió un error inesperado.',
  })
}
