import { useCallback, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { actualizarInventario, listarInventario } from '../../../api/inventario'
import { listarProductos } from '../../../api/productos'
import EditorStock from '../../../components/inventario/EditorStock'
import EstadoStock from '../../../components/inventario/EstadoStock'
import Alerta from '../../../components/ui/Alerta'
import Insignia from '../../../components/ui/Insignia'
import Pestanas from '../../../components/ui/Pestanas'
import { useTiendas } from '../../../context/TiendaContext'
import { useDatos } from '../../../hooks/useDatos'
import { resumenInventario } from '../../../utils/inventario'
import { quitarTildes } from '../../../utils/texto'

const VISTAS = ['todos', 'bajo', 'sin-registro']

export default function Inventario() {
  const { tienda } = useTiendas()
  const puedeEditar = tienda.administrable
  // ?ver=bajo abre directamente la pestaña de stock bajo (lo usa el aviso del inicio del panel).
  const [parametros, setParametros] = useSearchParams()
  const vista = VISTAS.includes(parametros.get('ver')) ? parametros.get('ver') : 'todos'
  const [busqueda, setBusqueda] = useState('')

  const cargar = useCallback(() => Promise.all([listarInventario(), listarProductos({ incluirInactivos: true })]), [])
  const { datos, cargando, error, setDatos } = useDatos(cargar)
  const [registros, productos] = datos ?? [[], []]

  const productoPorId = new Map(productos.map((p) => [p.id, p]))
  const { conStockBajo, sinRegistro } = resumenInventario(registros, productos)

  const termino = quitarTildes(busqueda.trim())
  const coincide = (texto) => !termino || quitarTildes(texto).includes(termino)

  const filas = (vista === 'bajo' ? conStockBajo : registros)
    .filter((r) => coincide(`${r.productoNombre} ${r.varianteNombre ?? ''}`))
    .sort(
      (a, b) =>
        a.productoNombre.localeCompare(b.productoNombre, 'es') ||
        (a.varianteNombre ?? '').localeCompare(b.varianteNombre ?? '', 'es'),
    )

  const reemplazar = (registro) =>
    setDatos(([lista, prods]) => [lista.map((r) => (r.id === registro.id ? registro : r)), prods])

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-semibold text-slate-900">Inventario</h1>
      <p className="mt-1 text-sm text-slate-600">
        Stock de todos tus productos. Cada venta lo descuenta y cancelar un pedido lo devuelve.
      </p>

      <div className="mt-6">
        <Pestanas
          valor={vista}
          onChange={(valor) => setParametros(valor === 'todos' ? {} : { ver: valor }, { replace: true })}
          opciones={[
            { valor: 'todos', texto: 'Todo el stock', cantidad: registros.length },
            { valor: 'bajo', texto: 'Stock bajo', cantidad: conStockBajo.length },
            { valor: 'sin-registro', texto: 'Sin stock registrado', cantidad: sinRegistro.length },
          ]}
        />
      </div>

      <input
        type="search"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar producto o variante"
        aria-label="Buscar en el inventario"
        className="mt-4 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-marca-500 focus:ring-2 focus:ring-marca-100"
      />

      <div className="mt-4 space-y-3">
        <Alerta>{error}</Alerta>
        {cargando ? (
          <p className="text-slate-500">Cargando inventario…</p>
        ) : vista === 'sin-registro' ? (
          <SinRegistro productos={sinRegistro.filter((p) => coincide(p.nombre))} />
        ) : filas.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-8 text-center text-sm text-slate-500">
            {termino
              ? 'Nada coincide con la búsqueda.'
              : vista === 'bajo'
                ? 'Ningún producto está por debajo de su mínimo.'
                : 'Todavía no registraste stock. Hazlo desde el detalle de cada producto.'}
          </p>
        ) : (
          <ul className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
            {filas.map((registro) => {
              const desactivado = productoPorId.get(registro.productoId)?.activo === false
              return (
                <li key={registro.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <Link
                      to={`/panel/productos/${registro.productoId}#inventario`}
                      className="font-medium text-slate-900 hover:text-marca-700 hover:underline"
                    >
                      {registro.productoNombre}
                    </Link>
                    {registro.varianteNombre && <span className="text-slate-600"> · {registro.varianteNombre}</span>}
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <EstadoStock registro={registro} />
                      {desactivado && <Insignia tono="gris">Producto desactivado</Insignia>}
                    </div>
                  </div>
                  <EditorStock
                    key={`${registro.id}-${registro.cantidad}-${registro.cantidadMinima}`}
                    etiqueta={`${registro.productoNombre} ${registro.varianteNombre ?? ''}`.trim()}
                    registro={registro}
                    puedeEditar={puedeEditar}
                    onGuardar={async (valores) => reemplazar(await actualizarInventario(registro.id, valores))}
                  />
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

function SinRegistro({ productos }) {
  if (productos.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-8 text-center text-sm text-slate-500">
        Todos tus productos activos tienen stock registrado.
      </p>
    )
  }
  return (
    <>
      <Alerta tipo="info">Estos productos no se pueden comprar hasta que registres su stock.</Alerta>
      <ul className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
        {[...productos]
          .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
          .map((producto) => (
            <li key={producto.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <span className="font-medium text-slate-900">{producto.nombre}</span>
              <Link
                to={`/panel/productos/${producto.id}#inventario`}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Registrar stock
              </Link>
            </li>
          ))}
      </ul>
    </>
  )
}
