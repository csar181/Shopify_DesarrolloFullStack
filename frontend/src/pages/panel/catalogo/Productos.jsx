import { useCallback, useState } from 'react'
import { Link } from 'react-router'
import { listarCategorias } from '../../../api/categorias'
import { activarProducto, listarProductos } from '../../../api/productos'
import UsoPlan from '../../../components/UsoPlan'
import Alerta from '../../../components/ui/Alerta'
import Boton from '../../../components/ui/Boton'
import Insignia from '../../../components/ui/Insignia'
import Pestanas from '../../../components/ui/Pestanas'
import { useTiendas } from '../../../context/TiendaContext'
import { useDatos } from '../../../hooks/useDatos'
import { usePlanTienda } from '../../../hooks/usePlanTienda'
import { formatearSoles } from '../../../utils/formato'
import { quitarTildes } from '../../../utils/texto'

export default function Productos() {
  const { tienda } = useTiendas()
  const plan = usePlanTienda()
  const puedeEditar = tienda.administrable

  // Las categorías incluyen las desactivadas: sus productos siguen existiendo y hay que poder filtrarlos.
  const cargar = useCallback(
    () =>
      Promise.all([listarProductos({ incluirInactivos: true }), listarCategorias({ incluirInactivos: true })]),
    [],
  )
  const { datos, cargando, error, setDatos } = useDatos(cargar)
  const [productos, categorias] = datos ?? [[], []]

  const [pestana, setPestana] = useState('activos')
  const [busqueda, setBusqueda] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [mensaje, setMensaje] = useState('')

  const activos = productos.filter((p) => p.activo)
  const desactivados = productos.filter((p) => !p.activo)
  const lleno = plan?.maxProductos != null && activos.length >= plan.maxProductos

  // "cafe" encuentra "Café".
  const termino = quitarTildes(busqueda.trim())
  const visibles = (pestana === 'activos' ? activos : desactivados)
    .filter((p) => !termino || quitarTildes(p.nombre).includes(termino) || quitarTildes(p.sku).includes(termino))
    .filter((p) => !categoriaId || String(p.categoriaId) === categoriaId)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))

  async function reactivar(id) {
    setMensaje('')
    try {
      const producto = await activarProducto(id)
      setDatos(([lista, cats]) => [lista.map((p) => (p.id === id ? producto : p)), cats])
    } catch (e) {
      setMensaje(e.message)
    }
  }

  return (
    <div className="max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Productos</h1>
          {datos && (
            <div className="mt-2">
              <UsoPlan usados={activos.length} limite={plan?.maxProductos} recurso="productos activos" plan={plan?.nombre} />
            </div>
          )}
        </div>
        {puedeEditar && !lleno && (
          <Link
            to="/panel/productos/nuevo"
            className="rounded-lg bg-marca-600 px-4 py-2 text-sm font-medium text-white hover:bg-marca-700"
          >
            Nuevo producto
          </Link>
        )}
      </div>

      <div className="mt-6">
        <Pestanas
          valor={pestana}
          onChange={setPestana}
          opciones={[
            { valor: 'activos', texto: 'Activos', cantidad: activos.length },
            { valor: 'desactivados', texto: 'Desactivados', cantidad: desactivados.length },
          ]}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o SKU"
          aria-label="Buscar productos"
          className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-marca-500 focus:ring-2 focus:ring-marca-100"
        />
        <select
          value={categoriaId}
          onChange={(e) => setCategoriaId(e.target.value)}
          aria-label="Filtrar por categoría"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-marca-500 focus:ring-2 focus:ring-marca-100"
        >
          <option value="">Todas las categorías</option>
          {[...categorias]
            .sort((a, b) => Number(b.activo) - Number(a.activo) || a.nombre.localeCompare(b.nombre, 'es'))
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.activo ? c.nombre : `${c.nombre} (desactivada)`}
              </option>
            ))}
        </select>
      </div>

      <div className="mt-4 space-y-3">
        <Alerta>{error || mensaje}</Alerta>
        {cargando ? (
          <p className="text-slate-500">Cargando productos…</p>
        ) : visibles.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-8 text-center text-sm text-slate-500">
            {termino || categoriaId
              ? 'Ningún producto coincide con la búsqueda.'
              : pestana === 'activos'
                ? 'Todavía no tienes productos.'
                : 'No hay productos desactivados.'}
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Producto</th>
                  <th className="hidden px-4 py-3 sm:table-cell">Categoría</th>
                  <th className="px-4 py-3 text-right">Precio</th>
                  {pestana === 'desactivados' && <th className="px-4 py-3" aria-label="Acciones" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {visibles.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link to={`/panel/productos/${p.id}`} className="font-medium text-slate-900 hover:text-marca-700 hover:underline">
                        {p.nombre}
                      </Link>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        {p.sku && <span>SKU {p.sku}</span>}
                        {p.destacado && <Insignia tono="azul">Destacado</Insignia>}
                        <span className="sm:hidden">{p.categoriaNombre}</span>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 text-slate-600 sm:table-cell">{p.categoriaNombre ?? '—'}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap text-slate-900 tabular-nums">
                      {formatearSoles(p.precio)}
                    </td>
                    {pestana === 'desactivados' && (
                      <td className="px-4 py-3 text-right">
                        <Boton variante="secundario" disabled={!puedeEditar} onClick={() => reactivar(p.id)}>
                          Reactivar
                        </Boton>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
