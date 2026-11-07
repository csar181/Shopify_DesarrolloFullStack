// Suscripción: prueba gratuita, contratar, renovar, cancelar y tienda pública (PR #11).
import { API, llamar, nuevaTienda, nuevoPropietario, ok, plan, seccion, terminar } from './comun.mjs'

const token = await nuevoPropietario('Prueba Suscripcion')
const { tienda: t, P } = await nuevaTienda(token, 'Prueba Suscripción', { planNombre: 'Emprendedor' })
const publica = async () => (await fetch(`${API}/publico/tiendas/${t.slug}`)).status
const dia = (f) => f.slice(0, 10)

seccion('Prueba gratuita')
let h = (await llamar('GET', '/suscripciones', P)).d
const finPrueba = h[0].fechaFin
ok(h.length === 1 && h[0].tipo === 'PRUEBA' && h[0].vigente, `7 días de prueba, hasta ${dia(finPrueba)}`)
ok((await publica()) === 404, 'en prueba la tienda pública no se ve (404)')
let r = await llamar('PUT', '/suscripciones/cambiar-plan', { ...P, cuerpo: { planId: await plan('Crecimiento') } })
ok(r.s === 200 && r.d.planNombre === 'Crecimiento' && r.d.fechaFin === finPrueba, '"Probar este plan": cambia el plan sin cambiar la fecha de fin')

seccion('Contratar')
r = await llamar('POST', '/suscripciones/contratar', { ...P, cuerpo: { planId: await plan('Profesional') } })
const finPagado = r.d.fechaFin
ok(r.s === 201 && r.d.tipo === 'PAGADA' && Number(r.d.montoPagado) === 99, `contratar Profesional: S/ ${r.d.montoPagado}, hasta ${dia(finPagado)}`)
const ahora = (await llamar('GET', `/tiendas/${t.id}`, { token })).d
ok(ahora.publicada && ahora.planNombre === 'Profesional', 'la tienda queda publicada')
ok((await publica()) === 200, 'la tienda pública ya responde')
h = (await llamar('GET', '/suscripciones', P)).d
ok(h.find((s) => s.tipo === 'PRUEBA').estado === 'CANCELADA', 'en el historial, la prueba queda cerrada')

seccion('Con plan pagado')
r = await llamar('PUT', '/suscripciones/cambiar-plan', { ...P, cuerpo: { planId: await plan('Emprendedor') } })
ok(r.s === 409, `cambiar de plan: ${r.s} "${r.d.detail}"`)
r = await llamar('POST', '/suscripciones/contratar', { ...P, cuerpo: { planId: await plan('Emprendedor') } })
ok(r.s === 409, `contratar otro plan: ${r.s}`)
r = await llamar('POST', '/suscripciones/contratar', { ...P, cuerpo: { planId: await plan('Profesional') } })
const esperado = new Date(finPagado)
esperado.setMonth(esperado.getMonth() + 1)
ok(r.s === 201 && dia(r.d.fechaFin) === esperado.toISOString().slice(0, 10), `renovar suma un mes desde el fin: ${dia(finPagado)} → ${dia(r.d.fechaFin)}`)

seccion('Cancelar y tienda desactivada')
r = await llamar('DELETE', '/suscripciones/activa', P)
ok(r.s === 204, 'cancelar')
const t2 = (await llamar('GET', `/tiendas/${t.id}`, { token })).d
ok(!t2.publicada && !t2.administrable && t2.suscripcionTipo === null, 'queda en solo lectura')
ok((await publica()) === 404, 'la tienda pública vuelve a 404')
r = await llamar('POST', '/categorias', { ...P, cuerpo: { nombre: 'X' } })
ok(r.s === 403 && r.d.codigo === 'SUSCRIPCION_REQUERIDA', `crear algo en solo lectura: ${r.s} ${r.d.codigo}`)
await llamar('DELETE', `/tiendas/${t.id}`, { token })
r = await llamar('POST', '/suscripciones/contratar', { ...P, cuerpo: { planId: await plan('Emprendedor') } })
ok(r.s === 403 && r.d.codigo === 'TIENDA_DESACTIVADA', `contratar con la tienda desactivada: ${r.s} ${r.d.codigo}`)
await llamar('PATCH', `/tiendas/${t.id}/activar`, { token })
r = await llamar('POST', '/suscripciones/contratar', { ...P, cuerpo: { planId: await plan('Emprendedor') } })
ok(r.s === 201 && r.d.planNombre === 'Emprendedor', 'reactivada, se puede contratar otro plan')

terminar()
