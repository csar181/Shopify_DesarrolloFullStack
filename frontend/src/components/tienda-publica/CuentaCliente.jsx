import { Navigate, NavLink } from 'react-router'
import { useTiendaPublica } from '../../context/TiendaPublicaContext'

/**
 * Estructura de las páginas de la cuenta del cliente: exige sesión y muestra las pestañas.
 * `volver` es la página a la que regresa después de ingresar (ver AccesoCliente).
 */
export default function CuentaCliente({ titulo, volver, children }) {
  const { slug, cliente } = useTiendaPublica()
  const base = `/tienda/${slug}`

  if (!cliente) {
    return <Navigate to={`${base}/ingresar?volver=${volver}`} replace />
  }

  const pestana = ({ isActive }) =>
    `-mb-px border-b-2 px-3 py-2 text-sm font-medium ${
      isActive ? 'border-(--tienda) text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'
    }`

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <p className="text-sm text-slate-500">
        {cliente.nombre} · {cliente.correoElectronico}
      </p>
      <h1 className="mt-1 text-2xl font-semibold text-slate-900">{titulo}</h1>
      <nav className="mt-4 flex gap-1 border-b border-slate-200" aria-label="Mi cuenta">
        <NavLink to={`${base}/cuenta/pedidos`} className={pestana}>
          Mis pedidos
        </NavLink>
        <NavLink to={`${base}/cuenta`} end className={pestana}>
          Mis datos
        </NavLink>
      </nav>
      <div className="mt-6">{children}</div>
    </div>
  )
}
