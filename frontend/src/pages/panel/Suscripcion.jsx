import { useCallback, useState } from 'react'
import { listarPlanes } from '../../api/planes'
import { cambiarPlanDePrueba, cancelarSuscripcion, contratarPlan, listarSuscripciones } from '../../api/suscripciones'
import { obtenerTienda } from '../../api/tiendas'
import Alerta from '../../components/ui/Alerta'
import Boton from '../../components/ui/Boton'
import BotonConfirmar from '../../components/ui/BotonConfirmar'
import Insignia from '../../components/ui/Insignia'
import { useTiendas } from '../../context/TiendaContext'
import { useDatos } from '../../hooks/useDatos'
import { diasRestantes, formatearFecha, formatearSoles } from '../../utils/formato'

const ESTADOS = {
  ACTIVA: { texto: 'Activa', tono: 'verde' },
  VENCIDA: { texto: 'Vencida', tono: 'gris' },
  CANCELADA: { texto: 'Cerrada', tono: 'gris' },
}

/** Qué se puede hacer con cada plan según la suscripción vigente (mismas reglas que el backend). */
function accionesDelPlan(plan, vigente) {
  if (!vigente) return { contratar: 'Contratar' }
  if (vigente.tipo === 'PRUEBA') {
    return plan.id === vigente.planId
      ? { contratar: 'Contratar', nota: 'Plan de tu prueba' }
      : { contratar: 'Contratar', cambiarPrueba: true }
  }
  return plan.id === vigente.planId
    ? { contratar: 'Renovar', nota: 'Tu plan actual' }
    : { nota: 'Disponible cuando venza tu plan actual' }
}

function TarjetaPlan({ plan, vigente, puedeContratar, onContratar, onCambiarPrueba }) {
  const acciones = accionesDelPlan(plan, vigente)
  const esActual = plan.id === vigente?.planId

  return (
    <article
      className={`flex flex-col rounded-2xl border bg-white p-5 ${esActual ? 'border-marca-600 ring-1 ring-marca-600' : 'border-slate-200'}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-slate-900">{plan.nombre}</h3>
        {acciones.nota && <Insignia tono={esActual ? 'verde' : 'gris'}>{acciones.nota}</Insignia>}
      </div>
      <p className="mt-2">
        <span className="text-2xl font-bold text-slate-900">{formatearSoles(plan.precio)}</span>
        <span className="text-sm text-slate-500"> / mes</span>
      </p>
      <ul className="mt-3 flex-1 space-y-1 text-sm text-slate-600">
        <li>Hasta {plan.maxProductos} productos activos</li>
        <li>Hasta {plan.maxCategorias} categorías</li>
        <li>{plan.maxImagenesProducto} imágenes por producto</li>
      </ul>
      {puedeContratar && (
        <div className="mt-4 flex flex-col gap-2">
          {acciones.contratar && (
            <BotonConfirmar
              className="w-full"
              pregunta={`Pagar ${formatearSoles(plan.precio)} (simulado)`}
              textoConfirmar="Pagar"
              varianteConfirmar="primario"
              onConfirmar={() => onContratar(plan)}
            >
              {acciones.contratar}
            </BotonConfirmar>
          )}
          {acciones.cambiarPrueba && (
            <Boton variante="secundario" className="w-full" onClick={() => onCambiarPrueba(plan)}>
              Probar este plan
            </Boton>
          )}
        </div>
      )}
    </article>
  )
}

export default function Suscripcion() {
  const { tienda, guardarEnLista } = useTiendas()
  const cargar = useCallback(() => Promise.all([listarSuscripciones(), listarPlanes()]), [])
  const { datos, cargando, error, recargar } = useDatos(cargar)
  const [historial, planes] = datos ?? [[], []]
  const [aviso, setAviso] = useState({ tipo: 'error', texto: '' })

  const vigente = historial.find((s) => s.vigente) ?? null
  // Con la tienda desactivada el backend no permite contratar.
  const puedeContratar = tienda.activo

  /** Tras cada cambio se recarga el historial y el estado de la tienda (publicada, plan, límites). */
  async function ejecutar(accion, exito) {
    setAviso({ tipo: 'error', texto: '' })
    try {
      await accion()
      await recargar()
      guardarEnLista(await obtenerTienda(tienda.id))
      setAviso({ tipo: 'exito', texto: exito })
    } catch (e) {
      setAviso({ tipo: 'error', texto: e.message })
    }
  }

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-semibold text-slate-900">Suscripción</h1>
      <p className="mt-1 text-sm text-slate-600">
        El pago es simulado: no se cobra nada. La tienda es visible al público solo con un plan pagado vigente.
      </p>

      <div className="mt-6 space-y-6">
        <Alerta tipo={aviso.tipo}>{aviso.texto || error}</Alerta>

        {cargando ? (
          <p className="text-slate-500">Cargando…</p>
        ) : (
          <>
            <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
              {vigente ? (
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-500">{vigente.tipo === 'PRUEBA' ? 'Prueba gratuita' : 'Plan contratado'}</p>
                    <p className="text-xl font-semibold text-slate-900">{vigente.planNombre}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {vigente.tipo === 'PRUEBA' ? 'Termina' : 'Vigente hasta'} el {formatearFecha(vigente.fechaFin)} ·{' '}
                      {diasRestantes(vigente.fechaFin)} días restantes
                    </p>
                  </div>
                  <Insignia tono={vigente.tipo === 'PRUEBA' ? 'ambar' : 'verde'}>
                    {vigente.tipo === 'PRUEBA' ? 'No visible al público' : 'Tienda publicada'}
                  </Insignia>
                </div>
              ) : (
                <div>
                  <p className="text-xl font-semibold text-slate-900">Sin suscripción vigente</p>
                  <p className="mt-1 text-sm text-slate-600">
                    La tienda está en modo de solo lectura. Contrata un plan para volver a administrarla y publicarla.
                  </p>
                </div>
              )}
              {!tienda.activo && (
                <p className="mt-3 text-sm text-slate-600">
                  La tienda está desactivada: reactívala en Configuración para poder contratar.
                </p>
              )}
            </section>

            <section>
              <h2 className="font-semibold text-slate-900">Planes</h2>
              {vigente?.tipo === 'PRUEBA' && (
                <p className="mt-1 text-sm text-slate-600">
                  "Probar este plan" cambia el plan de la prueba sin reiniciar sus días. "Contratar" termina la prueba y
                  publica la tienda.
                </p>
              )}
              {vigente?.tipo === 'PAGADA' && (
                <p className="mt-1 text-sm text-slate-600">
                  Renovar suma un mes desde el {formatearFecha(vigente.fechaFin)}. Podrás cambiar de plan cuando venza.
                </p>
              )}
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                {planes.map((plan) => (
                  <TarjetaPlan
                    key={plan.id}
                    plan={plan}
                    vigente={vigente}
                    puedeContratar={puedeContratar}
                    onContratar={(p) =>
                      ejecutar(
                        () => contratarPlan(p.id),
                        vigente?.tipo === 'PAGADA' ? `Plan ${p.nombre} renovado.` : `Plan ${p.nombre} contratado. Tu tienda ya es visible al público.`,
                      )
                    }
                    onCambiarPrueba={(p) => ejecutar(() => cambiarPlanDePrueba(p.id), `Ahora tu prueba usa el plan ${p.nombre}.`)}
                  />
                ))}
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Si pasas a un plan con límites menores, no se borra nada, pero no podrás crear más hasta estar por debajo
                del límite.
              </p>
            </section>

            {historial.length > 0 && (
              <section>
                <h2 className="font-semibold text-slate-900">Historial</h2>
                <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                  <table className="w-full min-w-[36rem] text-left text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500 uppercase">
                      <tr>
                        <th className="px-4 py-3">Plan</th>
                        <th className="px-4 py-3">Tipo</th>
                        <th className="px-4 py-3">Periodo</th>
                        <th className="px-4 py-3 text-right">Pagado</th>
                        <th className="px-4 py-3">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {historial.map((s) => {
                        const estado = s.vigente ? { texto: 'Vigente', tono: 'verde' } : ESTADOS[s.estado] ?? ESTADOS.VENCIDA
                        return (
                          <tr key={s.id}>
                            <td className="px-4 py-3 font-medium text-slate-900">{s.planNombre}</td>
                            <td className="px-4 py-3 text-slate-600">{s.tipo === 'PRUEBA' ? 'Prueba' : 'Pago'}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                              {formatearFecha(s.fechaInicio)} – {formatearFecha(s.fechaFin)}
                            </td>
                            <td className="px-4 py-3 text-right text-slate-900 tabular-nums">
                              {s.montoPagado != null ? formatearSoles(s.montoPagado) : '—'}
                            </td>
                            <td className="px-4 py-3">
                              <Insignia tono={estado.tono}>{estado.texto}</Insignia>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {vigente && puedeContratar && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
                <h2 className="font-semibold text-slate-900">Cancelar suscripción</h2>
                <p className="mt-1 text-sm text-slate-600">
                  {vigente.tipo === 'PRUEBA'
                    ? 'Termina la prueba ahora. Cada tienda tiene una sola prueba gratuita: no podrás volver a empezarla.'
                    : 'La tienda deja de estar publicada de inmediato y queda en solo lectura. El pago queda en el historial.'}
                </p>
                <div className="mt-4">
                  <BotonConfirmar
                    pregunta="¿Seguro que quieres cancelarla?"
                    textoConfirmar="Sí, cancelar"
                    onConfirmar={() => ejecutar(cancelarSuscripcion, 'Suscripción cancelada.')}
                  >
                    Cancelar suscripción
                  </BotonConfirmar>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}
