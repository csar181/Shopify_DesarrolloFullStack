import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { listarPlanes } from '../api/planes'
import Alerta from '../components/ui/Alerta'
import { formatearSoles } from '../utils/formato'

const ESTADISTICAS = {
  BASICAS: 'Estadísticas básicas',
  INTERMEDIAS: 'Estadísticas intermedias',
  AVANZADAS: 'Estadísticas avanzadas',
}

function TarjetaPlan({ plan }) {
  const caracteristicas = [
    `Hasta ${plan.maxProductos} productos activos`,
    `Hasta ${plan.maxCategorias} categorías`,
    `${plan.maxImagenesProducto} imágenes por producto`,
    ESTADISTICAS[plan.funcionalidades?.estadisticas],
  ].filter(Boolean)

  return (
    <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
      <h3 className="text-lg font-semibold text-slate-900">{plan.nombre}</h3>
      <p className="mt-1 text-sm text-slate-500">{plan.descripcion}</p>
      <p className="mt-4">
        <span className="text-3xl font-bold text-slate-900">{formatearSoles(plan.precio)}</span>
        <span className="text-sm text-slate-500"> / mes</span>
      </p>
      <ul className="mt-4 flex-1 space-y-2 text-sm text-slate-700">
        {caracteristicas.map((texto) => (
          <li key={texto} className="flex gap-2">
            <span className="text-marca-600" aria-hidden="true">✓</span>
            {texto}
          </li>
        ))}
      </ul>
      <Link
        to="/registro"
        className="mt-6 rounded-lg bg-marca-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-marca-700"
      >
        Probar 7 días gratis
      </Link>
    </article>
  )
}

export default function Inicio() {
  const [planes, setPlanes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    listarPlanes()
      .then(setPlanes)
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false))
  }, [])

  return (
    <>
      <section className="mx-auto max-w-6xl px-4 py-16 text-center md:py-24">
        <h1 className="text-4xl font-bold tracking-tight text-balance text-slate-900 md:text-5xl">
          Crea tu tienda online y empieza a vender hoy
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-pretty text-slate-600">
          Administra productos, inventario, pedidos y descuentos desde un solo panel. Prueba cualquier plan gratis
          durante 7 días.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/registro" className="rounded-lg bg-marca-600 px-6 py-3 font-medium text-white hover:bg-marca-700">
            Crear mi tienda
          </Link>
          <a href="#planes" className="rounded-lg border border-slate-300 bg-white px-6 py-3 font-medium text-slate-700 hover:bg-slate-50">
            Ver planes
          </a>
        </div>
      </section>

      <section id="planes" className="mx-auto max-w-6xl scroll-mt-8 px-4 pb-20">
        <h2 className="text-center text-2xl font-semibold text-slate-900">Planes</h2>
        <div className="mt-8">
          {cargando && <p className="text-center text-slate-500">Cargando planes…</p>}
          <Alerta>{error}</Alerta>
          {!cargando && !error && (
            <div className="grid gap-6 md:grid-cols-3">
              {planes.map((plan) => (
                <TarjetaPlan key={plan.id} plan={plan} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
