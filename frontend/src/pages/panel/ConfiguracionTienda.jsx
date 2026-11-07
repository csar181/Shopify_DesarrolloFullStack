import { useState } from 'react'
import { activarTienda, actualizarTienda, desactivarTienda } from '../../api/tiendas'
import CamposTienda from '../../components/tienda/CamposTienda'
import Alerta from '../../components/ui/Alerta'
import Boton from '../../components/ui/Boton'
import { useTiendas } from '../../context/TiendaContext'
import { datosInicialesTienda, vaciosANull } from '../../utils/tienda'

function FormularioDatos({ tienda, onGuardada }) {
  const [datos, setDatos] = useState(() => datosInicialesTienda(tienda))
  const [errores, setErrores] = useState({})
  const [aviso, setAviso] = useState({ tipo: 'error', texto: '' })
  const [enviando, setEnviando] = useState(false)

  // El backend solo permite editar una tienda activa y con suscripción vigente.
  const bloqueada = !tienda.administrable

  function cambiar(evento) {
    setDatos({ ...datos, [evento.target.name]: evento.target.value })
  }

  async function enviar(evento) {
    evento.preventDefault()
    setEnviando(true)
    setErrores({})
    setAviso({ tipo: 'error', texto: '' })
    try {
      onGuardada(await actualizarTienda(tienda.id, vaciosANull(datos)))
      setAviso({ tipo: 'exito', texto: 'Cambios guardados.' })
    } catch (error) {
      setErrores(error.errores ?? {})
      setAviso({
        tipo: 'error',
        texto: Object.keys(error.errores ?? {}).length > 0 ? 'Revisa los campos marcados.' : error.message,
      })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="space-y-6">
      <Alerta tipo={aviso.tipo}>{aviso.texto}</Alerta>
      <CamposTienda datos={datos} errores={errores} onChange={cambiar} deshabilitado={bloqueada} />
      <div className="flex justify-end border-t border-slate-200 pt-6">
        <Boton type="submit" cargando={enviando} disabled={bloqueada}>
          Guardar cambios
        </Boton>
      </div>
    </form>
  )
}

function ZonaEstado({ tienda, onCambio }) {
  const [confirmando, setConfirmando] = useState(false)
  const [procesando, setProcesando] = useState(false)
  const [error, setError] = useState('')

  async function ejecutar(accion) {
    setProcesando(true)
    setError('')
    try {
      await accion()
      setConfirmando(false)
    } catch (e) {
      setError(e.message)
    } finally {
      setProcesando(false)
    }
  }

  return (
    <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6">
      {tienda.activo ? (
        <>
          <h2 className="font-semibold text-slate-900">Desactivar tienda</h2>
          <p className="mt-1 text-sm text-slate-600">
            Deja de estar visible al público y no podrás modificarla hasta reactivarla. No se borra nada: podrás
            seguir consultando y gestionando sus pedidos.
          </p>
        </>
      ) : (
        <>
          <h2 className="font-semibold text-slate-900">Reactivar tienda</h2>
          <p className="mt-1 text-sm text-slate-600">
            Vuelve a quedar administrable. Si su suscripción ya venció, después tendrás que contratar un plan.
          </p>
        </>
      )}

      <div className="mt-4 space-y-3">
        <Alerta>{error}</Alerta>
        {!tienda.activo ? (
          <Boton cargando={procesando} onClick={() => ejecutar(onCambio.activar)}>
            Reactivar tienda
          </Boton>
        ) : confirmando ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-slate-800">¿Seguro que quieres desactivarla?</span>
            <Boton variante="peligro" cargando={procesando} onClick={() => ejecutar(onCambio.desactivar)}>
              Sí, desactivar
            </Boton>
            <Boton variante="secundario" onClick={() => setConfirmando(false)} disabled={procesando}>
              Cancelar
            </Boton>
          </div>
        ) : (
          <Boton variante="secundario" onClick={() => setConfirmando(true)} className="text-red-700">
            Desactivar tienda
          </Boton>
        )}
      </div>
    </section>
  )
}

export default function ConfiguracionTienda() {
  // RequiereTienda (en App.jsx) garantiza que hay una tienda elegida.
  const { tienda, guardarEnLista, recargar } = useTiendas()

  const cambioDeEstado = {
    activar: async () => guardarEnLista(await activarTienda(tienda.id)),
    desactivar: async () => {
      await desactivarTienda(tienda.id)
      await recargar()
    },
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold text-slate-900">Configuración</h1>
      <p className="mt-1 text-sm text-slate-600">
        Dirección de la tienda: <span className="font-medium text-slate-800">/tienda/{tienda.slug}</span>
      </p>

      <div className="mt-6">
        {/* key: al cambiar de tienda, el formulario se reinicia con sus datos. */}
        <FormularioDatos key={tienda.id} tienda={tienda} onGuardada={guardarEnLista} />
      </div>

      <ZonaEstado key={`estado-${tienda.id}`} tienda={tienda} onCambio={cambioDeEstado} />
    </div>
  )
}
