import { useCallback, useState } from 'react'
import {
  actualizarDatosFacturacion,
  actualizarDireccion,
  actualizarPerfil,
  crearDatosFacturacion,
  crearDireccion,
  eliminarDatosFacturacion,
  eliminarDireccion,
  listarDatosFacturacion,
  listarDirecciones,
  obtenerPerfil,
} from '../../api/clienteTienda'
import CuentaCliente from '../../components/tienda-publica/CuentaCliente'
import FormularioDireccion from '../../components/tienda-publica/FormularioDireccion'
import Alerta from '../../components/ui/Alerta'
import Campo from '../../components/ui/Campo'
import { useTiendaPublica } from '../../context/TiendaPublicaContext'
import { useDatos } from '../../hooks/useDatos'
import { textoDireccion } from '../../utils/pedido'

const botonTienda =
  'rounded-lg bg-(--tienda) px-4 py-2 text-sm font-medium text-(--tienda-texto) hover:brightness-95 disabled:opacity-60'
const botonSecundario = 'rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100'

function Seccion({ titulo, descripcion, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 p-5">
      <h2 className="font-semibold text-slate-900">{titulo}</h2>
      {descripcion && <p className="mt-1 text-sm text-slate-500">{descripcion}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}

/** Botón "Eliminar" con confirmación en el mismo lugar. */
function Eliminar({ onConfirmar }) {
  const [confirmando, setConfirmando] = useState(false)
  if (!confirmando) {
    return (
      <button type="button" onClick={() => setConfirmando(true)} className={`${botonSecundario} hover:text-red-700`}>
        Eliminar
      </button>
    )
  }
  return (
    <span className="flex items-center gap-1 text-sm">
      ¿Seguro?
      <button
        type="button"
        onClick={async () => {
          await onConfirmar()
          setConfirmando(false)
        }}
        className="rounded-lg px-2 py-1.5 font-semibold text-red-700 hover:bg-red-50"
      >
        Sí, eliminar
      </button>
      <button type="button" onClick={() => setConfirmando(false)} className={botonSecundario}>
        No
      </button>
    </span>
  )
}

function Perfil({ slug }) {
  const { actualizarCliente } = useTiendaPublica()
  const cargar = useCallback(() => obtenerPerfil(slug), [slug])
  const { datos: perfil, error } = useDatos(cargar)
  if (!perfil) return error ? <Alerta>{error}</Alerta> : <p className="text-sm text-slate-500">Cargando…</p>
  return <FormularioPerfil key={perfil.id} perfil={perfil} slug={slug} onGuardado={actualizarCliente} />
}

function FormularioPerfil({ perfil, slug, onGuardado }) {
  const [datos, setDatos] = useState({ nombre: perfil.nombre, telefono: perfil.telefono ?? '' })
  const [errores, setErrores] = useState({})
  const [aviso, setAviso] = useState({ tipo: 'error', texto: '' })
  const [enviando, setEnviando] = useState(false)

  async function enviar(evento) {
    evento.preventDefault()
    setEnviando(true)
    setErrores({})
    setAviso({ tipo: 'error', texto: '' })
    try {
      const actualizado = await actualizarPerfil(slug, { nombre: datos.nombre, telefono: datos.telefono.trim() || null })
      onGuardado({ nombre: actualizado.nombre })
      setAviso({ tipo: 'exito', texto: 'Datos guardados.' })
    } catch (e) {
      setErrores(e.errores ?? {})
      setAviso({ tipo: 'error', texto: Object.keys(e.errores ?? {}).length > 0 ? '' : e.message })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="space-y-3">
      <Alerta tipo={aviso.tipo}>{aviso.texto}</Alerta>
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo
          etiqueta="Nombre"
          maxLength={150}
          value={datos.nombre}
          onChange={(e) => setDatos({ ...datos, nombre: e.target.value })}
          error={errores.nombre}
        />
        <Campo
          etiqueta="Teléfono"
          type="tel"
          maxLength={30}
          value={datos.telefono}
          onChange={(e) => setDatos({ ...datos, telefono: e.target.value })}
          error={errores.telefono}
        />
      </div>
      <Campo etiqueta="Correo electrónico" value={perfil.correoElectronico} disabled ayuda="No se puede cambiar." />
      <button type="submit" disabled={enviando} className={botonTienda}>
        {enviando ? 'Guardando…' : 'Guardar'}
      </button>
    </form>
  )
}

function Direcciones({ slug }) {
  const cargar = useCallback(() => listarDirecciones(slug), [slug])
  const { datos: direcciones, error, setDatos } = useDatos(cargar)
  const [editando, setEditando] = useState(null) // id, 'nueva' o null
  const [mensaje, setMensaje] = useState('')

  if (!direcciones) return error ? <Alerta>{error}</Alerta> : <p className="text-sm text-slate-500">Cargando…</p>

  async function eliminar(id) {
    setMensaje('')
    try {
      await eliminarDireccion(slug, id)
      setDatos((actuales) => actuales.filter((d) => d.id !== id))
    } catch (e) {
      // Por ejemplo: "No se puede eliminar una dirección utilizada en un pedido".
      setMensaje(e.message)
    }
  }

  return (
    <div className="space-y-3">
      <Alerta>{mensaje}</Alerta>
      {direcciones.length === 0 && editando !== 'nueva' && (
        <p className="text-sm text-slate-500">Todavía no guardaste direcciones. También puedes agregarlas al comprar.</p>
      )}
      <ul className="space-y-2">
        {direcciones.map((d) =>
          editando === d.id ? (
            <li key={d.id} className="rounded-xl border border-dashed border-slate-300 p-4">
              <FormularioDireccion
                inicial={d}
                textoBoton="Guardar cambios"
                onCancelar={() => setEditando(null)}
                onGuardar={async (cuerpo) => {
                  const actualizada = await actualizarDireccion(slug, d.id, cuerpo)
                  setDatos((actuales) => actuales.map((x) => (x.id === d.id ? actualizada : x)))
                  setEditando(null)
                }}
              />
            </li>
          ) : (
            <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 px-4 py-3">
              <div className="min-w-0 text-sm">
                <p className="font-medium text-slate-900">{textoDireccion(d)}</p>
                {d.referencia && <p className="text-slate-500">Ref.: {d.referencia}</p>}
              </div>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => setEditando(d.id)} className={botonSecundario}>
                  Editar
                </button>
                <Eliminar onConfirmar={() => eliminar(d.id)} />
              </div>
            </li>
          ),
        )}
      </ul>
      {editando === 'nueva' ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-4">
          <FormularioDireccion
            onCancelar={() => setEditando(null)}
            onGuardar={async (cuerpo) => {
              const nueva = await crearDireccion(slug, cuerpo)
              setDatos((actuales) => [...actuales, nueva])
              setEditando(null)
            }}
          />
        </div>
      ) : (
        <button type="button" onClick={() => setEditando('nueva')} className="text-sm font-semibold text-slate-700 underline">
          + Agregar dirección
        </button>
      )}
    </div>
  )
}

const DOCUMENTOS = {
  DNI: { digitos: 8, nombre: 'Nombre completo', comprobante: 'boleta' },
  RUC: { digitos: 11, nombre: 'Razón social', comprobante: 'factura' },
}

function FormularioFacturacion({ inicial, onGuardar, onCancelar }) {
  const [datos, setDatos] = useState({
    tipoDocumento: inicial?.tipoDocumento ?? 'DNI',
    numeroDocumento: inicial?.numeroDocumento ?? '',
    nombreRazonSocial: inicial?.nombreRazonSocial ?? '',
    direccionFiscal: inicial?.direccionFiscal ?? '',
  })
  const [errores, setErrores] = useState({})
  const [mensaje, setMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)
  const reglas = DOCUMENTOS[datos.tipoDocumento]

  async function enviar(evento) {
    evento.preventDefault()
    setMensaje('')
    // Misma regla que el backend: DNI de 8 dígitos, RUC de 11.
    if (!new RegExp(`^\\d{${reglas.digitos}}$`).test(datos.numeroDocumento)) {
      setErrores({ numeroDocumento: `El ${datos.tipoDocumento} debe tener ${reglas.digitos} dígitos.` })
      return
    }
    setEnviando(true)
    setErrores({})
    try {
      await onGuardar({
        ...datos,
        nombreRazonSocial: datos.nombreRazonSocial.trim(),
        direccionFiscal: datos.tipoDocumento === 'RUC' ? datos.direccionFiscal.trim() || null : null,
      })
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
      <div className="grid gap-3 sm:grid-cols-[8rem_10rem_1fr]">
        <Campo
          etiqueta="Documento"
          seleccion
          value={datos.tipoDocumento}
          onChange={(e) => setDatos({ ...datos, tipoDocumento: e.target.value, numeroDocumento: '' })}
        >
          <option value="DNI">DNI</option>
          <option value="RUC">RUC</option>
        </Campo>
        <Campo
          etiqueta="Número"
          inputMode="numeric"
          maxLength={reglas.digitos}
          value={datos.numeroDocumento}
          onChange={(e) => setDatos({ ...datos, numeroDocumento: e.target.value.replace(/\D/g, '') })}
          error={errores.numeroDocumento}
        />
        <Campo
          etiqueta={reglas.nombre}
          maxLength={150}
          value={datos.nombreRazonSocial}
          onChange={(e) => setDatos({ ...datos, nombreRazonSocial: e.target.value })}
          error={errores.nombreRazonSocial}
        />
      </div>
      {datos.tipoDocumento === 'RUC' && (
        <Campo
          etiqueta="Dirección fiscal (opcional)"
          maxLength={255}
          value={datos.direccionFiscal}
          onChange={(e) => setDatos({ ...datos, direccionFiscal: e.target.value })}
          error={errores.direccionFiscal}
        />
      )}
      <div className="flex gap-2">
        <button type="submit" disabled={enviando} className={botonTienda}>
          {enviando ? 'Guardando…' : 'Guardar'}
        </button>
        <button type="button" onClick={onCancelar} className={botonSecundario}>
          Cancelar
        </button>
      </div>
    </form>
  )
}

function Facturacion({ slug }) {
  const cargar = useCallback(() => listarDatosFacturacion(slug), [slug])
  const { datos: lista, error, setDatos } = useDatos(cargar)
  const [editando, setEditando] = useState(null)
  const [mensaje, setMensaje] = useState('')

  if (!lista) return error ? <Alerta>{error}</Alerta> : <p className="text-sm text-slate-500">Cargando…</p>

  async function eliminar(id) {
    setMensaje('')
    try {
      await eliminarDatosFacturacion(slug, id)
      setDatos((actuales) => actuales.filter((d) => d.id !== id))
    } catch (e) {
      setMensaje(e.message)
    }
  }

  return (
    <div className="space-y-3">
      <Alerta>{mensaje}</Alerta>
      {lista.length === 0 && editando !== 'nuevo' && (
        <p className="text-sm text-slate-500">Al pagar puedes guardar tus datos de boleta o factura para la próxima vez.</p>
      )}
      <ul className="space-y-2">
        {lista.map((d) =>
          editando === d.id ? (
            <li key={d.id} className="rounded-xl border border-dashed border-slate-300 p-4">
              <FormularioFacturacion
                inicial={d}
                onCancelar={() => setEditando(null)}
                onGuardar={async (cuerpo) => {
                  const actualizado = await actualizarDatosFacturacion(slug, d.id, cuerpo)
                  setDatos((actuales) => actuales.map((x) => (x.id === d.id ? actualizado : x)))
                  setEditando(null)
                }}
              />
            </li>
          ) : (
            <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 px-4 py-3">
              <div className="min-w-0 text-sm">
                <p className="font-medium text-slate-900">{d.nombreRazonSocial}</p>
                <p className="text-slate-500">
                  {d.tipoDocumento} {d.numeroDocumento} · para {DOCUMENTOS[d.tipoDocumento]?.comprobante ?? 'comprobante'}
                </p>
                {d.direccionFiscal && <p className="text-slate-500">{d.direccionFiscal}</p>}
              </div>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => setEditando(d.id)} className={botonSecundario}>
                  Editar
                </button>
                <Eliminar onConfirmar={() => eliminar(d.id)} />
              </div>
            </li>
          ),
        )}
      </ul>
      {editando === 'nuevo' ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-4">
          <FormularioFacturacion
            onCancelar={() => setEditando(null)}
            onGuardar={async (cuerpo) => {
              const nuevo = await crearDatosFacturacion(slug, cuerpo)
              setDatos((actuales) => [...actuales, nuevo])
              setEditando(null)
            }}
          />
        </div>
      ) : (
        <button type="button" onClick={() => setEditando('nuevo')} className="text-sm font-semibold text-slate-700 underline">
          + Agregar datos
        </button>
      )}
    </div>
  )
}

function Contenido() {
  const { slug } = useTiendaPublica()
  return (
    <div className="space-y-5">
      <Seccion titulo="Perfil">
        <Perfil slug={slug} />
      </Seccion>
      <Seccion titulo="Direcciones de envío">
        <Direcciones slug={slug} />
      </Seccion>
      <Seccion titulo="Datos de facturación" descripcion="DNI para boleta y RUC para factura.">
        <Facturacion slug={slug} />
      </Seccion>
    </div>
  )
}

export default function MisDatos() {
  return (
    <CuentaCliente titulo="Mi cuenta" volver="cuenta">
      <Contenido />
    </CuentaCliente>
  )
}
