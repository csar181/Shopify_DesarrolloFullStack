import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import Alerta from '../../components/ui/Alerta'
import Boton from '../../components/ui/Boton'
import Campo from '../../components/ui/Campo'
import { useAuth } from '../../context/AuthContext'
import TarjetaAuth from './TarjetaAuth'

export default function Login() {
  const { autenticado, entrar } = useAuth()
  const navegar = useNavigate()
  const destino = useLocation().state?.desde ?? '/panel'

  const [datos, setDatos] = useState({ correoElectronico: '', contrasena: '' })
  const [errores, setErrores] = useState({})
  const [mensaje, setMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (autenticado && !enviando) {
    return <Navigate to={destino} replace />
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
      await entrar(datos)
      navegar(destino, { replace: true })
    } catch (error) {
      setErrores(error.errores ?? {})
      setMensaje(error.status === 401 ? 'Correo o contraseña incorrectos.' : error.message)
      setEnviando(false)
    }
  }

  return (
    <TarjetaAuth
      titulo="Inicia sesión"
      subtitulo="Administra tus tiendas"
      pie={
        <>
          ¿No tienes cuenta?{' '}
          <Link to="/registro" className="font-medium text-marca-700 hover:underline">
            Crea una gratis
          </Link>
        </>
      }
    >
      <form onSubmit={enviar} noValidate className="space-y-4">
        <Alerta>{mensaje}</Alerta>
        <Campo
          etiqueta="Correo electrónico"
          name="correoElectronico"
          type="email"
          autoComplete="email"
          required
          value={datos.correoElectronico}
          onChange={cambiar}
          error={errores.correoElectronico}
        />
        <Campo
          etiqueta="Contraseña"
          name="contrasena"
          type="password"
          autoComplete="current-password"
          required
          value={datos.contrasena}
          onChange={cambiar}
          error={errores.contrasena}
        />
        <Boton type="submit" cargando={enviando} className="w-full">
          Iniciar sesión
        </Boton>
      </form>
    </TarjetaAuth>
  )
}
