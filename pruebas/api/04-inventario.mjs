// Inventario: stock general o por variante, stock bajo y productos sin stock (PR #10).
import { llamar, nuevaTienda, nuevoPropietario, ok, seccion, terminar } from './comun.mjs'

const token = await nuevoPropietario('Prueba Inventario')
const { P } = await nuevaTienda(token, 'Prueba Inventario')
const gorra = (await llamar('POST', '/productos', { ...P, cuerpo: { nombre: 'Gorra', precio: '25' } })).d
const lentes = (await llamar('POST', '/productos', { ...P, cuerpo: { nombre: 'Lentes', precio: '60' } })).d

seccion('Stock general')
let r = await llamar('POST', '/inventario', { ...P, cuerpo: { productoId: gorra.id, varianteId: null, cantidad: null, cantidadMinima: null } })
ok(r.s === 400 && r.d.errores.cantidad && r.d.errores.cantidadMinima, `validación: ${JSON.stringify(r.d.errores)}`)
r = await llamar('POST', '/inventario', { ...P, cuerpo: { productoId: gorra.id, varianteId: null, cantidad: -1, cantidadMinima: 0 } })
ok(r.s === 400, `cantidad negativa: "${r.d.errores?.cantidad}"`)
const general = (await llamar('POST', '/inventario', { ...P, cuerpo: { productoId: gorra.id, varianteId: null, cantidad: 10, cantidadMinima: 3 } })).d
ok(general.varianteId === null && general.stockBajo === false, 'registrar 10 con mínimo 3: Disponible')
r = await llamar('PUT', `/inventario/${general.id}`, { ...P, cuerpo: { cantidad: 3, cantidadMinima: 3 } })
ok(r.d.stockBajo === true, 'bajar a 3 (igual al mínimo): Stock bajo')
r = await llamar('GET', '/inventario/stock-bajo', P)
ok(r.d.length === 1 && r.d[0].id === general.id, '/inventario/stock-bajo lo incluye')
r = await llamar('POST', `/productos/${gorra.id}/variantes`, { ...P, cuerpo: { nombre: 'Talla M', sku: null, precio: null } })
ok(r.s === 409, `crear variante con stock general: ${r.s} "${r.d.detail}"`)
r = await llamar('DELETE', `/inventario/${general.id}`, P)
ok(r.s === 409, `quitar el registro con stock: ${r.s} "${r.d.detail}"`)
await llamar('PUT', `/inventario/${general.id}`, { ...P, cuerpo: { cantidad: 0, cantidadMinima: 3 } })
r = await llamar('DELETE', `/inventario/${general.id}`, P)
ok(r.s === 204, 'con 0 sí se puede quitar')

seccion('Stock por variante')
const vM = (await llamar('POST', `/productos/${gorra.id}/variantes`, { ...P, cuerpo: { nombre: 'Talla M', sku: null, precio: null } })).d
const vL = (await llamar('POST', `/productos/${gorra.id}/variantes`, { ...P, cuerpo: { nombre: 'Talla L', sku: null, precio: null } })).d
ok(vM.id && vL.id, 'sin stock general, ya se pueden crear variantes')
const rM = (await llamar('POST', '/inventario', { ...P, cuerpo: { productoId: gorra.id, varianteId: vM.id, cantidad: 5, cantidadMinima: 2 } })).d
ok(rM.varianteNombre === 'Talla M', 'stock de la Talla M')
r = await llamar('POST', '/inventario', { ...P, cuerpo: { productoId: gorra.id, varianteId: null, cantidad: 5, cantidadMinima: 0 } })
ok(r.s === 409, `stock general en un producto con variantes: ${r.s} "${r.d.detail}"`)
r = await llamar('POST', '/inventario', { ...P, cuerpo: { productoId: gorra.id, varianteId: vM.id, cantidad: 1, cantidadMinima: 0 } })
ok(r.s === 409, `registro repetido: ${r.s} "${r.d.detail}"`)
await llamar('DELETE', `/productos/${gorra.id}/variantes/${vM.id}`, P)
r = await llamar('GET', '/inventario', P)
ok(r.d.some((x) => x.id === rM.id && x.varianteNombre === 'Talla M'), 'variante eliminada: su registro sigue (el panel lo muestra como "Variante eliminada")')

seccion('Sin stock registrado')
r = await llamar('GET', '/inventario', P)
ok(!r.d.some((x) => x.productoId === lentes.id), '"Lentes" no tiene registro: aparece en la pestaña "Sin stock registrado"')

terminar()
