import { apiPropietario } from './cliente'

// Suscripción de la tienda actual (X-Tenant-ID). El pago es simulado: no se cobra nada.
//
// Suscripción: { id, tiendaId, planId, planNombre, planPrecio, tipo ('PRUEBA' | 'PAGADA'),
//               estado ('ACTIVA' | 'VENCIDA' | 'CANCELADA'), vigente, fechaInicio, fechaFin,
//               montoPagado, pagadoEn, creadoEn }
//
// Reglas del backend:
// - En prueba: se puede contratar cualquier plan (termina la prueba) o cambiar el plan de la prueba.
// - Con un plan pagado vigente: solo se puede renovar el mismo plan (suma un periodo a la fecha de fin).
// - Sin suscripción vigente: se puede contratar cualquier plan.
// - Con la tienda desactivada no se puede contratar.

/** GET /api/suscripciones: historial, del más reciente al más antiguo. */
export async function listarSuscripciones() {
  const { data } = await apiPropietario.get('/suscripciones')
  return data
}

/** POST /api/suscripciones/contratar { planId }: contrata o renueva (pago simulado). */
export async function contratarPlan(planId) {
  const { data } = await apiPropietario.post('/suscripciones/contratar', { planId })
  return data
}

/** PUT /api/suscripciones/cambiar-plan { planId }: solo durante la prueba, sin cambiar su fecha de fin. */
export async function cambiarPlanDePrueba(planId) {
  const { data } = await apiPropietario.put('/suscripciones/cambiar-plan', { planId })
  return data
}

/** DELETE /api/suscripciones/activa: la tienda deja de estar publicada de inmediato. */
export async function cancelarSuscripcion() {
  await apiPropietario.delete('/suscripciones/activa')
}
