// Utilidades compartidas por las pruebas de la API. Ver docs/PRUEBAS.md.
//
// Las pruebas hablan con el backend en marcha (no con el frontend) usando las mismas llamadas
// que hace el frontend. Cada ejecución crea sus propias cuentas con correos únicos del dominio
// @pruebas.shopcloud.pe, así que se pueden repetir; limpiar.sql las borra todas.

import { execFileSync } from 'node:child_process'

export const API = process.env.API_URL ?? 'http://localhost:8080/api'
export const DOMINIO = 'pruebas.shopcloud.pe'

const sufijo = Date.now().toString(36)
/** Correo único para esta ejecución: correo('ana') → ana.lq3x9k@pruebas.shopcloud.pe */
export const correo = (nombre) => `${nombre}.${sufijo}@${DOMINIO}`
export const CLAVE = 'clave12345'

/** Llama a la API y devuelve { s: estado HTTP, d: cuerpo JSON o null }. */
export async function llamar(metodo, ruta, { token, tienda, cuerpo, cabeceras } = {}) {
  const headers = { 'Content-Type': 'application/json', ...cabeceras }
  if (token) headers.Authorization = `Bearer ${token}`
  if (tienda) headers['X-Tenant-ID'] = String(tienda)
  let respuesta
  try {
    respuesta = await fetch(API + ruta, {
      method: metodo,
      headers,
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    })
  } catch {
    console.error(`\nNo se pudo conectar con ${API}. ¿Está el backend en marcha? (cd backend; ./mvnw spring-boot:run)`)
    process.exit(2)
  }
  const texto = await respuesta.text()
  let datos = null
  try {
    datos = texto ? JSON.parse(texto) : null
  } catch {
    datos = texto
  }
  return { s: respuesta.status, d: datos }
}

let total = 0
let fallas = 0

/** Una comprobación: imprime OK o XX y cuenta las fallas. */
export function ok(condicion, texto) {
  total++
  if (!condicion) fallas++
  console.log(condicion ? '  OK ' : '  XX ', texto)
}

export function seccion(nombre) {
  console.log(nombre)
}

/** Imprime el resumen. Si algo falló, el proceso termina con código 1. */
export function terminar() {
  console.log(`\n${total - fallas} de ${total} comprobaciones OK${fallas ? ` · ${fallas} fallaron` : ''}`)
  if (fallas) process.exitCode = 1
}

// ---- Atajos para preparar datos ----

let planes = null
/** Id de un plan por su nombre: 'Emprendedor', 'Crecimiento' o 'Profesional'. */
export async function plan(nombre) {
  planes ??= (await llamar('GET', '/planes')).d
  const encontrado = planes.find((p) => p.nombre === nombre)
  if (!encontrado) throw new Error(`No existe el plan ${nombre}. ¿Se cargó database/03_datos_iniciales_planes.sql?`)
  return encontrado.id
}

/** Registra un propietario nuevo y devuelve su token. */
export async function nuevoPropietario(nombre) {
  const r = await llamar('POST', '/auth/registro', {
    cuerpo: { nombre, correoElectronico: correo(nombre.toLowerCase().replace(/\W+/g, '')), contrasena: CLAVE },
  })
  if (r.s !== 201) throw new Error(`No se pudo registrar al propietario: ${r.s} ${JSON.stringify(r.d)}`)
  return r.d.token
}

/**
 * Crea una tienda (en prueba gratuita) y, con `publicada`, contrata el plan para que sea visible.
 * Devuelve la tienda y { token, tienda } listo para llamar a las rutas del propietario.
 */
export async function nuevaTienda(token, nombre, { planNombre = 'Emprendedor', publicada = false } = {}) {
  const r = await llamar('POST', '/tiendas', { token, cuerpo: { planId: await plan(planNombre), nombre } })
  if (r.s !== 201) throw new Error(`No se pudo crear la tienda: ${r.s} ${JSON.stringify(r.d)}`)
  const P = { token, tienda: r.d.id }
  if (publicada) await llamar('POST', '/suscripciones/contratar', { ...P, cuerpo: { planId: await plan(planNombre) } })
  return { tienda: r.d, P }
}

/** Producto con stock general. */
export async function nuevoProducto(P, nombre, precio, stock) {
  const producto = (await llamar('POST', '/productos', { ...P, cuerpo: { nombre, precio: String(precio) } })).d
  if (stock !== undefined) {
    await llamar('POST', '/inventario', { ...P, cuerpo: { productoId: producto.id, varianteId: null, cantidad: stock, cantidadMinima: 0 } })
  }
  return producto
}

/** Registra un cliente en la tienda y le crea una dirección. Devuelve { token, direccionId }. */
export async function nuevoCliente(slug, nombre) {
  const r = await llamar('POST', `/publico/tiendas/${slug}/clientes/registro`, {
    cuerpo: { nombre, correoElectronico: correo(nombre.toLowerCase().replace(/\W+/g, '')), contrasena: CLAVE },
  })
  if (r.s !== 201) throw new Error(`No se pudo registrar al cliente: ${r.s} ${JSON.stringify(r.d)}`)
  const C = { token: r.d.token }
  C.direccionId = (await llamar('POST', '/mi-cuenta/direcciones', { ...C, cuerpo: { lineaDireccion: 'Calle Prueba 123', ciudad: 'Lima' } })).d.id
  return C
}

/** Agrega [[producto, cantidad], ...] al carrito del cliente y compra con boleta. Devuelve el pedido. */
export async function comprar(C, metodoPagoId, lineas) {
  for (const [producto, cantidad] of lineas) {
    await llamar('POST', '/carrito/productos', { ...C, cuerpo: { productoId: producto.id, varianteId: null, cantidad } })
  }
  const r = await llamar('POST', '/checkout', {
    ...C,
    cuerpo: { direccionId: C.direccionId, metodoPagoId, tipoComprobante: 'BOLETA', numeroDocumento: '12345678', nombreRazonSocial: 'Cliente de prueba' },
  })
  if (r.s !== 201) throw new Error(`No se pudo comprar: ${r.s} ${JSON.stringify(r.d)}`)
  return r.d
}

/**
 * Ejecuta una consulta en la base (solo la usa la prueba de estadísticas, para mover pedidos a días anteriores).
 * Usa DB_PASSWORD y, si psql no está en la ruta por defecto, la variable PSQL.
 */
export function sql(consulta) {
  const psql = process.env.PSQL ?? 'C:/Program Files/PostgreSQL/17/bin/psql.exe'
  return execFileSync(psql, ['-h', 'localhost', '-U', process.env.DB_USERNAME ?? 'postgres', '-d', 'shopcloud_test', '-At', '-c', consulta], {
    env: { ...process.env, PGPASSWORD: process.env.DB_PASSWORD },
  })
    .toString()
    .trim()
}

/** Fecha local 'YYYY-MM-DD'. */
export const iso = (f) => `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`
