import { useCallback, useState } from 'react'
import {
  activarDescuento,
  actualizarDescuento,
  crearDescuento,
  desactivarDescuento,
  listarDescuentos,
} from '../../api/descuentos'
import Alerta from '../../components/ui/Alerta'
import Boton from '../../components/ui/Boton'
import BotonConfirmar from '../../components/ui/BotonConfirmar'
import Campo from '../../components/ui/Campo'
import Insignia from '../../components/ui/Insignia'
import { useTiendas } from '../../context/TiendaContext'
import { useDatos } from '../../hooks/useDatos'
import { formatearFechaHora, formatearSoles } from '../../utils/formato'

/** Situación de un descuento: el backend solo dice si está vigente; el resto se deduce de las fechas. */
function situacion(d) {
  if (!d.activo) return { texto: 'Desactivado', tono: 'gris', orden: 3 }
  if (d.vigente) return { texto: 'Vigente', tono: 'verde', orden: 0 }
  if (new Date(d.fechaInicio) > new Date()) return { texto: 'Programado', tono: 'azul', orden: 1 }
  return { texto: 'Vencido', tono: 'rojo', orden: 2 }
}

const textoValor = (d) =>
  d.tipo === 'PORCENTAJE' ? `${Number(d.valor)}% de descuento` : `${formatearSoles(d.valor)} de descuento`

// <input type="datetime-local"> usa "2026-11-07T10:30"; el backend espera "2026-11-07T10:30:00".
const aInput = (fecha) => (fecha ? fecha.slice(0, 16) : '')
const aApi = (valor) => (valor ? `${valor}:00` : null)
function enDias(dias) {
  const fecha = new Date(Date.now() + dias * 86_400_000)
  fecha.setMinutes(fecha.getMinutes() - fecha.getTimezoneOffset())
  return fecha.toISOString().slice(0, 16)
}

function FormularioDescuento({ inicial, textoBoton, onGuardar, onCancelar }) {
  const [datos, setDatos] = useState(() =>
    inicial
      ? {
          codigo: inicial.codigo,
          tipo: inicial.tipo,
          valor: String(inicial.valor),
          fechaInicio: aInput(inicial.fechaInicio),
          fechaFin: aInput(inicial.fechaFin),
        }
      : { codigo: '', tipo: 'PORCENTAJE', valor: '', fechaInicio: enDias(0), fechaFin: enDias(30) },
  )
  const [errores, setErrores] = useState({})
  const [mensaje, setMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)

  function cambiar(evento) {
    const { name, value } = evento.target
    // Sin espacios y en mayúsculas, igual que lo guarda el backend.
    setDatos({ ...datos, [name]: name === 'codigo' ? value.toUpperCase().replace(/\s/g, '') : value })
  }

  async function enviar(evento) {
    evento.preventDefault()
    setEnviando(true)
    setErrores({})
    setMensaje('')
    try {
      await onGuardar({
        codigo: datos.codigo,
        tipo: datos.tipo,
        valor: datos.valor === '' ? null : datos.valor,
        fechaInicio: aApi(datos.fechaInicio),
        fechaFin: aApi(datos.fechaFin),
      })
      if (!inicial) setDatos({ codigo: '', tipo: 'PORCENTAJE', valor: '', fechaInicio: enDias(0), fechaFin: enDias(30) })
    } catch (e) {
      setErrores(e.errores ?? {})
      setMensaje(Object.keys(e.errores ?? {}).length > 0 ? '' : e.message)
    } finally {
      setEnviando(false)
    }
  }

  const esPorcentaje = datos.tipo === 'PORCENTAJE'

  return (
    <form onSubmit={enviar} noValidate className="space-y-3">
      <Alerta>{mensaje}</Alerta>
      <div className="grid gap-3 sm:grid-cols-3">
        <Campo
          etiqueta="Código"
          name="codigo"
          placeholder="VERANO10"
          required
          maxLength={50}
          value={datos.codigo}
          onChange={cambiar}
          error={errores.codigo}
          ayuda="Lo escribe el cliente al pagar."
        />
        <Campo etiqueta="Tipo" name="tipo" seleccion value={datos.tipo} onChange={cambiar} error={errores.tipo}>
          <option value="PORCENTAJE">Porcentaje (%)</option>
          <option value="MONTO_FIJO">Monto fijo (S/)</option>
        </Campo>
        <Campo
          etiqueta={esPorcentaje ? 'Porcentaje' : 'Monto (S/)'}
          name="valor"
          type="number"
          inputMode="decimal"
          min="0.01"
          max={esPorcentaje ? '100' : undefined}
          step="0.01"
          required
          value={datos.valor}
          onChange={cambiar}
          error={errores.valor}
          ayuda={esPorcentaje ? 'Hasta 100.' : 'No puede superar el total de la compra.'}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo
          etiqueta="Desde"
          name="fechaInicio"
          type="datetime-local"
          required
          value={datos.fechaInicio}
          onChange={cambiar}
          error={errores.fechaInicio}
        />
        <Campo
          etiqueta="Hasta"
          name="fechaFin"
          type="datetime-local"
          required
          min={datos.fechaInicio}
          value={datos.fechaFin}
          onChange={cambiar}
          error={errores.fechaFin}
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

function FilaDescuento({ descuento, puedeEditar, onCambio, onError }) {
  const [editando, setEditando] = useState(false)
  const estado = situacion(descuento)

  async function ejecutar(accion) {
    try {
      onCambio(await accion())
    } catch (e) {
      onError(e.message)
    }
  }

  if (editando) {
    return (
      <li className="bg-slate-50 px-4 py-4">
        <FormularioDescuento
          inicial={descuento}
          textoBoton="Guardar"
          onCancelar={() => setEditando(false)}
          onGuardar={async (datos) => {
            onCambio(await actualizarDescuento(descuento.id, datos))
            setEditando(false)
          }}
        />
      </li>
    )
  }

  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-mono font-semibold text-slate-900">{descuento.codigo}</p>
          <Insignia tono={estado.tono}>{estado.texto}</Insignia>
        </div>
        <p className="mt-0.5 text-sm text-slate-700">{textoValor(descuento)}</p>
        <p className="text-xs text-slate-500">
          {formatearFechaHora(descuento.fechaInicio)} – {formatearFechaHora(descuento.fechaFin)}
        </p>
      </div>
      {puedeEditar &&
        (descuento.activo ? (
          <div className="flex flex-wrap gap-2">
            <Boton variante="secundario" onClick={() => setEditando(true)}>
              Editar
            </Boton>
            <BotonConfirmar
              pregunta="¿Desactivarlo?"
              textoConfirmar="Sí, desactivar"
              onConfirmar={() =>
                ejecutar(async () => {
                  await desactivarDescuento(descuento.id)
                  return { ...descuento, activo: false, vigente: false }
                })
              }
            >
              Desactivar
            </BotonConfirmar>
          </div>
        ) : (
          <Boton variante="secundario" onClick={() => ejecutar(() => activarDescuento(descuento.id))}>
            Reactivar
          </Boton>
        ))}
    </li>
  )
}

export default function Descuentos() {
  const { tienda } = useTiendas()
  const puedeEditar = tienda.administrable
  const cargar = useCallback(() => listarDescuentos(), [])
  const { datos: descuentos, cargando, error, setDatos } = useDatos(cargar)
  const [mensaje, setMensaje] = useState('')

  const lista = [...(descuentos ?? [])].sort(
    (a, b) => situacion(a).orden - situacion(b).orden || a.codigo.localeCompare(b.codigo),
  )

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold text-slate-900">Descuentos</h1>
      <p className="mt-1 text-sm text-slate-600">
        Códigos que tus clientes escriben al pagar. Se aplican sobre el total de los productos.
      </p>

      <div className="mt-6 space-y-6">
        <Alerta>{error || mensaje}</Alerta>

        {descuentos && puedeEditar && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-3 font-semibold text-slate-900">Nuevo descuento</h2>
            <FormularioDescuento
              textoBoton="Crear descuento"
              onGuardar={async (datos) => {
                setMensaje('')
                const nuevo = await crearDescuento(datos)
                setDatos((actuales) => [...actuales, nuevo])
              }}
            />
          </section>
        )}

        {cargando ? (
          <p className="text-slate-500">Cargando…</p>
        ) : lista.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-8 text-center text-sm text-slate-500">
            Todavía no creaste códigos de descuento.
          </p>
        ) : (
          <ul className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
            {lista.map((descuento) => (
              <FilaDescuento
                key={descuento.id}
                descuento={descuento}
                puedeEditar={puedeEditar}
                onError={setMensaje}
                onCambio={(d) => {
                  setMensaje('')
                  setDatos((actuales) => actuales.map((x) => (x.id === d.id ? d : x)))
                }}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
