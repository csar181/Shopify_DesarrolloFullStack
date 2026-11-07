import { useState } from 'react'
import { vaciosANull } from '../../utils/tienda'
import Alerta from '../ui/Alerta'
import Campo from '../ui/Campo'

const VACIA = { lineaDireccion: '', distrito: '', ciudad: '', departamento: '', codigoPostal: '', referencia: '' }

/** Dirección de envío del cliente. `onGuardar` recibe el cuerpo listo para la API y puede lanzar un ErrorApi. */
export default function FormularioDireccion({ onGuardar, onCancelar }) {
  const [datos, setDatos] = useState(VACIA)
  const [errores, setErrores] = useState({})
  const [mensaje, setMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)

  function cambiar(evento) {
    setDatos({ ...datos, [evento.target.name]: evento.target.value })
  }

  async function enviar(evento) {
    evento.preventDefault()
    setEnviando(true)
    setErrores({})
    setMensaje('')
    try {
      await onGuardar(vaciosANull(datos))
    } catch (e) {
      setErrores(e.errores ?? {})
      setMensaje(Object.keys(e.errores ?? {}).length > 0 ? '' : e.message)
      setEnviando(false)
    }
  }

  const props = (nombre) => ({ name: nombre, value: datos[nombre], onChange: cambiar, error: errores[nombre] })

  return (
    <form onSubmit={enviar} noValidate className="space-y-3">
      <Alerta>{mensaje}</Alerta>
      <Campo etiqueta="Dirección" placeholder="Av. Larco 123, dpto. 401" required maxLength={255} autoComplete="street-address" {...props('lineaDireccion')} />
      <div className="grid gap-3 sm:grid-cols-3">
        <Campo etiqueta="Distrito" maxLength={100} {...props('distrito')} />
        <Campo etiqueta="Ciudad" required maxLength={100} autoComplete="address-level2" {...props('ciudad')} />
        <Campo etiqueta="Departamento" maxLength={100} autoComplete="address-level1" {...props('departamento')} />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Campo etiqueta="Código postal" maxLength={20} autoComplete="postal-code" {...props('codigoPostal')} />
        <Campo className="sm:col-span-2" etiqueta="Referencia" placeholder="Frente al parque" maxLength={255} {...props('referencia')} />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={enviando}
          className="rounded-lg bg-(--tienda) px-4 py-2 text-sm font-medium text-(--tienda-texto) hover:brightness-95 disabled:opacity-60"
        >
          {enviando ? 'Guardando…' : 'Guardar dirección'}
        </button>
        {onCancelar && (
          <button type="button" onClick={onCancelar} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}
