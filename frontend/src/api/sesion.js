// Guarda la sesión del propietario en el navegador.
// La sesión del cliente de una tienda (otro token, una por slug) se agregará en la fase de checkout.

const CLAVE_PROPIETARIO = 'shopcloud.propietario'
const CLAVE_TIENDA_ACTUAL = 'shopcloud.tiendaActual'

// localStorage puede fallar (modo privado, almacenamiento bloqueado): la app sigue funcionando sin él.
function leer(clave) {
  try {
    const valor = localStorage.getItem(clave)
    return valor ? JSON.parse(valor) : null
  } catch {
    return null
  }
}

function escribir(clave, valor) {
  try {
    if (valor === null || valor === undefined) {
      localStorage.removeItem(clave)
    } else {
      localStorage.setItem(clave, JSON.stringify(valor))
    }
  } catch {
    // Sin almacenamiento la sesión dura solo mientras la página esté abierta.
  }
}

/** { token, usuario: { id, nombre, correoElectronico, roles } } */
export const sesionPropietario = {
  obtener: () => leer(CLAVE_PROPIETARIO),
  guardar: (sesion) => escribir(CLAVE_PROPIETARIO, sesion),
  borrar: () => {
    escribir(CLAVE_PROPIETARIO, null)
    escribir(CLAVE_TIENDA_ACTUAL, null)
  },
}

/** Id de la tienda que el propietario está administrando. Se envía en X-Tenant-ID. */
export const tiendaActual = {
  obtener: () => leer(CLAVE_TIENDA_ACTUAL),
  guardar: (tiendaId) => escribir(CLAVE_TIENDA_ACTUAL, tiendaId),
}

/**
 * Carrito de un visitante en una tienda, antes de iniciar sesión: [{ productoId, varianteId, cantidad }].
 * Es el mismo formato que POST /api/carrito/sincronizar. Solo guarda qué y cuánto:
 * precios y stock se leen siempre del catálogo.
 */
export const carritoLocal = {
  obtener: (slug) => {
    const items = leer(`shopcloud.carrito.${slug}`)
    return Array.isArray(items) ? items : []
  },
  guardar: (slug, items) => escribir(`shopcloud.carrito.${slug}`, items.length > 0 ? items : null),
}
