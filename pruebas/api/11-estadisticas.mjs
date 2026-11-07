// Estadísticas: cifras cuadradas a mano y bloqueo según el plan (PR #17).
// Necesita acceso a la base (DB_PASSWORD) para mover un pedido a hace 3 días; ver docs/PRUEBAS.md.
import { comprar, iso, llamar, nuevaTienda, nuevoCliente, nuevoProducto, nuevoPropietario, ok, seccion, sql, terminar } from './comun.mjs'

const token = await nuevoPropietario('Prueba Estadisticas')
const { tienda: t, P } = await nuevaTienda(token, 'Estadísticas Profesional', { planNombre: 'Profesional', publicada: true })
const a = await nuevoProducto(P, 'Polo A', 50, 50)
const b = await nuevoProducto(P, 'Gorra B', 30, 50)
const yape = (await llamar('POST', '/gestion/metodos-pago', { ...P, cuerpo: { nombre: 'Yape', tipo: 'YAPE' } })).d
const ana = await nuevoCliente(t.slug, 'Ana')
const beto = await nuevoCliente(t.slug, 'Beto')
await comprar(ana, yape.id, [[a, 3]]) //               S/ 150 hoy
await comprar(beto, yape.id, [[a, 1], [b, 1]]) //       S/ 80 hoy
const p3 = await comprar(ana, yape.id, [[b, 2]]) //     S/ 60 → se mueve a hace 3 días
const p4 = await comprar(beto, yape.id, [[a, 4]]) //   S/ 200 → se cancela: no cuenta
await llamar('PATCH', `/gestion/pedidos/${p4.id}/estado`, { ...P, cuerpo: { estado: 'CANCELADO' } })
sql(`UPDATE pedidos SET creado_en = creado_en - interval '3 days' WHERE id = ${p3.id}`)
const hace3 = new Date()
hace3.setDate(hace3.getDate() - 3)
console.log('Ventas: hoy S/ 150 + S/ 80 (Ana y Beto), hace 3 días S/ 60 (Ana), cancelado S/ 200')

const hoy = iso(new Date())
const q = `desde=${iso(new Date(Date.now() - 6 * 864e5))}&hasta=${hoy}`

seccion('Resumen (todos los planes)')
let r = await llamar('GET', `/analitica/dashboard?${q}`, P)
ok(Number(r.d.ventasTotales) === 290 && r.d.pedidosPagados === 3, `7 días: S/ ${r.d.ventasTotales} en ${r.d.pedidosPagados} pedidos (sin el cancelado)`)
ok(r.d.productosVendidos === 7 && r.d.clientesCompradores === 2, `${r.d.productosVendidos} unidades, ${r.d.clientesCompradores} clientes`)
ok(Number(r.d.ticketPromedio) === 96.67, `ticket promedio S/ ${r.d.ticketPromedio} (290 / 3)`)
r = await llamar('GET', `/analitica/dashboard?desde=${hoy}&hasta=${hoy}`, P)
ok(Number(r.d.ventasTotales) === 230, `solo hoy: S/ ${r.d.ventasTotales} (el de hace 3 días queda fuera)`)
r = await llamar('GET', '/analitica/dashboard', P)
ok(r.d.desde.endsWith('-01'), `sin fechas usa el mes actual: ${r.d.desde} a ${r.d.hasta}`)
r = await llamar('GET', `/analitica/dashboard?desde=${hoy}&hasta=2000-01-01`, P)
ok(r.s === 400, `"desde" posterior a "hasta": "${r.d.detail}"`)

seccion('Ventas por día (Crecimiento y Profesional)')
r = await llamar('GET', `/analitica/ventas?${q}`, P)
ok(r.d.length === 2, `solo vienen los días con ventas (el gráfico completa el resto con 0): ${r.d.map((d) => `${d.fecha} S/ ${d.montoVentas}`).join(' | ')}`)
ok(r.d.some((d) => d.fecha === iso(hace3) && Number(d.montoVentas) === 60) && r.d.some((d) => d.fecha === hoy && Number(d.montoVentas) === 230), 'las fechas coinciden con las que arma el frontend (hora local)')

seccion('Más vendidos (Profesional)')
r = await llamar('GET', `/analitica/productos-mas-vendidos?${q}&limite=10`, P)
ok(r.d.length === 2 && r.d[0].nombreProducto === 'Polo A' && Number(r.d[0].cantidadVendida) === 4 && Number(r.d[1].cantidadVendida) === 3,
  `ranking: ${r.d.map((p) => `${p.nombreProducto} ${p.cantidadVendida} u.`).join(', ')}`)

seccion('Bloqueo según el plan')
for (const [planNombre, esperado] of [['Emprendedor', '200/403/403'], ['Crecimiento', '200/200/403']]) {
  const { P: O } = await nuevaTienda(token, `Estadísticas ${planNombre}`, { planNombre, publicada: true })
  const estados = [
    (await llamar('GET', '/analitica/dashboard', O)).s,
    (await llamar('GET', '/analitica/ventas', O)).s,
    (await llamar('GET', '/analitica/productos-mas-vendidos', O)).s,
  ].join('/')
  const codigo = (await llamar('GET', '/analitica/productos-mas-vendidos', O)).d.codigo
  ok(estados === esperado && codigo === 'FUNCIONALIDAD_NO_INCLUIDA', `${planNombre}: resumen/ventas/más vendidos → ${estados} (las secciones con 403 se muestran bloqueadas)`)
}

const yo = (await llamar('GET', '/auth/me', { token })).d
console.log(`\nPara ver estas estadísticas en el navegador: ingresa al panel con ${yo.correoElectronico} / clave12345`)
console.log('y elige la tienda "Estadísticas Profesional" (las otras dos muestran las secciones bloqueadas).')

terminar()
