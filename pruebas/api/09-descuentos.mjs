// Códigos de descuento del panel y su uso al pagar (PR #15).
import { llamar, nuevaTienda, nuevoCliente, nuevoProducto, nuevoPropietario, ok, seccion, terminar } from './comun.mjs'

// Mismo formato que envía el formulario: 'YYYY-MM-DDTHH:mm:00' en hora local.
const fecha = (dias) => {
  const f = new Date(Date.now() + dias * 864e5)
  f.setMinutes(f.getMinutes() - f.getTimezoneOffset())
  return f.toISOString().slice(0, 16) + ':00'
}
const token = await nuevoPropietario('Prueba Descuentos')
const { tienda: t, P } = await nuevaTienda(token, 'Prueba Descuentos', { publicada: true })
const crear = (cuerpo) => llamar('POST', '/descuentos', { ...P, cuerpo })

seccion('Crear y validar')
let r = await crear({ codigo: 'verano10', tipo: 'PORCENTAJE', valor: '10', fechaInicio: fecha(0), fechaFin: fecha(30) })
const verano = r.d
ok(r.s === 201 && verano.codigo === 'VERANO10' && verano.vigente, `desde ahora y por 30 días: se guarda como ${verano.codigo} y queda vigente al instante`)
r = await crear({ codigo: 'Verano10', tipo: 'MONTO_FIJO', valor: '5', fechaInicio: fecha(0), fechaFin: fecha(1) })
ok(r.s === 409, `código repetido (sin importar mayúsculas): "${r.d.detail}"`)
r = await crear({ codigo: 'MAL1', tipo: 'PORCENTAJE', valor: '150', fechaInicio: fecha(0), fechaFin: fecha(1) })
ok(r.s >= 400, `porcentaje 150: "${r.d.detail}"`)
r = await crear({ codigo: 'MAL2', tipo: 'MONTO_FIJO', valor: '0', fechaInicio: fecha(0), fechaFin: fecha(1) })
ok(r.s === 400, `valor 0: "${r.d.errores?.valor ?? r.d.detail}"`)
r = await crear({ codigo: 'MAL3', tipo: 'MONTO_FIJO', valor: '5', fechaInicio: fecha(5), fechaFin: fecha(1) })
ok(r.s >= 400, `fin antes del inicio: "${r.d.detail}"`)

seccion('Situación de cada código')
const programado = (await crear({ codigo: 'NAVIDAD', tipo: 'MONTO_FIJO', valor: '20', fechaInicio: fecha(10), fechaFin: fecha(40) })).d
ok(programado.activo && !programado.vigente, 'empieza en 10 días: "Programado"')
const vencido = (await crear({ codigo: 'ANTIGUO', tipo: 'PORCENTAJE', valor: '5', fechaInicio: fecha(-10), fechaFin: fecha(-1) })).d
ok(vencido.activo && !vencido.vigente, 'terminó ayer: "Vencido"')
await crear({ codigo: 'MENOS100', tipo: 'MONTO_FIJO', valor: '100', fechaInicio: fecha(0), fechaFin: fecha(5) })
r = await llamar('GET', '/descuentos/vigentes', P)
ok(r.d.map((d) => d.codigo).sort().join() === 'MENOS100,VERANO10', `/descuentos/vigentes: ${r.d.map((d) => d.codigo).join(', ')}`)
r = await llamar('PUT', `/descuentos/${verano.id}`, { ...P, cuerpo: { codigo: 'VERANO15', tipo: 'PORCENTAJE', valor: '15', fechaInicio: fecha(0), fechaFin: fecha(30) } })
ok(r.s === 200 && r.d.codigo === 'VERANO15', 'editar código y valor')

seccion('Al pagar')
const gorra = await nuevoProducto(P, 'Gorra', 50, 5)
const C = await nuevoCliente(t.slug, 'Luis')
await llamar('POST', '/carrito/productos', { ...C, cuerpo: { productoId: gorra.id, varianteId: null, cantidad: 1 } })
const resumen = (codigo) => llamar('GET', `/checkout/resumen?codigoDescuento=${codigo}`, C)
r = await resumen('verano15')
ok(Number(r.d.montoDescuento) === 7.5 && Number(r.d.total) === 42.5, `VERANO15 sobre S/ 50: −${r.d.montoDescuento} → S/ ${r.d.total}`)
ok((await resumen('VERANO10')).s === 404, 'el código viejo ya no existe')
r = await resumen('NAVIDAD')
ok(r.s === 409, `programado: "${r.d.detail}"`)
ok((await resumen('ANTIGUO')).s === 409, 'vencido: no aplica')
r = await resumen('MENOS100')
ok(r.s === 409, `S/ 100 fijo sobre S/ 50: "${r.d.detail}"`)
await llamar('DELETE', `/descuentos/${verano.id}`, P)
ok((await resumen('VERANO15')).s === 409, 'desactivado: no aplica')
r = await llamar('PATCH', `/descuentos/${verano.id}/activar`, P)
ok(r.d.vigente && (await resumen('VERANO15')).s === 200, 'reactivado: vuelve a aplicar')

terminar()
