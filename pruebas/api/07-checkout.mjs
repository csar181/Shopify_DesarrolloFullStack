// Compra completa: métodos de pago, cliente, carrito, descuento, boleta y factura (PR #13).
import { correo, CLAVE, llamar, nuevaTienda, nuevoPropietario, ok, seccion, terminar } from './comun.mjs'

const token = await nuevoPropietario('Prueba Checkout')
const { tienda: t, P } = await nuevaTienda(token, 'Prueba Checkout', { publicada: true })
const gorra = (await llamar('POST', '/productos', { ...P, cuerpo: { nombre: 'Gorra', precio: '50' } })).d
await llamar('POST', '/inventario', { ...P, cuerpo: { productoId: gorra.id, varianteId: null, cantidad: 2, cantidadMinima: 0 } })
const polo = (await llamar('POST', '/productos', { ...P, cuerpo: { nombre: 'Polo', precio: '40' } })).d
const talla = (await llamar('POST', `/productos/${polo.id}/variantes`, { ...P, cuerpo: { nombre: 'Talla M', precio: '45' } })).d
await llamar('POST', '/inventario', { ...P, cuerpo: { productoId: polo.id, varianteId: talla.id, cantidad: 5, cantidadMinima: 1 } })
const fecha = (dias) => new Date(Date.now() + dias * 864e5).toISOString().slice(0, 19)
await llamar('POST', '/descuentos', { ...P, cuerpo: { codigo: 'VERANO', tipo: 'PORCENTAJE', valor: 10, fechaInicio: fecha(-1), fechaFin: fecha(1) } })
const slug = t.slug
console.log(`Tienda ${slug}: Gorra (S/ 50, stock 2), Polo Talla M (S/ 45, stock 5), código VERANO (10%)`)

seccion('Métodos de pago (panel)')
let r = await llamar('POST', '/gestion/metodos-pago', { ...P, cuerpo: { nombre: 'Yape', tipo: 'YAPE', datosPago: '999 888 777' } })
const yape = r.d
ok(r.s === 201 && yape.activo, 'crear "Yape"')
r = await llamar('POST', '/gestion/metodos-pago', { ...P, cuerpo: { nombre: 'yape', tipo: 'PLIN' } })
ok(r.s === 409, `nombre repetido: ${r.s} "${r.d.detail}"`)
const tarjeta = (await llamar('POST', '/gestion/metodos-pago', { ...P, cuerpo: { nombre: 'Tarjeta', tipo: 'TARJETA' } })).d
await llamar('DELETE', `/gestion/metodos-pago/${tarjeta.id}`, P)
r = await llamar('GET', '/gestion/metodos-pago', P)
ok(r.d.length === 2 && r.d.find((m) => m.id === tarjeta.id).activo === false, 'el panel ve también el desactivado')

seccion('Cuenta del cliente')
const clientes = `/publico/tiendas/${slug}/clientes`
r = await llamar('POST', `${clientes}/registro`, { cuerpo: { nombre: '', correoElectronico: 'x', contrasena: '1' } })
ok(r.s === 400 && Object.keys(r.d.errores).length === 3, `registro inválido: ${Object.keys(r.d.errores ?? {}).join(', ')}`)
const ana = { nombre: 'Ana Pérez', correoElectronico: correo('ana'), contrasena: CLAVE }
r = await llamar('POST', `${clientes}/registro`, { cuerpo: ana })
ok(r.s === 201 && r.d.token && r.d.tiendaSlug === slug, 'registro: token válido solo para esta tienda')
r = await llamar('POST', `${clientes}/login`, { cuerpo: { correoElectronico: ana.correoElectronico, contrasena: 'mala' } })
ok(r.s === 401, 'clave incorrecta: 401')
const C = { token: (await llamar('POST', `${clientes}/login`, { cuerpo: ana })).d.token }
ok((await llamar('GET', '/productos', { ...C, tienda: t.id })).s === 403, 'el token del cliente no sirve en las rutas del propietario')
r = await llamar('GET', '/pagos/metodos', C)
ok(r.d.length === 1 && r.d[0].nombre === 'Yape', 'el cliente solo ve el método activo')

seccion('Carrito: del navegador al servidor')
const delNavegador = [
  { productoId: gorra.id, varianteId: null, cantidad: 3 },
  { productoId: polo.id, varianteId: talla.id, cantidad: 1 },
  { productoId: 999999, varianteId: null, cantidad: 1 },
]
r = await llamar('POST', '/carrito/sincronizar', { ...C, cuerpo: { elementos: delNavegador } })
ok(r.s === 200 && r.d.elementos.length === 2, `sincronizar al iniciar sesión: ${(r.d.elementos ?? []).map((e) => `${e.cantidad}×${e.nombreProducto}`).join(', ')}`)
ok(r.d.advertencias.length === 2, `avisos para el cliente: ${JSON.stringify(r.d.advertencias)}`)
r = await llamar('POST', '/carrito/sincronizar', { ...C, cuerpo: { elementos: delNavegador } })
ok(r.d.elementos.find((e) => e.productoId === gorra.id).cantidad === 2, 'repetir la sincronización no duplica')
const poloEnCarrito = r.d.elementos.find((e) => e.productoId === polo.id)
r = await llamar('POST', '/carrito/productos', { ...C, cuerpo: { productoId: gorra.id, varianteId: null, cantidad: 1 } })
ok(r.s === 409, `agregar por encima del stock: ${r.s} "${r.d.detail}"`)
r = await llamar('POST', '/carrito/productos', { ...C, cuerpo: { productoId: polo.id, varianteId: null, cantidad: 1 } })
ok(r.s >= 400, `producto con variantes sin elegir una: ${r.s} "${r.d.detail}"`)
r = await llamar('PUT', `/carrito/productos/${poloEnCarrito.id}`, { ...C, cuerpo: { cantidad: 2 } })
ok(r.s === 200 && r.d.elementos.find((e) => e.id === poloEnCarrito.id).cantidad === 2, 'cambiar la cantidad del Polo a 2')

seccion('Checkout')
r = await llamar('GET', '/checkout/resumen', C)
ok(Number(r.d.total) === 190, `resumen: 2×50 + 2×45 = S/ ${r.d.total} (incluye IGV de S/ ${r.d.montoIgv})`)
r = await llamar('GET', '/checkout/resumen?codigoDescuento=NOEXISTE', C)
ok(r.s === 404, `código inexistente: "${r.d.detail}"`)
r = await llamar('GET', '/checkout/resumen?codigoDescuento=verano', C)
ok(Number(r.d.montoDescuento) === 19 && Number(r.d.total) === 171, `código "verano" en minúsculas: −${r.d.montoDescuento} → S/ ${r.d.total}`)
const dir = (await llamar('POST', '/mi-cuenta/direcciones', { ...C, cuerpo: { lineaDireccion: 'Av. Larco 123', ciudad: 'Lima', distrito: 'Miraflores' } })).d
const compra = (extra) => llamar('POST', '/checkout', { ...C, cuerpo: { direccionId: dir.id, metodoPagoId: yape.id, codigoDescuento: 'VERANO', tipoComprobante: 'BOLETA', ...extra } })
r = await compra({ numeroDocumento: '1234', nombreRazonSocial: 'Ana Pérez' })
ok(r.s === 400, `DNI de 4 dígitos: "${r.d.detail}"`)
r = await compra({ metodoPagoId: tarjeta.id, numeroDocumento: '12345678', nombreRazonSocial: 'Ana Pérez' })
ok(r.s >= 400, `método desactivado: "${r.d.detail}"`)
r = await compra({ numeroDocumento: '12345678', nombreRazonSocial: 'Ana Pérez', guardarDatosFacturacion: true })
const pedido = r.d
ok(r.s === 201 && Number(pedido.total) === 171 && pedido.estado === 'CONFIRMADO', `compra: pedido #${pedido.id} por S/ ${pedido.total}, ${pedido.comprobante?.numero}, pago ${pedido.transaccion?.estado}`)
r = await llamar('GET', `/pedidos/${pedido.id}`, C)
ok(r.s === 200 && r.d.elementos.length === 2 && r.d.distrito === 'Miraflores', 'la página de confirmación lee el pedido completo')
ok((await llamar('GET', '/carrito', C)).d.elementos.length === 0, 'después de comprar, el carrito queda vacío')
r = await llamar('GET', `/publico/tiendas/${slug}/productos/${gorra.id}`)
ok(r.d.stock === 0, `el stock de la Gorra bajó de 2 a ${r.d.stock}`)
r = await llamar('GET', '/mi-cuenta/datos-facturacion', C)
ok(r.d.length === 1 && r.d[0].tipoDocumento === 'DNI', 'los datos de la boleta quedaron guardados para la próxima')
const guardado = r.d[0]

seccion('Más compras: datos guardados y factura')
const otra = async (cuerpo) => {
  await llamar('POST', '/carrito/productos', { ...C, cuerpo: { productoId: polo.id, varianteId: talla.id, cantidad: 1 } })
  return llamar('POST', '/checkout', { ...C, cuerpo: { direccionId: dir.id, metodoPagoId: yape.id, ...cuerpo } })
}
r = await otra({ tipoComprobante: 'FACTURA', datosFacturacionId: guardado.id })
ok(r.s >= 400, `factura con datos de DNI: "${r.d.detail}"`)
r = await llamar('POST', '/checkout', { ...C, cuerpo: { direccionId: dir.id, metodoPagoId: yape.id, tipoComprobante: 'BOLETA', datosFacturacionId: guardado.id } })
ok(r.s === 201 && r.d.comprobante.numeroDocumento === '12345678', `boleta con los datos guardados: ${r.d.comprobante?.numero}`)
r = await otra({ tipoComprobante: 'FACTURA', numeroDocumento: '20123456789', nombreRazonSocial: 'Empresa SAC', direccionFiscal: 'Av. Arequipa 100' })
ok(r.s === 201 && r.d.comprobante.tipo === 'FACTURA', `factura con RUC: ${r.d.comprobante?.numero}`)

terminar()
