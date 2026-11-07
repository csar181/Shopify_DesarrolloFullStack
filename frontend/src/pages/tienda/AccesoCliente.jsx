import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router'
import Alerta from '../../components/ui/Alerta'
import Campo from '../../components/ui/Campo'
import { useTiendaPublica } from '../../context/TiendaPublicaContext'

// Páginas a las que se puede volver después de ingresar (?volver=checkout).
const DESTINOS = ['checkout', 'carrito']

/**
 * Ingreso y registro del cliente en una tienda. La cuenta es solo de esta tienda:
 * el mismo correo puede tener otra cuenta, independiente, en otra tienda.
 */
export default function AccesoCliente({ modo }) {
  const esRegistro = modo === 'registro'
  const { slug, tienda, cliente, entrar, crearCuenta } = useTiendaPublica()
  const navegar = useNavigate()
  const [parametros] = useSearchParams()
  const volver = DESTINOS.includes(parametros.get('volver')) ? parametros.get('volver') : null
  const base = `/tienda/${slug}`
  const destino = volver ? `${base}/${volver}` : base
  const sufijo = volver ? `?volver=${volver}` : ''

  const [datos, setDatos] = useState({ nombre: '', correoElectronico: '', contrasena: '', telefono: '' })
  const [errores, setErrores] = useState({})
  const [mensaje, setMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (cliente && !enviando) {
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
      if (esRegistro) {
        await crearCuenta({ ...datos, telefono: datos.telefono.trim() || null })
      } else {
        await entrar({ correoElectronico: datos.correoElectronico, contrasena: datos.contrasena })
      }
      navegar(destino, { replace: true })
    } catch (e) {
      setErrores(e.errores ?? {})
      setMensaje(
        e.status === 401
          ? 'Correo o contraseña incorrectos.'
          : Object.keys(e.errores ?? {}).length > 0
            ? ''
            : e.message,
      )
      setEnviando(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-12">
      <h1 className="text-2xl font-semibold text-slate-900">{esRegistro ? 'Crea tu cuenta' : 'Ingresa a tu cuenta'}</h1>
      <p className="mt-1 text-sm text-slate-600">
        {esRegistro
          ? `Tu cuenta en ${tienda.nombre}, para comprar y seguir tus pedidos.`
          : `Con tu cuenta de ${tienda.nombre}.`}
      </p>

      <form onSubmit={enviar} noValidate className="mt-6 space-y-4">
        <Alerta>{mensaje}</Alerta>
        {esRegistro && (
          <Campo
            etiqueta="Nombre completo"
            name="nombre"
            autoComplete="name"
            required
            maxLength={150}
            value={datos.nombre}
            onChange={cambiar}
            error={errores.nombre}
          />
        )}
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
          autoComplete={esRegistro ? 'new-password' : 'current-password'}
          required
          minLength={esRegistro ? 8 : undefined}
          maxLength={100}
          value={datos.contrasena}
          onChange={cambiar}
          error={errores.contrasena}
          ayuda={esRegistro ? 'Mínimo 8 caracteres.' : undefined}
        />
        {esRegistro && (
          <Campo
            etiqueta="Teléfono (opcional)"
            name="telefono"
            type="tel"
            autoComplete="tel"
            maxLength={30}
            value={datos.telefono}
            onChange={cambiar}
            error={errores.telefono}
          />
        )}
        <button
          type="submit"
          disabled={enviando}
          className="w-full rounded-lg bg-(--tienda) px-4 py-2.5 font-medium text-(--tienda-texto) hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {enviando ? 'Un momento…' : esRegistro ? 'Crear cuenta' : 'Ingresar'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        {esRegistro ? '¿Ya tienes cuenta? ' : '¿Primera vez aquí? '}
        <Link to={`${base}/${esRegistro ? 'ingresar' : 'registro'}${sufijo}`} className="font-semibold text-slate-900 underline">
          {esRegistro ? 'Ingresa' : 'Crea una cuenta'}
        </Link>
      </p>
    </div>
  )
}
