import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import Alerta from '../../components/ui/Alerta'
import Boton from '../../components/ui/Boton'
import Campo from '../../components/ui/Campo'
import { useAuth } from '../../context/AuthContext'
import TarjetaAuth from './TarjetaAuth'

export default function Registro() {
  const { autenticado, crearCuenta } = useAuth()
  const navegar = useNavigate()

  const [datos, setDatos] = useState({ nombre: '', correoElectronico: '', contrasena: '' })
  const [errores, setErrores] = useState({})
  const [mensaje, setMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (autenticado && !enviando) {
    return <Navigate to="/panel" replace />
  }

  function cambiar(evento) {
    setDatos({ ...datos, [evento.target.name]: evento.target.value })
  }

  async function enviar(evento) {
    evento.preventDefault()
    setEnviando(true)
    setErrores({})
    setMensaje('')
    try {
      // El registro ya devuelve un token: la cuenta queda con la sesión iniciada.
      await crearCuenta(datos)
      navegar('/panel', { replace: true })
    } catch (error) {
      setErrores(error.errores ?? {})
      // Con errores por campo, cada uno se muestra bajo su input.
      setMensaje(Object.keys(error.errores ?? {}).length > 0 ? '' : error.message)
      setEnviando(false)
    }
  }

  return (
    <TarjetaAuth
      titulo="Crea tu cuenta"
      subtitulo="Después eliges un plan y pruebas tu tienda 7 días gratis"
      pie={
        <>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-medium text-marca-700 hover:underline">
            Inicia sesión
          </Link>
        </>
      }
    >
      <form onSubmit={enviar} noValidate className="space-y-4">
        <Alerta>{mensaje}</Alerta>
        <Campo
          etiqueta="Nombre"
          name="nombre"
          autoComplete="name"
          required
          maxLength={100}
          value={datos.nombre}
          onChange={cambiar}
          error={errores.nombre}
        />
        <Campo
          etiqueta="Correo electrónico"
          name="correoElectronico"
          type="email"
          autoComplete="email"
          required
          maxLength={150}
          value={datos.correoElectronico}
          onChange={cambiar}
          error={errores.correoElectronico}
        />
        <Campo
          etiqueta="Contraseña"
          name="contrasena"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={100}
          value={datos.contrasena}
          onChange={cambiar}
          error={errores.contrasena}
        />
        <p className="-mt-2 text-xs text-slate-500">Mínimo 8 caracteres.</p>
        <Boton type="submit" cargando={enviando} className="w-full">
          Crear cuenta
        </Boton>
      </form>
    </TarjetaAuth>
  )
}
