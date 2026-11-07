import { diasRestantes, formatearFecha } from './formato'
import { quitarTildes } from './texto'

/**
 * Situación de una tienda según docs/API_BACKEND.md ("Situación de una tienda").
 * tono: verde | ambar | rojo | gris (lo usa EstadoTienda para el color).
 */
export function estadoTienda(tienda) {
  if (!tienda.activo) {
    return {
      etiqueta: 'Desactivada',
      tono: 'gris',
      detalle: 'La desactivaste. Reactívala para volver a administrarla.',
    }
  }
  if (tienda.suscripcionTipo === 'PRUEBA') {
    const dias = diasRestantes(tienda.suscripcionFin)
    return {
      etiqueta: `Prueba gratis · ${dias} ${dias === 1 ? 'día' : 'días'}`,
      tono: 'ambar',
      detalle: `Prueba del plan ${tienda.planNombre} hasta el ${formatearFecha(tienda.suscripcionFin)}. Puedes configurarla, pero no es visible al público hasta que contrates un plan.`,
    }
  }
  if (tienda.suscripcionTipo === 'PAGADA') {
    return {
      etiqueta: 'Publicada',
      tono: 'verde',
      detalle: `Plan ${tienda.planNombre} vigente hasta el ${formatearFecha(tienda.suscripcionFin)}.`,
    }
  }
  return {
    etiqueta: 'Solo lectura',
    tono: 'rojo',
    detalle:
      'La suscripción venció o fue cancelada. Puedes consultar todo, pero para hacer cambios hay que contratar un plan.',
  }
}

/** Misma regla que SlugUtil del backend: "Café Ñandú!" → "cafe-nandu". */
export function generarSlug(texto) {
  return quitarTildes(texto)
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Los campos opcionales vacíos se envían como null en lugar de "". */
export function vaciosANull(datos) {
  return Object.fromEntries(
    Object.entries(datos).map(([clave, valor]) => [
      clave,
      typeof valor === 'string' && valor.trim() === '' ? null : valor,
    ]),
  )
}

export const COLOR_POR_DEFECTO = '#059669'

/** Datos editables de una tienda: los comparten "Nueva tienda" y "Configuración". */
export function datosInicialesTienda(tienda) {
  return {
    nombre: tienda?.nombre ?? '',
    descripcion: tienda?.descripcion ?? '',
    urlLogo: tienda?.urlLogo ?? '',
    urlBanner: tienda?.urlBanner ?? '',
    colorPrimario: tienda?.colorPrimario ?? COLOR_POR_DEFECTO,
    correoContacto: tienda?.correoContacto ?? '',
    telefonoContacto: tienda?.telefonoContacto ?? '',
  }
}
