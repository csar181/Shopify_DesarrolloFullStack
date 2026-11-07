// Gestión de pedidos y clientes desde el panel (PR #14).
import { API, comprar, llamar, nuevaTienda, nuevoCliente, nuevoProducto, nuevoPropietario, ok, seccion, terminar } from './comun.mjs'

const token = await nuevoPropietario('Prueba Pedidos')
const { tienda: t, P } = await nuevaTienda(token, 'Prueba Pedidos', { publicada: true })
const gorra = await nuevoProducto(P, 'Gorra', 50, 10)
const yape = (await llamar('POST', '/gestion/metodos-pago', { ...P, cuerpo: { nombre: 'Yape', tipo: 'YAPE' } })).d
const rosa = await nuevoCliente(t.slug, 'Rosa Díaz')
const p1 = await comprar(rosa, yape.id, [[gorra, 3]])
const p2 = await comprar(rosa, yape.id, [[gorra, 2]])
const stock = async () => (await (await fetch(`${API}/publico/tiendas/${t.slug}/productos/${gorra.id}`)).json()).stock
console.log(`Tienda ${t.slug}: pedidos #${p1.id} (3 gorras) y #${p2.id} (2 gorras)`)

seccion('Lista y detalle')
let r = await llamar('GET', '/gestion/pedidos', P)
ok(r.d.length === 2 && r.d.every((p) => p.estado === 'CONFIRMADO' && p.clienteNombre === 'Rosa Díaz' && p.numeroComprobante), 'los dos pedidos, confirmados, con cliente y comprobante')
r = await llamar('GET', `/gestion/pedidos/${p1.id}`, P)
ok(r.s === 200 && r.d.elementos.length === 1 && r.d.transaccion && r.d.comprobante, 'detalle con productos, pago y comprobante')

seccion('Recorrido del pedido 1')
const estado = (id, nuevo) => llamar('PATCH', `/gestion/pedidos/${id}/estado`, { ...P, cuerpo: { estado: nuevo } })
r = await estado(p1.id, 'ENVIADO')
ok(r.s === 409, `saltar de CONFIRMADO a ENVIADO: "${r.d.detail}"`)
for (const nuevo of ['PREPARANDO', 'ENVIADO']) {
  r = await estado(p1.id, nuevo)
  ok(r.s === 200 && r.d.estado === nuevo, `→ ${nuevo}`)
}
r = await estado(p1.id, 'CANCELADO')
ok(r.s === 409, `cancelar un pedido ENVIADO: "${r.d.detail}" (el botón desaparece)`)
r = await estado(p1.id, 'ENTREGADO')
ok(r.s === 200 && r.d.estado === 'ENTREGADO', '→ ENTREGADO')
r = await estado(p1.id, 'PREPARANDO')
ok(r.s === 409, 'no se puede volver atrás')

seccion('Cancelar el pedido 2')
const antes = await stock()
r = await estado(p2.id, 'CANCELADO')
ok(r.s === 200 && r.d.transaccion.estado === 'ANULADA' && r.d.comprobante.estado === 'ANULADO', 'cancelar: pago ANULADA y comprobante ANULADO')
ok((await stock()) === antes + 2, `el stock vuelve de ${antes} a ${antes + 2}`)
r = await llamar('GET', `/pedidos/${p2.id}`, rosa)
ok(r.d.estado === 'CANCELADO', 'el cliente también lo ve cancelado')

seccion('Clientes')
r = await llamar('GET', '/clientes', P)
ok(r.d.length === 1 && r.d[0].nombre === 'Rosa Díaz', 'lista de clientes')
const clienteId = r.d[0].id
ok((await llamar('GET', `/clientes/${clienteId}`, P)).s === 200, 'detalle del cliente')
r = await llamar('GET', `/clientes/${clienteId}/direcciones`, P)
ok(r.d.length === 1, 'sus direcciones')

seccion('Solo lectura y aislamiento')
await llamar('DELETE', '/suscripciones/activa', P)
ok((await llamar('GET', '/gestion/pedidos', P)).d.length === 2, 'sin plan vigente, los pedidos se siguen viendo')
const otro = await nuevoPropietario('Prueba Pedidos Otro')
const { P: O } = await nuevaTienda(otro, 'Otra Pedidos')
ok((await llamar('GET', `/gestion/pedidos/${p1.id}`, O)).s === 404, 'otra tienda no ve el pedido')
ok((await llamar('GET', `/clientes/${clienteId}`, O)).s === 404, 'ni al cliente')
ok((await llamar('GET', '/gestion/pedidos', { token: otro, tienda: t.id })).s === 403, 'ni usando un X-Tenant-ID ajeno')

terminar()
