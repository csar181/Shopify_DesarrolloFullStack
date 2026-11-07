import { BrowserRouter, Route, Routes } from 'react-router'
import RutaProtegida from './components/RutaProtegida'
import { AuthProvider } from './context/AuthContext'
import PanelLayout from './layouts/PanelLayout'
import PublicoLayout from './layouts/PublicoLayout'
import Inicio from './pages/Inicio'
import NoEncontrado from './pages/NoEncontrado'
import Login from './pages/auth/Login'
import Registro from './pages/auth/Registro'
import InicioPanel from './pages/panel/InicioPanel'

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
            <Route path="panel" element={<PanelLayout />}>
              <Route index element={<InicioPanel />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
