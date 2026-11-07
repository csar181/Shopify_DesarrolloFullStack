import { NavLink, Outlet, useNavigate } from 'react-router'
import Logo from '../components/Logo'
import Boton from '../components/ui/Boton'
import { useAuth } from '../context/AuthContext'

// Cada fase agrega aquí sus secciones (Tiendas, Productos, Pedidos...).
const SECCIONES = [{ a: '/panel', texto: 'Inicio', exacta: true }]

/** Panel del propietario: barra lateral en escritorio, barra superior en móvil. */
export default function PanelLayout() {
  const { usuario, cerrarSesion } = useAuth()
  const navegar = useNavigate()

  function salir() {
    cerrarSesion()
    navegar('/login', { replace: true })
  }

  return (
    <div className="min-h-screen md:flex">
      <aside className="border-b border-slate-200 bg-white md:flex md:w-60 md:shrink-0 md:flex-col md:border-r md:border-b-0">
        <div className="px-4 py-3 md:py-5">
          <Logo a="/panel" />
        </div>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:pb-0">
          {SECCIONES.map((seccion) => (
            <NavLink
              key={seccion.a}
              to={seccion.a}
              end={seccion.exacta}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap ${
                  isActive ? 'bg-marca-50 text-marca-700' : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              {seccion.texto}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-end gap-3 border-b border-slate-200 bg-white px-4 py-3">
          <span className="truncate text-sm text-slate-600">{usuario?.nombre}</span>
          <Boton variante="secundario" onClick={salir}>
            Cerrar sesión
          </Boton>
        </header>
        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
