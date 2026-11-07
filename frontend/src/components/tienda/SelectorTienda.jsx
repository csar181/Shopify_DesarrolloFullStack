import { useNavigate } from 'react-router'
import { useTiendas } from '../../context/TiendaContext'

/** Lista desplegable para cambiar la tienda que se está administrando. */
export default function SelectorTienda() {
  const { tiendas, tienda, seleccionar } = useTiendas()
  const navegar = useNavigate()

  if (tiendas.length === 0) return null

  function cambiar(evento) {
    seleccionar(Number(evento.target.value))
    // Se vuelve al inicio: la página actual podía mostrar datos de la otra tienda.
    navegar('/panel')
  }

  return (
    <label className="flex min-w-0 items-center gap-2 text-sm">
      <span className="hidden text-slate-500 sm:inline">Tienda:</span>
      <select
        value={tienda?.id ?? ''}
        onChange={cambiar}
        className="max-w-48 min-w-0 truncate rounded-lg border border-slate-300 bg-white py-1.5 pr-8 pl-3 font-medium text-slate-800 outline-none focus:border-marca-500 focus:ring-2 focus:ring-marca-100"
      >
        {tiendas.map((t) => (
          <option key={t.id} value={t.id}>
            {t.nombre}
          </option>
        ))}
      </select>
    </label>
  )
}
