import { useCallback, useState } from 'react'
import {
  activarMetodoPago,
  actualizarMetodoPago,
  crearMetodoPago,
  desactivarMetodoPago,
  listarMetodosPago,
  TIPOS_METODO_PAGO,
} from '../../api/metodosPago'
import Alerta from '../../components/ui/Alerta'
import Boton from '../../components/ui/Boton'
import BotonConfirmar from '../../components/ui/BotonConfirmar'
import Campo from '../../components/ui/Campo'
import Insignia from '../../components/ui/Insignia'
import { useTiendas } from '../../context/TiendaContext'
import { useDatos } from '../../hooks/useDatos'
import { vaciosANull } from '../../utils/tienda'

const VACIO = { nombre: '', tipo: 'YAPE', instrucciones: '', datosPago: '' }

function FormularioMetodo({ inicial, textoBoton, onGuardar, onCancelar }) {
  const [datos, setDatos] = useState(
    inicial
      ? {
          nombre: inicial.nombre,
          tipo: inicial.tipo,
          instrucciones: inicial.instrucciones ?? '',
          datosPago: inicial.datosPago ?? '',
        }
      : VACIO,
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

  // Un tipo guardado que no está en la lista (creado por otra vía) se conserva como opción.
  const tipos = { ...TIPOS_METODO_PAGO, ...(datos.tipo in TIPOS_METODO_PAGO ? {} : { [datos.tipo]: datos.tipo }) }

  return (
    <form onSubmit={enviar} noValidate className="space-y-3">
      <Alerta>{mensaje}</Alerta>
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo
          etiqueta="Nombre"
          name="nombre"
          placeholder="Yape de la tienda"
          required
          maxLength={50}
          value={datos.nombre}
          onChange={cambiar}
          error={errores.nombre}
        />
        <Campo etiqueta="Tipo" name="tipo" seleccion value={datos.tipo} onChange={cambiar} error={errores.tipo}>
          {Object.entries(tipos).map(([valor, texto]) => (
            <option key={valor} value={valor}>
              {texto}
            </option>
          ))}
        </Campo>
      </div>
      <Campo
        etiqueta="Datos para pagar (opcional)"
        name="datosPago"
        placeholder="Número de Yape, cuenta bancaria…"
        value={datos.datosPago}
        onChange={cambiar}
        error={errores.datosPago}
      />
      <Campo
        etiqueta="Instrucciones para el cliente (opcional)"
        name="instrucciones"
        multilinea
        placeholder="Envía la captura del pago al WhatsApp…"
        value={datos.instrucciones}
        onChange={cambiar}
        error={errores.instrucciones}
      />
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

function FilaMetodo({ metodo, puedeEditar, onCambio, onError }) {
  const [editando, setEditando] = useState(false)

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
        <FormularioMetodo
          inicial={metodo}
          textoBoton="Guardar"
          onCancelar={() => setEditando(false)}
          onGuardar={async (datos) => {
            onCambio(await actualizarMetodoPago(metodo.id, datos))
            setEditando(false)
          }}
        />
      </li>
    )
  }

  return (
    <li className="flex flex-wrap items-start gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-slate-900">{metodo.nombre}</p>
          <Insignia tono="gris">{TIPOS_METODO_PAGO[metodo.tipo] ?? metodo.tipo}</Insignia>
          {!metodo.activo && <Insignia tono="rojo">Desactivado</Insignia>}
        </div>
        {metodo.datosPago && <p className="mt-1 text-sm text-slate-600">{metodo.datosPago}</p>}
        {metodo.instrucciones && <p className="mt-1 text-sm whitespace-pre-line text-slate-500">{metodo.instrucciones}</p>}
      </div>
      {puedeEditar &&
        (metodo.activo ? (
          <div className="flex flex-wrap gap-2">
            <Boton variante="secundario" onClick={() => setEditando(true)}>
              Editar
            </Boton>
            <BotonConfirmar
              pregunta="¿Desactivarlo?"
              textoConfirmar="Sí, desactivar"
              onConfirmar={() =>
                ejecutar(async () => {
                  await desactivarMetodoPago(metodo.id)
                  return { ...metodo, activo: false }
                })
              }
            >
              Desactivar
            </BotonConfirmar>
          </div>
        ) : (
          <Boton variante="secundario" onClick={() => ejecutar(() => activarMetodoPago(metodo.id))}>
            Reactivar
          </Boton>
        ))}
    </li>
  )
}

export default function MetodosPago() {
  const { tienda } = useTiendas()
  const puedeEditar = tienda.administrable
  const cargar = useCallback(() => listarMetodosPago(), [])
  const { datos: metodos, cargando, error, setDatos } = useDatos(cargar)
  const [mensaje, setMensaje] = useState('')

  const lista = [...(metodos ?? [])].sort(
    (a, b) => Number(b.activo) - Number(a.activo) || a.nombre.localeCompare(b.nombre, 'es'),
  )
  const sinActivos = metodos && !metodos.some((m) => m.activo)

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold text-slate-900">Métodos de pago</h1>
      <p className="mt-1 text-sm text-slate-600">
        Los que tus clientes pueden elegir al comprar. El pago es simulado: la compra se registra como pagada.
      </p>

      <div className="mt-6 space-y-6">
        {sinActivos && (
          <Alerta tipo="info">Sin al menos un método de pago activo, tus clientes no pueden completar una compra.</Alerta>
        )}
        <Alerta>{error || mensaje}</Alerta>

        {metodos && puedeEditar && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-3 font-semibold text-slate-900">Nuevo método de pago</h2>
            <FormularioMetodo
              textoBoton="Agregar"
              onGuardar={async (datos) => {
                setMensaje('')
                const nuevo = await crearMetodoPago(datos)
                setDatos((actuales) => [...actuales, nuevo])
              }}
            />
          </section>
        )}

        {cargando ? (
          <p className="text-slate-500">Cargando…</p>
        ) : (
          lista.length > 0 && (
            <ul className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
              {lista.map((metodo) => (
                <FilaMetodo
                  key={metodo.id}
                  metodo={metodo}
                  puedeEditar={puedeEditar}
                  onError={setMensaje}
                  onCambio={(m) => {
                    setMensaje('')
                    setDatos((actuales) => actuales.map((x) => (x.id === m.id ? m : x)))
                  }}
                />
              ))}
            </ul>
          )
        )}
      </div>
    </div>
  )
}
