// "Mis pedidos" y "Mi cuenta" del cliente (PR #16).
import { API, comprar, llamar, nuevaTienda, nuevoCliente, nuevoProducto, nuevoPropietario, ok, seccion, terminar } from './comun.mjs'

const token = await nuevoPropietario('Prueba Cuenta')
const { tienda: t, P } = await nuevaTienda(token, 'Prueba Cuenta', { publicada: true })
const gorra = await nuevoProducto(P, 'Gorra', 50, 5)
const yape = (await llamar('POST', '/gestion/metodos-pago', { ...P, cuerpo: { nombre: 'Yape', tipo: 'YAPE' } })).d
const C = await nuevoCliente(t.slug, 'Marta Ruiz')
// La compra guarda sus datos de boleta (guardarDatosFacturacion), como al marcar la casilla en el checkout.
await llamar('POST', '/carrito/productos', { ...C, cuerpo: { productoId: gorra.id, varianteId: null, cantidad: 1 } })
const pedido = (await llamar('POST', '/checkout', {
  ...C,
  cuerpo: { direccionId: C.direccionId, metodoPagoId: yape.id, tipoComprobante: 'BOLETA', numeroDocumento: '11112222', nombreRazonSocial: 'Marta Ruiz', guardarDatosFacturacion: true },
})).d

seccion('Mis pedidos')
let r = await llamar('GET', '/pedidos', C)
ok(r.d.length === 1 && r.d[0].id === pedido.id && r.d[0].estado === 'CONFIRMADO', `lista: #${r.d[0]?.id} ${r.d[0]?.estado} ${r.d[0]?.numeroComprobante}`)
await llamar('PATCH', `/gestion/pedidos/${pedido.id}/estado`, { ...P, cuerpo: { estado: 'PREPARANDO' } })
r = await llamar('GET', '/pedidos', C)
ok(r.d[0].estado === 'PREPARANDO', 'el cambio de estado que hace la tienda se ve en "Mis pedidos"')

seccion('Perfil')
r = await llamar('GET', '/mi-cuenta/perfil', C)
ok(r.d.nombre === 'Marta Ruiz', 'leer perfil')
r = await llamar('PUT', '/mi-cuenta/perfil', { ...C, cuerpo: { nombre: '', telefono: null } })
ok(r.s === 400 && r.d.errores.nombre, `nombre vacío: "${r.d.errores?.nombre}"`)
r = await llamar('PUT', '/mi-cuenta/perfil', { ...C, cuerpo: { nombre: 'Marta Ruiz Paz', telefono: '955111222' } })
ok(r.s === 200 && r.d.nombre === 'Marta Ruiz Paz' && r.d.telefono === '955111222', 'editar nombre y teléfono')

seccion('Direcciones')
const libre = (await llamar('POST', '/mi-cuenta/direcciones', { ...C, cuerpo: { lineaDireccion: 'Calle 2', ciudad: 'Arequipa' } })).d
r = await llamar('PUT', `/mi-cuenta/direcciones/${libre.id}`, { ...C, cuerpo: { lineaDireccion: 'Calle 2 #300', ciudad: 'Arequipa', distrito: 'Yanahuara' } })
ok(r.s === 200 && r.d.distrito === 'Yanahuara', 'editar una dirección')
r = await llamar('DELETE', `/mi-cuenta/direcciones/${C.direccionId}`, C)
ok(r.s === 409, `borrar la usada en un pedido: "${r.d?.detail}"`)
r = await llamar('PUT', `/mi-cuenta/direcciones/${C.direccionId}`, { ...C, cuerpo: { lineaDireccion: 'Otra calle', ciudad: 'Lima' } })
ok(r.s === 200, 'pero sí se puede editar')
r = await llamar('GET', `/pedidos/${pedido.id}`, C)
ok(r.d.lineaDireccion === 'Calle Prueba 123', `el pedido conserva la dirección original ("${r.d.lineaDireccion}")`)
ok((await llamar('DELETE', `/mi-cuenta/direcciones/${libre.id}`, C)).s === 204, 'borrar una dirección sin pedidos')

seccion('Datos de facturación')
r = await llamar('GET', '/mi-cuenta/datos-facturacion', C)
const deBoleta = r.d[0]
ok(r.d.length === 1 && deBoleta.tipoDocumento === 'DNI', 'los guardados al comprar')
r = await llamar('POST', '/mi-cuenta/datos-facturacion', { ...C, cuerpo: { tipoDocumento: 'RUC', numeroDocumento: '2012345678', nombreRazonSocial: 'Ruiz SAC' } })
ok(r.s === 400, `RUC de 10 dígitos: "${r.d.detail}"`)
r = await llamar('POST', '/mi-cuenta/datos-facturacion', { ...C, cuerpo: { tipoDocumento: 'RUC', numeroDocumento: '20123456789', nombreRazonSocial: 'Ruiz SAC', direccionFiscal: 'Av. Sol 1' } })
const ruc = r.d
ok(r.s === 201, 'agregar un RUC de 11 dígitos')
r = await llamar('POST', '/mi-cuenta/datos-facturacion', { ...C, cuerpo: { tipoDocumento: 'RUC', numeroDocumento: '20123456789', nombreRazonSocial: 'Otra' } })
ok(r.s === 409, `RUC repetido: "${r.d.detail}"`)
r = await llamar('PUT', `/mi-cuenta/datos-facturacion/${ruc.id}`, { ...C, cuerpo: { tipoDocumento: 'RUC', numeroDocumento: '20123456789', nombreRazonSocial: 'Ruiz Paz SAC' } })
ok(r.s === 200 && r.d.nombreRazonSocial === 'Ruiz Paz SAC', 'editar razón social')
r = await llamar('DELETE', `/mi-cuenta/datos-facturacion/${deBoleta.id}`, C)
ok(r.s === 409, `borrar los usados en un pedido: "${r.d?.detail}"`)
ok((await llamar('DELETE', `/mi-cuenta/datos-facturacion/${ruc.id}`, C)).s === 204, 'borrar los no usados')

seccion('Limitación conocida: tienda sin plan')
await llamar('DELETE', '/suscripciones/activa', P)
ok((await llamar('GET', '/pedidos', C)).s === 200, 'el backend sigue dando "Mis pedidos"…')
ok((await fetch(`${API}/publico/tiendas/${t.slug}`)).status === 404, '…pero la tienda pública da 404 y el frontend muestra "Tienda no disponible" (ver docs/FRONTEND.md)')

terminar()
