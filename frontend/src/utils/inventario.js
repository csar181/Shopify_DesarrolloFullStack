/** Situación de un registro de inventario, o de su ausencia (un producto sin registro no se puede comprar). */
export function estadoStock(registro) {
  if (!registro) return { texto: 'Sin stock registrado', tono: 'gris' }
  if (registro.cantidad === 0) return { texto: 'Agotado', tono: 'rojo' }
  if (registro.stockBajo) return { texto: 'Stock bajo', tono: 'ambar' }
  return { texto: 'Disponible', tono: 'verde' }
}

/**
 * Qué necesita atención en el inventario. Solo cuentan los productos activos: los desactivados no se venden.
 * `productos` debe incluir los desactivados (incluirInactivos) para poder descartar sus registros.
 */
export function resumenInventario(registros, productos) {
  const activos = new Set(productos.filter((p) => p.activo).map((p) => p.id))
  const conRegistro = new Set(registros.map((r) => r.productoId))
  return {
    conStockBajo: registros.filter((r) => activos.has(r.productoId) && r.stockBajo),
    sinRegistro: productos.filter((p) => p.activo && !conRegistro.has(p.id)),
  }
}
