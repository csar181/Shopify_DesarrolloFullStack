import { Navigate, Outlet } from 'react-router'
import { useTiendas } from '../context/TiendaContext'

/** Páginas que trabajan sobre la tienda actual (catálogo, configuración...): sin tienda, al inicio del panel. */
export default function RequiereTienda() {
  const { tienda } = useTiendas()
  return tienda ? <Outlet /> : <Navigate to="/panel" replace />
}
