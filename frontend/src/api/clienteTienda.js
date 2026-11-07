import axios from 'axios'
import { API_URL, apiPublica } from './cliente'
import { normalizarError } from './errores'
import { sesionCliente } from './sesion'

// Rutas del cliente de una tienda. Su token ya dice a qué tienda pertenece:
// no hace falta X-Tenant-ID. Ver docs/API_BACKEND.md, "Rutas del cliente".

const instancias = new Map()
const alExpirar = new Map()

/** Lo registra TiendaPublicaContext: qué hacer cuando el token del cliente de esa tienda deja de valer. */
export function configurarAlExpirarSesionCliente(slug, funcion) {
  alExpirar.set(slug, funcion)
}

/** Una instancia de Axios por tienda, que envía el token del cliente de esa tienda. */
function api(slug) {
  if (!instancias.has(slug)) {
    const instancia = axios.create({ baseURL: `${API_URL}/api` })
    instancia.interceptors.request.use((config) => {
      const sesion = sesionCliente.obtener(slug)
      if (sesion?.token) config.headers.Authorization = `Bearer ${sesion.token}`
      return config
    })
    instancia.interceptors.response.use(
      (respuesta) => respuesta,
      (error) => {
        const errorApi = normalizarError(error)
        if (errorApi.status === 401) alExpirar.get(slug)?.()
        return Promise.reject(errorApi)
      },
    )
    instancias.set(slug, instancia)
  }
  return instancias.get(slug)
}

const base = (slug) => `/publico/tiendas/${encodeURIComponent(slug)}/clientes`

// ---- Cuenta ----

/** → { token, tipo, clienteId, tiendaId, tiendaSlug, nombre, correoElectronico } */
export async function registrarCliente(slug, { nombre, correoElectronico, contrasena, telefono }) {
  const { data } = await apiPublica.post(`${base(slug)}/registro`, { nombre, correoElectronico, contrasena, telefono })
  return data
}

export async function iniciarSesionCliente(slug, { correoElectronico, contrasena }) {
  const { data } = await apiPublica.post(`${base(slug)}/login`, { correoElectronico, contrasena })
  return data
}

// ---- Carrito en el servidor ----
// Respuesta: { id, elementos: [{ id, productoId, nombreProducto, varianteId, nombreVariante, cantidad,
//              precioUnitario, subtotal }], cantidadTotal, total, advertencias: [texto] }

export async function obtenerCarrito(slug) {
  const { data } = await api(slug).get('/carrito')
  return data
}

/** Suma la cantidad a la que ya había. Falla si supera el stock. */
export async function agregarAlCarrito(slug, { productoId, varianteId, cantidad }) {
  const { data } = await api(slug).post('/carrito/productos', { productoId, varianteId, cantidad })
  return data
}

export async function cambiarCantidadEnCarrito(slug, elementoId, cantidad) {
  const { data } = await api(slug).put(`/carrito/productos/${elementoId}`, { cantidad })
  return data
}

/** Responde 204 sin cuerpo: para ver el carrito actualizado hay que pedirlo de nuevo. */
export async function quitarDelCarrito(slug, elementoId) {
  await api(slug).delete(`/carrito/productos/${elementoId}`)
}

export async function vaciarCarrito(slug) {
  await api(slug).delete('/carrito')
}

/**
 * Incorpora el carrito del navegador al iniciar sesión. Se puede repetir sin duplicar:
 * se queda con la cantidad mayor, ajusta al stock y explica en `advertencias` lo que omitió.
 */
export async function sincronizarCarrito(slug, elementos) {
  const { data } = await api(slug).post('/carrito/sincronizar', { elementos })
  return data
}

// ---- Datos para comprar ----

/** [{ id, lineaDireccion, ciudad, distrito, departamento, codigoPostal, referencia }] */
export async function listarDirecciones(slug) {
  const { data } = await api(slug).get('/mi-cuenta/direcciones')
  return data
}

export async function crearDireccion(slug, datos) {
  const { data } = await api(slug).post('/mi-cuenta/direcciones', datos)
  return data
}

/** Solo los métodos activos: [{ id, nombre, tipo, instrucciones, datosPago }] */
export async function listarMetodosDePago(slug) {
  const { data } = await api(slug).get('/pagos/metodos')
  return data
}

/** Datos de boleta o factura guardados: [{ id, tipoDocumento ('DNI' | 'RUC'), numeroDocumento, nombreRazonSocial, direccionFiscal }] */
export async function listarDatosFacturacion(slug) {
  const { data } = await api(slug).get('/mi-cuenta/datos-facturacion')
  return data
}

// ---- Compra ----

/** GET /api/checkout/resumen: { subtotal, codigoDescuento, montoDescuento, baseImponible, porcentajeIgv, montoIgv, total } */
export async function resumenCompra(slug, codigoDescuento) {
  const { data } = await api(slug).get('/checkout/resumen', {
    params: codigoDescuento ? { codigoDescuento } : {},
  })
  return data
}

/**
 * POST /api/checkout. Los importes los calcula el backend; es atómico: si algo falla, no cambia nada.
 * { direccionId, metodoPagoId, codigoDescuento, tipoComprobante ('BOLETA' | 'FACTURA'),
 *   datosFacturacionId | (numeroDocumento, nombreRazonSocial, direccionFiscal), guardarDatosFacturacion }
 */
export async function confirmarCompra(slug, datos) {
  const { data } = await api(slug).post('/checkout', datos)
  return data
}

/** Pedido completo: importes, dirección, comprobante, transacción y productos. */
export async function obtenerPedido(slug, id) {
  const { data } = await api(slug).get(`/pedidos/${id}`)
  return data
}
