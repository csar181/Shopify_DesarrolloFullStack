import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { iniciarSesion, obtenerUsuarioActual, registrarse } from '../api/auth'
import { configurarAlExpirarSesionPropietario } from '../api/cliente'
import { sesionPropietario } from '../api/sesion'

const AuthContext = createContext(null)

function sesionDesdeRespuesta(respuesta) {
  return {
    token: respuesta.token,
    usuario: {
      id: respuesta.usuarioId,
      nombre: respuesta.nombre,
      correoElectronico: respuesta.correoElectronico,
      roles: respuesta.roles ?? [],
    },
  }
}

/** Sesión del propietario: quién es y si inició sesión. */
export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(() => sesionPropietario.obtener())

  const cerrarSesion = useCallback(() => {
    sesionPropietario.borrar()
    setSesion(null)
  }, [])

  // Si la API responde 401 (token vencido o inválido), se cierra la sesión.
  // RutaProtegida se encarga de llevar al login.
  useEffect(() => {
    configurarAlExpirarSesionPropietario(cerrarSesion)
  }, [cerrarSesion])

  // Al abrir la app con una sesión guardada, se confirma que el token sigue valiendo
  // y se actualizan los datos del usuario.
  const tokenGuardado = sesion?.token
  useEffect(() => {
    if (!tokenGuardado) return
    let vigente = true
    obtenerUsuarioActual()
      .then((usuario) => {
        if (!vigente) return
        setSesion((actual) => {
          if (!actual) return actual
          const nueva = { ...actual, usuario: { ...actual.usuario, ...usuario } }
          sesionPropietario.guardar(nueva)
          return nueva
        })
      })
      .catch(() => {
        // Un 401 ya cerró la sesión. Otros errores (backend apagado) no la cierran.
      })
    return () => {
      vigente = false
    }
  }, [tokenGuardado])

  const entrar = useCallback(async (credenciales) => {
    const nueva = sesionDesdeRespuesta(await iniciarSesion(credenciales))
    sesionPropietario.guardar(nueva)
    setSesion(nueva)
  }, [])

  const crearCuenta = useCallback(async (datos) => {
    const nueva = sesionDesdeRespuesta(await registrarse(datos))
    sesionPropietario.guardar(nueva)
    setSesion(nueva)
  }, [])

  const valor = useMemo(
    () => ({
      usuario: sesion?.usuario ?? null,
      autenticado: Boolean(sesion?.token),
      entrar,
      crearCuenta,
      cerrarSesion,
    }),
    [sesion, entrar, crearCuenta, cerrarSesion],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}

// oxlint-disable-next-line react/only-export-components -- el hook vive junto a su Provider
export function useAuth() {
  const contexto = useContext(AuthContext)
  if (!contexto) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  }
  return contexto
}
