import { useState } from 'react'
import { actualizarVariante, crearVariante, eliminarVariante } from '../../api/productos'
import { formatearSoles } from '../../utils/formato'
import { vaciosANull } from '../../utils/tienda'
import Alerta from '../ui/Alerta'
import Boton from '../ui/Boton'
import BotonConfirmar from '../ui/BotonConfirmar'
import Campo from '../ui/Campo'

const VACIO = { nombre: '', sku: '', precio: '' }

function FormularioVariante({ inicial, precioProducto, textoBoton, onGuardar, onCancelar }) {
  const [datos, setDatos] = useState(
    inicial ? { nombre: inicial.nombre, sku: inicial.sku ?? '', precio: inicial.precio != null ? String(inicial.precio) : '' } : VACIO,
  )
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
      if (!inicial) setDatos(VACIO)
    } catch (e) {
      setErrores(e.errores ?? {})
      setMensaje(Object.keys(e.errores ?? {}).length > 0 ? '' : e.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="space-y-3">
      <Alerta>{mensaje}</Alerta>
      <div className="grid gap-3 sm:grid-cols-3">
        <Campo
          etiqueta="Nombre"
          name="nombre"
          placeholder="Talla M, Color rojo…"
          required
          maxLength={100}
          value={datos.nombre}
          onChange={cambiar}
          error={errores.nombre}
        />
        <Campo etiqueta="SKU (opcional)" name="sku" maxLength={100} value={datos.sku} onChange={cambiar} error={errores.sku} />
        <Campo
          etiqueta="Precio (opcional)"
          name="precio"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          placeholder={formatearSoles(precioProducto)}
          value={datos.precio}
          onChange={cambiar}
          error={errores.precio}
          ayuda="Vacío = precio del producto."
        />
      </div>
      <div className="flex gap-2">
        <Boton type="submit" cargando={enviando}>
          {textoBoton}
        </Boton>
        {onCancelar && (
          <Boton variante="secundario" onClick={onCancelar} disabled={enviando}>
            Cancelar
          </Boton>
        )}
      </div>
    </form>
  )
}

function FilaVariante({ productoId, variante, precioProducto, puedeEditar, onCambio, onQuitada, onError }) {
  const [editando, setEditando] = useState(false)

  if (editando) {
    return (
      <li className="bg-slate-50 px-4 py-4">
        <FormularioVariante
          inicial={variante}
          precioProducto={precioProducto}
          textoBoton="Guardar"
          onCancelar={() => setEditando(false)}
          onGuardar={async (datos) => {
            onCambio(await actualizarVariante(productoId, variante.id, datos))
            setEditando(false)
          }}
        />
      </li>
    )
  }

  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-slate-900">{variante.nombre}</p>
        {variante.sku && <p className="text-xs text-slate-500">SKU {variante.sku}</p>}
      </div>
      <p className="text-sm text-slate-700 tabular-nums">
        {variante.precio != null ? (
          formatearSoles(variante.precio)
        ) : (
          <span className="text-slate-500">{formatearSoles(precioProducto)} (del producto)</span>
        )}
      </p>
      {puedeEditar && (
        <div className="flex flex-wrap gap-2">
          <Boton variante="secundario" onClick={() => setEditando(true)}>
            Editar
          </Boton>
          <BotonConfirmar
            pregunta="¿Eliminarla?"
            textoConfirmar="Sí, eliminar"
            onConfirmar={async () => {
              try {
                await eliminarVariante(productoId, variante.id)
                onQuitada(variante.id)
              } catch (e) {
                onError(e.message)
              }
            }}
          >
            Eliminar
          </BotonConfirmar>
        </div>
      )}
    </li>
  )
}

/**
 * Variantes del producto (talla, color...). Cada una puede tener su propio precio y SKU.
 * Las carga DetalleProducto porque la sección de inventario también las usa.
 * Con `conStockGeneral`, el backend no permite crear variantes y se explica cómo cambiar.
 */
export default function SeccionVariantes({
  productoId,
  precioProducto,
  puedeEditar,
  variantes,
  cargando,
  error,
  setVariantes: setDatos,
  conStockGeneral,
}) {
  const [mensaje, setMensaje] = useState('')

  const lista = [...(variantes ?? [])].sort((a, b) => a.id - b.id)

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
      <h2 className="font-semibold text-slate-900">Variantes</h2>
      <p className="mt-1 text-sm text-slate-500">
        Opcional. Úsalas si el producto se vende en varias versiones, como tallas o colores.
      </p>

      <div className="mt-4 space-y-4">
        <Alerta>{error || mensaje}</Alerta>
        {cargando ? (
          <p className="text-sm text-slate-500">Cargando variantes…</p>
        ) : (
          lista.length > 0 && (
            <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200">
              {lista.map((variante) => (
                <FilaVariante
                  key={variante.id}
                  productoId={productoId}
                  variante={variante}
                  precioProducto={precioProducto}
                  puedeEditar={puedeEditar}
                  onError={setMensaje}
                  onCambio={(v) => setDatos((actuales) => actuales.map((x) => (x.id === v.id ? v : x)))}
                  onQuitada={(id) => setDatos((actuales) => actuales.filter((x) => x.id !== id))}
                />
              ))}
            </ul>
          )
        )}

        {variantes && puedeEditar && conStockGeneral && (
          <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
            Este producto lleva un stock general, así que no admite variantes. Para usarlas, deja su stock en 0 y
            quita el registro en la sección <a href="#inventario" className="font-medium text-marca-700 hover:underline">Inventario</a>.
          </p>
        )}

        {variantes && puedeEditar && !conStockGeneral && (
          <div className="rounded-xl bg-slate-50 p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-800">Agregar variante</h3>
            <FormularioVariante
              precioProducto={precioProducto}
              textoBoton="Agregar variante"
              onGuardar={async (datos) => {
                setMensaje('')
                const nueva = await crearVariante(productoId, datos)
                setDatos((actuales) => [...actuales, nueva])
              }}
            />
          </div>
        )}
      </div>
    </section>
  )
}
