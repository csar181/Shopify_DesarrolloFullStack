import { useCallback } from 'react'
import { Link } from 'react-router'
import { listarInventario } from '../../api/inventario'
import { listarProductos } from '../../api/productos'
import { useDatos } from '../../hooks/useDatos'
import { resumenInventario } from '../../utils/inventario'

/**
 * Avisos del inicio del panel: productos con stock bajo y productos sin stock registrado.
 * Usar con key={tienda.id} para que se vuelva a cargar al cambiar de tienda.
 */
export default function AvisosInventario() {
  const cargar = useCallback(() => Promise.all([listarInventario(), listarProductos({ incluirInactivos: true })]), [])
  const { datos } = useDatos(cargar)
  // Si falla, el inicio sigue funcionando: los avisos son un extra.
  if (!datos) return null

  const { conStockBajo, sinRegistro } = resumenInventario(...datos)
  if (conStockBajo.length === 0 && sinRegistro.length === 0) return null

  const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`

  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-2">
      {conStockBajo.length > 0 && (
        <Link
          to="/panel/inventario?ver=bajo"
          className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 hover:border-amber-300"
        >
          <p className="font-semibold">{plural(conStockBajo.length, 'producto con stock bajo', 'productos con stock bajo')}</p>
          <p className="mt-1 text-sm">Revisa el inventario para reponerlos →</p>
        </Link>
      )}
      {sinRegistro.length > 0 && (
        <Link
          to="/panel/inventario?ver=sin-registro"
          className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-800 hover:border-slate-300"
        >
          <p className="font-semibold">{plural(sinRegistro.length, 'producto sin stock registrado', 'productos sin stock registrado')}</p>
          <p className="mt-1 text-sm text-slate-600">No se pueden comprar hasta que registres su stock →</p>
        </Link>
      )}
    </div>
  )
}
