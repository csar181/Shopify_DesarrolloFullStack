import { BrowserRouter, Route, Routes } from 'react-router'
import RequiereTienda from './components/RequiereTienda'
import RutaProtegida from './components/RutaProtegida'
import { AuthProvider } from './context/AuthContext'
import { TiendaProvider } from './context/TiendaContext'
import PanelLayout from './layouts/PanelLayout'
import PublicoLayout from './layouts/PublicoLayout'
import Inicio from './pages/Inicio'
import NoEncontrado from './pages/NoEncontrado'
import Login from './pages/auth/Login'
import Registro from './pages/auth/Registro'
import ConfiguracionTienda from './pages/panel/ConfiguracionTienda'
import Categorias from './pages/panel/catalogo/Categorias'
import DetalleProducto from './pages/panel/catalogo/DetalleProducto'
import Inventario from './pages/panel/catalogo/Inventario'
import NuevoProducto from './pages/panel/catalogo/NuevoProducto'
import Productos from './pages/panel/catalogo/Productos'
import InicioPanel from './pages/panel/InicioPanel'
import Suscripcion from './pages/panel/Suscripcion'
import MisTiendas from './pages/panel/tiendas/MisTiendas'
import NuevaTienda from './pages/panel/tiendas/NuevaTienda'

// Mapa de rutas:
//   /                 sitio de la plataforma (landing, login, registro)
//   /panel/...        panel del propietario (requiere sesión)
//   /tienda/:slug/... tienda pública de cada comerciante (fase de tienda pública)
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicoLayout />}>
            <Route index element={<Inicio />} />
            <Route path="login" element={<Login />} />
            <Route path="registro" element={<Registro />} />
            <Route path="*" element={<NoEncontrado />} />
          </Route>

          <Route element={<RutaProtegida />}>
            <Route
              path="panel"
              element={
                <TiendaProvider>
                  <PanelLayout />
                </TiendaProvider>
              }
            >
              <Route index element={<InicioPanel />} />
              <Route path="tiendas" element={<MisTiendas />} />
              <Route path="tiendas/nueva" element={<NuevaTienda />} />

              {/* Trabajan sobre la tienda actual (X-Tenant-ID). */}
              <Route element={<RequiereTienda />}>
                <Route path="configuracion" element={<ConfiguracionTienda />} />
                <Route path="suscripcion" element={<Suscripcion />} />
                <Route path="categorias" element={<Categorias />} />
                <Route path="productos" element={<Productos />} />
                <Route path="productos/nuevo" element={<NuevoProducto />} />
                <Route path="productos/:id" element={<DetalleProducto />} />
                <Route path="inventario" element={<Inventario />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
