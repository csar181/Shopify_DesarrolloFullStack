import { useCallback } from 'react'
import { Link } from 'react-router'
import { listarPedidosTienda } from '../../api/gestion'
import { useDatos } from '../../hooks/useDatos'

/**
 * Aviso del inicio del panel: pedidos confirmados que esperan ser preparados.
 * Usar con key={tienda.id} para que se vuelva a cargar al cambiar de tienda.
 */
export default function AvisoPedidos() {
  const cargar = useCallback(() => listarPedidosTienda(), [])
  const { datos } = useDatos(cargar)
  // Si falla, el inicio sigue funcionando: el aviso es un extra.
  if (!datos) return null

  const porPreparar = datos.filter((p) => p.estado === 'CONFIRMADO').length
  if (porPreparar === 0) return null

  return (
    <Link
      to="/panel/pedidos?estado=CONFIRMADO"
      className="mt-6 block rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sky-900 hover:border-sky-300"
    >
      <p className="font-semibold">
        {porPreparar} {porPreparar === 1 ? 'pedido nuevo por preparar' : 'pedidos nuevos por preparar'}
      </p>
      <p className="mt-1 text-sm">Revísalos y avanza su estado para que el cliente sepa cómo va su compra →</p>
    </Link>
  )
}
