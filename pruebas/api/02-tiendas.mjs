// Tiendas del propietario y tienda activa (PR #7).
import { llamar, nuevoPropietario, ok, plan, seccion, terminar } from './comun.mjs'

const token = await nuevoPropietario('Prueba Tiendas')

seccion('Crear')
let r = await llamar('POST', '/tiendas', { token, cuerpo: { nombre: '', correoContacto: 'malo' } })
ok(r.s === 400 && r.d.errores.planId && r.d.errores.nombre && r.d.errores.correoContacto, `datos inválidos: ${Object.keys(r.d.errores ?? {}).join(', ')}`)
r = await llamar('POST', '/tiendas', { token, cuerpo: { planId: await plan('Crecimiento'), nombre: 'Café Ñandú', colorPrimario: '#7c3aed' } })
const tienda = r.d
ok(r.s === 201 && tienda.slug.startsWith('cafe-nandu'), `tildes y eñes en el nombre: slug "${tienda.slug}" (igual que la vista previa del formulario)`)
ok(tienda.suscripcionTipo === 'PRUEBA' && tienda.administrable && !tienda.publicada, 'empieza en prueba gratuita: administrable pero no publicada')
r = await llamar('POST', '/tiendas', { token, cuerpo: { planId: await plan('Emprendedor'), nombre: 'Café Ñandú' } })
// En la primera ejecución sale "cafe-nandu-2"; si se repite la prueba, otro número.
ok(r.s === 201 && r.d.slug !== tienda.slug && /^cafe-nandu-\d+$/.test(r.d.slug), `mismo nombre: el backend agrega un número (${r.d.slug})`)
r = await llamar('GET', '/tiendas/mis-tiendas', { token })
ok(r.d.length === 2, 'Mis tiendas lista las dos')

seccion('Editar y tienda activa')
r = await llamar('PUT', `/tiendas/${tienda.id}`, { token, cuerpo: { nombre: 'Café Ñandú Lima', telefonoContacto: '999888777', correoContacto: 'x' } })
ok(r.s === 400 && r.d.errores.correoContacto, 'correo de contacto inválido: error en su campo')
r = await llamar('PUT', `/tiendas/${tienda.id}`, { token, cuerpo: { nombre: 'Café Ñandú Lima', telefonoContacto: '999888777' } })
ok(r.s === 200 && r.d.nombre === 'Café Ñandú Lima', 'editar datos')
r = await llamar('GET', '/suscripciones/activa', { token, tienda: tienda.id })
ok(r.s === 200 && r.d.tipo === 'PRUEBA', 'una ruta de tienda con X-Tenant-ID (la tienda activa del selector)')
r = await llamar('GET', '/suscripciones/activa', { token, tienda: 999999 })
ok(r.s === 403, `X-Tenant-ID de una tienda que no es suya: ${r.s}`)

seccion('Desactivar y reactivar')
r = await llamar('DELETE', `/tiendas/${tienda.id}`, { token })
ok(r.s === 204, 'desactivar')
r = await llamar('PUT', `/tiendas/${tienda.id}`, { token, cuerpo: { nombre: 'X' } })
ok(r.s === 403 && r.d.codigo === 'TIENDA_DESACTIVADA', 'desactivada no se puede editar (el formulario se bloquea)')
r = await llamar('PATCH', `/tiendas/${tienda.id}/activar`, { token })
ok(r.s === 200 && r.d.activo && r.d.administrable, 'reactivar')

terminar()
