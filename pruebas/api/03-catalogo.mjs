// Categorías, productos, imágenes y variantes, con los límites del plan (PR #8 y #9).
// Usa una tienda Emprendedor: 5 categorías, 30 productos y 3 imágenes por producto.
import { llamar, nuevaTienda, nuevoPropietario, ok, seccion, terminar } from './comun.mjs'

const token = await nuevoPropietario('Prueba Catalogo')
const { P } = await nuevaTienda(token, 'Prueba Catálogo', { planNombre: 'Emprendedor' })

seccion('Categorías')
const cats = []
for (const nombre of ['Polos', 'Gorras', 'Casacas', 'Zapatillas', 'Medias']) {
  cats.push((await llamar('POST', '/categorias', { ...P, cuerpo: { nombre, descripcion: null } })).d)
}
let r = await llamar('POST', '/categorias', { ...P, cuerpo: { nombre: 'Sexta', descripcion: null } })
ok(r.s === 409 && r.d.codigo === 'LIMITE_PLAN', `la sexta: 409 LIMITE_PLAN "${r.d.detail}"`)
r = await llamar('PUT', `/categorias/${cats[1].id}`, { ...P, cuerpo: { nombre: 'polos', descripcion: null } })
ok(r.s === 409, `nombre repetido (sin importar mayúsculas): ${r.s} "${r.d.detail}"`)
r = await llamar('PUT', `/categorias/${cats[1].id}`, { ...P, cuerpo: { nombre: 'Gorros', descripcion: 'Para el frío' } })
ok(r.s === 200 && r.d.nombre === 'Gorros', 'editar')
r = await llamar('DELETE', `/categorias/${cats[4].id}`, P)
ok(r.s === 204, 'desactivar (no borra: libera un cupo)')
r = await llamar('GET', '/categorias', P)
ok(r.d.length === 4, `listado normal: ${r.d.length} activas`)
r = await llamar('GET', '/categorias?incluirInactivos=true', P)
ok(r.d.length === 5 && r.d.some((c) => c.id === cats[4].id && c.activo === false), 'con ?incluirInactivos=true aparece la desactivada (pestaña "Desactivadas")')
await llamar('POST', '/categorias', { ...P, cuerpo: { nombre: 'Nueva quinta', descripcion: null } })
r = await llamar('PATCH', `/categorias/${cats[4].id}/activar`, P)
ok(r.s === 409, `reactivar con el plan lleno: ${r.s} "${r.d.detail}"`)

seccion('Productos')
r = await llamar('POST', '/productos', { ...P, cuerpo: { nombre: '', precio: null, categoriaId: null, sku: null, descripcion: null, destacado: false } })
ok(r.s === 400 && r.d.errores.nombre && r.d.errores.precio, `validación: ${JSON.stringify(r.d.errores)}`)
r = await llamar('POST', '/productos', { ...P, cuerpo: { nombre: 'Polo básico', precio: '39.90', categoriaId: cats[0].id, sku: 'POL-001', descripcion: 'Algodón', destacado: true } })
const polo = r.d
ok(r.s === 201 && polo.categoriaNombre === 'Polos' && Number(polo.precio) === 39.9, 'crear (el precio viaja como texto, como lo envía el formulario)')
r = await llamar('POST', '/productos', { ...P, cuerpo: { nombre: 'Otro', precio: '10', sku: 'pol-001', categoriaId: null, descripcion: null, destacado: false } })
ok(r.s === 409, `SKU repetido (sin importar mayúsculas): ${r.s} "${r.d.detail}"`)
r = await llamar('PUT', `/productos/${polo.id}`, { ...P, cuerpo: { nombre: 'Polo básico', precio: '35', categoriaId: cats[4].id, sku: 'POL-001', descripcion: null, destacado: false } })
ok(r.s === 404, `asignar una categoría desactivada: ${r.s} "${r.d.detail}" (el formulario lo avisa antes de enviar)`)
r = await llamar('PUT', `/productos/${polo.id}`, { ...P, cuerpo: { nombre: 'Polo básico', precio: '35', categoriaId: null, sku: 'POL-001', descripcion: null, destacado: false } })
ok(r.s === 200 && r.d.categoriaId === null && Number(r.d.precio) === 35, 'editar y dejarlo sin categoría')

seccion('Imágenes')
const ruta = `/productos/${polo.id}/imagenes`
const i1 = (await llamar('POST', ruta, { ...P, cuerpo: { urlImagen: 'https://picsum.photos/id/1/400', esPrincipal: true } })).d
const i2 = (await llamar('POST', ruta, { ...P, cuerpo: { urlImagen: 'https://picsum.photos/id/2/400', esPrincipal: false } })).d
await llamar('POST', ruta, { ...P, cuerpo: { urlImagen: 'https://picsum.photos/id/3/400', esPrincipal: false } })
r = await llamar('POST', ruta, { ...P, cuerpo: { urlImagen: 'https://picsum.photos/id/4/400', esPrincipal: false } })
ok(r.s === 409 && r.d.codigo === 'LIMITE_PLAN', `cuarta imagen: ${r.s} "${r.d.detail}"`)
await llamar('PUT', `${ruta}/${i2.id}`, { ...P, cuerpo: { urlImagen: i2.urlImagen, esPrincipal: true } })
r = await llamar('GET', ruta, P)
ok(r.d.filter((i) => i.esPrincipal).length === 1 && r.d.find((i) => i.esPrincipal).id === i2.id, 'hacer principal: solo una queda como principal')
r = await llamar('DELETE', `${ruta}/${i1.id}`, P)
ok(r.s === 204 && (await llamar('GET', ruta, P)).d.length === 2, 'quitar una imagen (esta sí se borra)')

seccion('Variantes')
const rv = `/productos/${polo.id}/variantes`
const vS = (await llamar('POST', rv, { ...P, cuerpo: { nombre: 'Talla S', sku: null, precio: null } })).d
const vL = (await llamar('POST', rv, { ...P, cuerpo: { nombre: 'Talla L', sku: 'POL-001-L', precio: '42.50' } })).d
ok(vS.precio === null && Number(vL.precio) === 42.5, 'precio propio, o null = usa el del producto')
r = await llamar('POST', rv, { ...P, cuerpo: { nombre: 'Talla XL', sku: 'POL-001-L', precio: null } })
ok(r.s === 409, `SKU de variante repetido: ${r.s} "${r.d.detail}"`)
r = await llamar('PUT', `${rv}/${vS.id}`, { ...P, cuerpo: { nombre: 'Talla S', sku: null, precio: '30' } })
ok(r.s === 200 && Number(r.d.precio) === 30, 'editar variante')
await llamar('DELETE', `${rv}/${vL.id}`, P)
r = await llamar('GET', rv, P)
ok(r.d.length === 1, 'eliminar variante: ya no aparece')

seccion('Desactivar y reactivar el producto')
await llamar('DELETE', `/productos/${polo.id}`, P)
r = await llamar('GET', '/productos?incluirInactivos=true', P)
ok(r.d.find((p) => p.id === polo.id).activo === false && (await llamar('GET', '/productos', P)).d.length === 0, 'desactivado: solo aparece con ?incluirInactivos=true')
r = await llamar('GET', `/productos/${polo.id}`, P)
ok(r.s === 200, 'su detalle se puede abrir igual')
r = await llamar('PATCH', `/productos/${polo.id}/activar`, P)
ok(r.s === 200 && r.d.activo, 'reactivar')

terminar()
