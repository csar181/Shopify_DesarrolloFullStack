import axios from 'axios'
import { normalizarError } from './errores'
import { sesionPropietario, tiendaActual } from './sesion'

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

function crearInstancia() {
  return axios.create({ baseURL: `${API_URL}/api` })
}

/** Rutas públicas, sin sesión: planes, catálogo de una tienda, login y registro. */
export const apiPublica = crearInstancia()
apiPublica.interceptors.response.use(
  (respuesta) => respuesta,
  (error) => Promise.reject(normalizarError(error)),
)

// El AuthContext registra aquí qué hacer cuando el token del propietario deja de valer.
let alExpirarSesionPropietario = () => {}
export function configurarAlExpirarSesionPropietario(funcion) {
  alExpirarSesionPropietario = funcion
}

/** Rutas del propietario: envía su token y, si eligió una, la tienda actual. */
export const apiPropietario = crearInstancia()
apiPropietario.interceptors.request.use((config) => {
  const sesion = sesionPropietario.obtener()
  if (sesion?.token) {
    config.headers.Authorization = `Bearer ${sesion.token}`
  }
  // El backend solo la lee en las rutas de una tienda (productos, categorías, pedidos...)
  // y la ignora en /auth, /tiendas y /usuarios, así que se puede enviar siempre.
  const tiendaId = tiendaActual.obtener()
  if (tiendaId) {
    config.headers['X-Tenant-ID'] = String(tiendaId)
  }
  return config
})
apiPropietario.interceptors.response.use(
  (respuesta) => respuesta,
  (error) => {
    const errorApi = normalizarError(error)
    if (errorApi.status === 401) {
      alExpirarSesionPropietario()
    }
    return Promise.reject(errorApi)
  },
)
