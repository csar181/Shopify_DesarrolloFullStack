import { useCallback, useState } from 'react'
import { Link } from 'react-router'
import { obtenerMasVendidos, obtenerResumen, obtenerVentasDiarias } from '../../api/analitica'
import GraficoVentasDiarias from '../../components/estadisticas/GraficoVentasDiarias'
import MasVendidos from '../../components/estadisticas/MasVendidos'
import Alerta from '../../components/ui/Alerta'
import { useDatos } from '../../hooks/useDatos'
import { formatearFecha, formatearSoles } from '../../utils/formato'

// ---- Fechas del filtro (siempre 'YYYY-MM-DD' en hora local) ----

const iso = (fecha) =>
  `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`
const hoy = () => new Date()
const haceDias = (n) => {
  const f = hoy()
  f.setDate(f.getDate() - (n - 1))
  return f
}

// Una lista y no un objeto: en un objeto, JavaScript pone primero las claves numéricas ('7', '30'…).
const PERIODOS = [
  { clave: 'mes', texto: 'Este mes', rango: () => [iso(new Date(hoy().getFullYear(), hoy().getMonth(), 1)), iso(hoy())] },
  { clave: '7', texto: '7 días', rango: () => [iso(haceDias(7)), iso(hoy())] },
  { clave: '30', texto: '30 días', rango: () => [iso(haceDias(30)), iso(hoy())] },
  { clave: '90', texto: '90 días', rango: () => [iso(haceDias(90)), iso(hoy())] },
]

/** Todos los días del rango, con 0 en los que no hubo ventas (el backend solo envía los días con ventas). */
function completarDias(desde, hasta, ventas) {
  const porFecha = new Map(ventas.map((v) => [v.fecha, v]))
  const dias = []
  const [a, m, d] = desde.split('-').map(Number)
  for (let f = new Date(a, m - 1, d); iso(f) <= hasta; f.setDate(f.getDate() + 1)) {
    const v = porFecha.get(iso(f))
    dias.push({
      fecha: iso(f),
      monto: Number(v?.montoVentas ?? 0),
      pedidos: v?.cantidadPedidos ?? 0,
      productos: v?.productosVendidos ?? 0,
      clientes: v?.cantidadClientes ?? 0,
    })
  }
  return dias
}

/** Cada consulta por separado: una sección puede no estar en el plan (403) sin afectar a las otras. */
const resultado = (promesa) =>
  promesa.then(
    (datos) => ({ datos }),
    (error) => ({ error }),
  )

const PLAN_NECESARIO = { ventas: 'Crecimiento', productos: 'Profesional' }

// ---- Piezas de la página ----

function Tarjeta({ titulo, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="font-semibold text-slate-900">{titulo}</h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

/** Sección que el plan no incluye: lo dice y lleva a Suscripción. */
function Bloqueada({ seccion }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center">
      <p className="font-medium text-slate-800">Disponible desde el plan {PLAN_NECESARIO[seccion]}</p>
      <Link to="/panel/suscripcion" className="mt-2 inline-block text-sm font-semibold text-marca-700 hover:underline">
        Ver planes →
      </Link>
    </div>
  )
}

function Cifra({ etiqueta, valor }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-500">{etiqueta}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{valor}</p>
    </div>
  )
}

function Resumen({ resumen }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_2fr]">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-sm text-slate-500">Ventas del período</p>
        {/* La cifra principal de la página: una sola, grande. */}
        <p className="mt-1 text-5xl font-semibold tracking-tight text-slate-900">{formatearSoles(resumen.ventasTotales)}</p>
        <p className="mt-2 text-xs text-slate-500">
          Del {formatearFecha(`${resumen.desde}T00:00:00`)} al {formatearFecha(`${resumen.hasta}T00:00:00`)} · incluye IGV · sin pedidos cancelados
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Cifra etiqueta="Pedidos" valor={resumen.pedidosPagados} />
        <Cifra etiqueta="Unidades vendidas" valor={resumen.productosVendidos} />
        <Cifra etiqueta="Clientes que compraron" valor={resumen.clientesCompradores} />
        <Cifra etiqueta="Ticket promedio" valor={formatearSoles(resumen.ticketPromedio)} />
      </div>
    </div>
  )
}

function TablaDias({ dias }) {
  const conVentas = dias.filter((d) => d.pedidos > 0)
  if (conVentas.length === 0) return <p className="text-sm text-slate-500">No hubo ventas en el período.</p>
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[28rem] text-left text-sm">
        <thead className="border-b border-slate-200 text-xs font-medium text-slate-500 uppercase">
          <tr>
            <th className="py-2 pr-4">Día</th>
            <th className="py-2 pr-4 text-right">Pedidos</th>
            <th className="py-2 pr-4 text-right">Unidades</th>
            <th className="py-2 pr-4 text-right">Clientes</th>
            <th className="py-2 text-right">Ventas</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 tabular-nums">
          {conVentas.map((d) => (
            <tr key={d.fecha}>
              <td className="py-2 pr-4">{formatearFecha(`${d.fecha}T00:00:00`)}</td>
              <td className="py-2 pr-4 text-right">{d.pedidos}</td>
              <td className="py-2 pr-4 text-right">{d.productos}</td>
              <td className="py-2 pr-4 text-right">{d.clientes}</td>
              <td className="py-2 text-right font-medium">{formatearSoles(d.monto)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function VentasPorDia({ desde, hasta, ventas }) {
  const [verTabla, setVerTabla] = useState(false)
  const dias = completarDias(desde, hasta, ventas)
  return (
    <>
      <div className="mb-3 flex justify-end">
        <button type="button" onClick={() => setVerTabla(!verTabla)} className="text-sm font-medium text-marca-700 hover:underline">
          {verTabla ? 'Ver gráfico' : 'Ver como tabla'}
        </button>
      </div>
      {verTabla ? <TablaDias dias={dias} /> : <GraficoVentasDiarias dias={dias} />}
    </>
  )
}

/** Contenido de una sección según su resultado: datos, bloqueada por el plan o error. */
function Seccion({ resultado: r, seccion, children }) {
  if (r.error?.codigo === 'FUNCIONALIDAD_NO_INCLUIDA') return <Bloqueada seccion={seccion} />
  if (r.error) return <Alerta>{r.error.message}</Alerta>
  return children(r.datos)
}

export default function Estadisticas() {
  const [periodo, setPeriodo] = useState('mes')
  const [rango, setRango] = useState(() => PERIODOS[0].rango())
  const [desde, hasta] = rango

  const cargar = useCallback(
    () =>
      Promise.all([
        resultado(obtenerResumen(desde, hasta)),
        resultado(obtenerVentasDiarias(desde, hasta)),
        resultado(obtenerMasVendidos(desde, hasta, 10)),
      ]),
    [desde, hasta],
  )
  const { datos, cargando } = useDatos(cargar)

  function elegirPeriodo(clave) {
    setPeriodo(clave)
    const elegido = PERIODOS.find((p) => p.clave === clave)
    if (elegido) setRango(elegido.rango())
  }

  const boton = (activo) =>
    `rounded-lg px-3 py-1.5 text-sm font-medium ${activo ? 'bg-marca-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-semibold text-slate-900">Estadísticas</h1>

      {/* Filtro de fechas: una sola fila, arriba, y afecta a todo lo de abajo. */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1" role="group" aria-label="Período">
          {PERIODOS.map(({ clave, texto }) => (
            <button key={clave} type="button" aria-pressed={periodo === clave} onClick={() => elegirPeriodo(clave)} className={boton(periodo === clave)}>
              {texto}
            </button>
          ))}
          <button type="button" aria-pressed={periodo === 'otro'} onClick={() => elegirPeriodo('otro')} className={boton(periodo === 'otro')}>
            Otro rango
          </button>
        </div>
        {periodo === 'otro' && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <label className="flex items-center gap-1 text-slate-600">
              Desde
              <input
                type="date"
                value={desde}
                max={hasta}
                onChange={(e) => e.target.value && setRango([e.target.value, hasta])}
                className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-slate-800"
              />
            </label>
            <label className="flex items-center gap-1 text-slate-600">
              Hasta
              <input
                type="date"
                value={hasta}
                min={desde}
                onChange={(e) => e.target.value && setRango([desde, e.target.value])}
                className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-slate-800"
              />
            </label>
          </div>
        )}
      </div>

      <div className="mt-6 space-y-6">
        {cargando && !datos ? (
          <p className="text-slate-500">Calculando…</p>
        ) : (
          datos && (
            <>
              <Seccion resultado={datos[0]} seccion="resumen">
                {(resumen) => <Resumen resumen={resumen} />}
              </Seccion>
              <Tarjeta titulo="Ventas por día">
                <Seccion resultado={datos[1]} seccion="ventas">
                  {(ventas) => <VentasPorDia desde={desde} hasta={hasta} ventas={ventas} />}
                </Seccion>
              </Tarjeta>
              <Tarjeta titulo="Productos más vendidos (unidades)">
                <Seccion resultado={datos[2]} seccion="productos">
                  {(productos) =>
                    productos.length === 0 ? (
                      <p className="text-sm text-slate-500">No hubo ventas en el período.</p>
                    ) : (
                      <MasVendidos productos={productos} />
                    )
                  }
                </Seccion>
              </Tarjeta>
            </>
          )
        )}
      </div>
    </div>
  )
}
