// Tienda pública: catálogo por slug, producto y lo que usa el carrito (PR #12).
import { llamar, nuevaTienda, nuevoPropietario, ok, seccion, terminar } from './comun.mjs'

const token = await nuevoPropietario('Prueba Publica')
const { tienda: t, P } = await nuevaTienda(token, 'Prueba Pública', { publicada: true })
const cat = (await llamar('POST', '/categorias', { ...P, cuerpo: { nombre: 'Ropa' } })).d
const polo = (await llamar('POST', '/productos', { ...P, cuerpo: { nombre: 'Polo', precio: '20', categoriaId: cat.id, destacado: true } })).d
const precios = { S: null, M: '25', L: '30' }
const stock = { S: 10, M: 2, L: 0 }
for (const talla of ['S', 'M', 'L']) {
  const v = (await llamar('POST', `/productos/${polo.id}/variantes`, { ...P, cuerpo: { nombre: `Talla ${talla}`, precio: precios[talla] } })).d
  await llamar('POST', '/inventario', { ...P, cuerpo: { productoId: polo.id, varianteId: v.id, cantidad: stock[talla], cantidadMinima: 0 } })
}
const pantalon = (await llamar('POST', '/productos', { ...P, cuerpo: { nombre: 'Pantalón', precio: '30' } })).d
const oculto = (await llamar('POST', '/productos', { ...P, cuerpo: { nombre: 'Oculto', precio: '5' } })).d
await llamar('DELETE', `/productos/${oculto.id}`, P)
const base = `/publico/tiendas/${t.slug}`

seccion('Tienda y catálogo (sin sesión)')
let r = await llamar('GET', base)
ok(r.s === 200 && r.d.nombre === 'Prueba Pública', `GET ${base}`)
r = await llamar('GET', `${base}/categorias`)
ok(r.d.length === 1 && r.d[0].nombre === 'Ropa', 'categorías activas')
r = await llamar('GET', `${base}/productos`)
const p = r.d.find((x) => x.id === polo.id)
ok(r.d.length === 2 && !r.d.some((x) => x.id === oculto.id), 'solo productos activos (el desactivado no aparece)')
ok(p.destacado && p.stock === 12 && p.variantes.length === 3, `el Polo trae sus 3 tallas y stock total ${p.stock}`)
ok(p.variantes.map((v) => Number(v.precio)).join() === '20,25,30', 'cada talla trae su precio ya resuelto (la S hereda S/ 20): el catálogo muestra "Desde S/ 20.00"')
ok(p.variantes.find((v) => v.nombre === 'Talla L').stock === 0, 'Talla L con stock 0: se muestra tachada')
ok(r.d.find((x) => x.id === pantalon.id).stock === 0, 'producto sin registro de inventario: stock 0, "Agotado"')

seccion('Producto y errores')
r = await llamar('GET', `${base}/productos/${polo.id}`)
ok(r.s === 200 && r.d.nombre === 'Polo', 'detalle del producto')
r = await llamar('GET', `${base}/productos/${oculto.id}`)
ok(r.s === 404, 'un producto desactivado no se puede abrir')
r = await llamar('GET', '/publico/tiendas/esta-tienda-no-existe')
ok(r.s === 404 && r.d.codigo === 'TIENDA_NO_DISPONIBLE', 'tienda inexistente: pantalla "Tienda no disponible"')
const { tienda: enPrueba } = await nuevaTienda(token, 'Prueba Pública En Prueba')
r = await llamar('GET', `/publico/tiendas/${enPrueba.slug}`)
ok(r.s === 404, 'tienda en prueba gratuita (sin plan pagado): tampoco se ve')

terminar()
