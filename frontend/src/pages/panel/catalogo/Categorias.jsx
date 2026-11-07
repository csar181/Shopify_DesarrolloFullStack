import { useCallback, useState } from 'react'
import {
  activarCategoria,
  actualizarCategoria,
  crearCategoria,
  desactivarCategoria,
  listarCategorias,
} from '../../../api/categorias'
import UsoPlan from '../../../components/UsoPlan'
import Alerta from '../../../components/ui/Alerta'
import Boton from '../../../components/ui/Boton'
import BotonConfirmar from '../../../components/ui/BotonConfirmar'
import Campo from '../../../components/ui/Campo'
import Pestanas from '../../../components/ui/Pestanas'
import { useTiendas } from '../../../context/TiendaContext'
import { useDatos } from '../../../hooks/useDatos'
import { usePlanTienda } from '../../../hooks/usePlanTienda'
import { vaciosANull } from '../../../utils/tienda'

const porNombre = (a, b) => a.nombre.localeCompare(b.nombre, 'es')

/** Formulario de nombre y descripción; lo usan "Nueva categoría" y la edición en la fila. */
function FormularioCategoria({ inicial, textoBoton, onGuardar, onCancelar }) {
  const [datos, setDatos] = useState({ nombre: inicial?.nombre ?? '', descripcion: inicial?.descripcion ?? '' })
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
      if (!inicial) setDatos({ nombre: '', descripcion: '' })
    } catch (error) {
      setErrores(error.errores ?? {})
      setMensaje(Object.keys(error.errores ?? {}).length > 0 ? '' : error.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="space-y-3">
      <Alerta>{mensaje}</Alerta>
      <div className="grid gap-3 md:grid-cols-[1fr_2fr]">
        <Campo
          etiqueta="Nombre"
          name="nombre"
          required
          maxLength={100}
          value={datos.nombre}
          onChange={cambiar}
          error={errores.nombre}
        />
        <Campo
          etiqueta="Descripción (opcional)"
          name="descripcion"
          value={datos.descripcion}
          onChange={cambiar}
          error={errores.descripcion}
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

function FilaCategoria({ categoria, puedeEditar, onCambio, onError }) {
  const [editando, setEditando] = useState(false)

  async function ejecutar(accion) {
    try {
      await accion()
    } catch (error) {
      onError(error.message)
    }
  }

  if (editando) {
    return (
      <li className="bg-slate-50 px-4 py-4">
        <FormularioCategoria
          inicial={categoria}
          textoBoton="Guardar"
          onCancelar={() => setEditando(false)}
          onGuardar={async (datos) => {
            onCambio(await actualizarCategoria(categoria.id, datos))
            setEditando(false)
          }}
        />
      </li>
    )
  }

  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-slate-900">{categoria.nombre}</p>
        {categoria.descripcion && <p className="text-sm text-slate-500">{categoria.descripcion}</p>}
      </div>
      {categoria.activo ? (
        <div className="flex flex-wrap gap-2">
          <Boton variante="secundario" disabled={!puedeEditar} onClick={() => setEditando(true)}>
            Editar
          </Boton>
          <BotonConfirmar
            disabled={!puedeEditar}
            pregunta="¿Desactivarla?"
            textoConfirmar="Sí, desactivar"
            onConfirmar={() =>
              ejecutar(async () => {
                await desactivarCategoria(categoria.id)
                onCambio({ ...categoria, activo: false })
              })
            }
          >
            Desactivar
          </BotonConfirmar>
        </div>
      ) : (
        <Boton
          variante="secundario"
          disabled={!puedeEditar}
          onClick={() => ejecutar(async () => onCambio(await activarCategoria(categoria.id)))}
        >
          Reactivar
        </Boton>
      )}
    </li>
  )
}

export default function Categorias() {
  const { tienda } = useTiendas()
  const plan = usePlanTienda()
  const puedeEditar = tienda.administrable

  const cargar = useCallback(() => listarCategorias({ incluirInactivos: true }), [])
  const { datos: categorias, cargando, error, setDatos } = useDatos(cargar)
  const [pestana, setPestana] = useState('activas')
  const [mensaje, setMensaje] = useState('')

  const activas = (categorias ?? []).filter((c) => c.activo).sort(porNombre)
  const desactivadas = (categorias ?? []).filter((c) => !c.activo).sort(porNombre)
  const visibles = pestana === 'activas' ? activas : desactivadas
  const lleno = plan?.maxCategorias != null && activas.length >= plan.maxCategorias

  function reemplazar(categoria) {
    setMensaje('')
    setDatos((lista) => lista.map((c) => (c.id === categoria.id ? categoria : c)))
  }

  return (
    <div className="max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Categorías</h1>
          <p className="mt-1 text-sm text-slate-600">Agrupan tus productos en la tienda.</p>
        </div>
        {categorias && (
          <UsoPlan usados={activas.length} limite={plan?.maxCategorias} recurso="categorías activas" plan={plan?.nombre} />
        )}
      </div>

      {/* Solo con la lista cargada: si falló, agregar a una lista desconocida no tiene sentido. */}
      {categorias && puedeEditar && !lleno && (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="mb-3 font-semibold text-slate-900">Nueva categoría</h2>
          <FormularioCategoria
            textoBoton="Agregar categoría"
            onGuardar={async (datos) => {
              const nueva = await crearCategoria(datos)
              setDatos((lista) => [...lista, nueva])
              setPestana('activas')
            }}
          />
        </section>
      )}

      <div className="mt-8">
        <Pestanas
          valor={pestana}
          onChange={setPestana}
          opciones={[
            { valor: 'activas', texto: 'Activas', cantidad: activas.length },
            { valor: 'desactivadas', texto: 'Desactivadas', cantidad: desactivadas.length },
          ]}
        />
        <div className="mt-4 space-y-3">
          <Alerta>{error || mensaje}</Alerta>
          {cargando ? (
            <p className="text-slate-500">Cargando categorías…</p>
          ) : visibles.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-8 text-center text-sm text-slate-500">
              {pestana === 'activas'
                ? 'Todavía no tienes categorías.'
                : 'No hay categorías desactivadas. Al desactivar una, aparece aquí para poder reactivarla.'}
            </p>
          ) : (
            <ul className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
              {visibles.map((categoria) => (
                <FilaCategoria
                  key={categoria.id}
                  categoria={categoria}
                  puedeEditar={puedeEditar}
                  onCambio={reemplazar}
                  onError={setMensaje}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
