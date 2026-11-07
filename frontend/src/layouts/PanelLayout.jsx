import { NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import Logo from '../components/Logo'
import AvisoTienda from '../components/tienda/AvisoTienda'
import SelectorTienda from '../components/tienda/SelectorTienda'
import Alerta from '../components/ui/Alerta'
import Boton from '../components/ui/Boton'
import { useAuth } from '../context/AuthContext'
import { useTiendas } from '../context/TiendaContext'

// Cada fase agrega aquí sus secciones (Productos, Pedidos...).
// `requiereTienda`: solo se muestra si hay una tienda elegida.
const SECCIONES = [
  { a: '/panel', texto: 'Inicio', exacta: true },
  { a: '/panel/productos', texto: 'Productos', requiereTienda: true },
  { a: '/panel/categorias', texto: 'Categorías', requiereTienda: true },
  { a: '/panel/inventario', texto: 'Inventario', requiereTienda: true },
  { a: '/panel/suscripcion', texto: 'Suscripción', requiereTienda: true },
  { a: '/panel/configuracion', texto: 'Configuración', requiereTienda: true },
  { a: '/panel/tiendas', texto: 'Mis tiendas' },
]

/** Panel del propietario: barra lateral en escritorio, barra superior en móvil. */
export default function PanelLayout() {
  const { usuario, cerrarSesion } = useAuth()
  const { tienda, cargando, error, recargar } = useTiendas()
  const navegar = useNavigate()
  const { pathname } = useLocation()

  // En "Mis tiendas" se ven todas, así que el aviso de la tienda actual no aplica.
  const mostrarAviso = tienda && !pathname.startsWith('/panel/tiendas')

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
          {SECCIONES.filter((s) => !s.requiereTienda || tienda).map((seccion) => (
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
        <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
          <SelectorTienda />
          <div className="ml-auto flex min-w-0 items-center gap-3">
            <span className="hidden truncate text-sm text-slate-600 sm:inline">{usuario?.nombre}</span>
            <Boton variante="secundario" onClick={salir}>
              Cerrar sesión
            </Boton>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8">
          {cargando ? (
            <p className="text-slate-500">Cargando tus tiendas…</p>
          ) : error ? (
            <div className="max-w-lg space-y-3">
              <Alerta>{error}</Alerta>
              <Boton variante="secundario" onClick={recargar}>
                Reintentar
              </Boton>
            </div>
          ) : (
            <>
              {mostrarAviso && <AvisoTienda tienda={tienda} />}
              <Outlet />
            </>
          )}
        </main>
      </div>
    </div>
  )
}
