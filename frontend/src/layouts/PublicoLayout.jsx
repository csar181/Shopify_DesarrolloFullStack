import { Link, Outlet } from 'react-router'
import Logo from '../components/Logo'
import { useAuth } from '../context/AuthContext'

/** Sitio de la plataforma: landing, login y registro del propietario. */
export default function PublicoLayout() {
  const { autenticado } = useAuth()

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Logo />
          <nav className="flex items-center gap-2 text-sm font-medium">
            {autenticado ? (
              <Link to="/panel" className="rounded-lg bg-marca-600 px-4 py-2 text-white hover:bg-marca-700">
                Ir a mi panel
              </Link>
            ) : (
              <>
                <Link to="/login" className="rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100">
                  Iniciar sesión
                </Link>
                <Link to="/registro" className="rounded-lg bg-marca-600 px-4 py-2 text-white hover:bg-marca-700">
                  Crear cuenta
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-500">
        ShopCloud · Proyecto universitario de Desarrollo Full Stack
      </footer>
    </div>
  )
}
