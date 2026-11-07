import { apiPropietario, apiPublica } from './cliente'

// Cuenta del propietario (dueño de tiendas). Ver docs/API_BACKEND.md.

/** POST /api/auth/login → { token, tipo, usuarioId, nombre, correoElectronico, roles } */
export async function iniciarSesion({ correoElectronico, contrasena }) {
  const { data } = await apiPublica.post('/auth/login', { correoElectronico, contrasena })
  return data
}

/** POST /api/auth/registro → misma respuesta que el login: la cuenta queda con sesión iniciada. */
export async function registrarse({ nombre, correoElectronico, contrasena }) {
  const { data } = await apiPublica.post('/auth/registro', { nombre, correoElectronico, contrasena })
  return data
}

/** GET /api/auth/me → { id, nombre, correoElectronico, activo, roles } */
export async function obtenerUsuarioActual() {
  const { data } = await apiPropietario.get('/auth/me')
  return data
}
