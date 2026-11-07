import { useState } from 'react'
import Boton from '../ui/Boton'

const entrada =
  'w-24 rounded-lg border bg-white px-2 py-1.5 text-right text-sm tabular-nums outline-none focus:ring-2 disabled:bg-slate-50 disabled:text-slate-500'

/**
 * Cantidad y mínimo de un registro de inventario, editables en línea.
 * Sin `registro`, el botón lo crea. `onGuardar({ cantidad, cantidadMinima })` puede lanzar un ErrorApi.
 */
export default function EditorStock({ registro, onGuardar, puedeEditar, etiqueta }) {
  const [cantidad, setCantidad] = useState(registro ? String(registro.cantidad) : '')
  const [minima, setMinima] = useState(registro ? String(registro.cantidadMinima) : '0')
  const [errores, setErrores] = useState({})
  const [mensaje, setMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)

  const sinCambios =
    registro && cantidad === String(registro.cantidad) && minima === String(registro.cantidadMinima)

  async function guardar(evento) {
    evento.preventDefault()
    setEnviando(true)
    setErrores({})
    setMensaje('')
    try {
      await onGuardar({
        cantidad: cantidad === '' ? null : Number(cantidad),
        cantidadMinima: minima === '' ? null : Number(minima),
      })
    } catch (e) {
      setErrores(e.errores ?? {})
      setMensaje(Object.keys(e.errores ?? {}).length > 0 ? '' : e.message)
    } finally {
      setEnviando(false)
    }
  }

  const borde = (campo) =>
    errores[campo] ? 'border-red-400 focus:ring-red-200' : 'border-slate-300 focus:border-marca-500 focus:ring-marca-100'

  return (
    <form onSubmit={guardar} noValidate className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap items-end justify-end gap-2">
        <label className="text-xs text-slate-500">
          Cantidad
          <input
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            disabled={!puedeEditar}
            aria-label={`Cantidad de ${etiqueta}`}
            aria-invalid={Boolean(errores.cantidad)}
            className={`mt-0.5 block ${entrada} ${borde('cantidad')}`}
          />
        </label>
        <label className="text-xs text-slate-500" title="Al llegar a este número se marca como stock bajo">
          Mínimo
          <input
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            value={minima}
            onChange={(e) => setMinima(e.target.value)}
            disabled={!puedeEditar}
            aria-label={`Mínimo de ${etiqueta}`}
            aria-invalid={Boolean(errores.cantidadMinima)}
            className={`mt-0.5 block ${entrada} ${borde('cantidadMinima')}`}
          />
        </label>
        {puedeEditar && (
          <Boton
            type="submit"
            variante={registro ? 'secundario' : 'primario'}
            cargando={enviando}
            disabled={Boolean(sinCambios) || cantidad === ''}
          >
            {registro ? 'Guardar' : 'Registrar'}
          </Boton>
        )}
      </div>
      {(errores.cantidad || errores.cantidadMinima || mensaje) && (
        <p role="alert" className="text-right text-xs text-red-600">
          {errores.cantidad || errores.cantidadMinima || mensaje}
        </p>
      )}
    </form>
  )
}
