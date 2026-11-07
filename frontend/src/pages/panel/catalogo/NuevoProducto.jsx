import { useCallback } from 'react'
import { Link, useNavigate } from 'react-router'
import { listarCategorias } from '../../../api/categorias'
import { crearProducto } from '../../../api/productos'
import FormularioProducto from '../../../components/catalogo/FormularioProducto'
import Alerta from '../../../components/ui/Alerta'
import { useDatos } from '../../../hooks/useDatos'

export default function NuevoProducto() {
  const navegar = useNavigate()
  const cargar = useCallback(() => listarCategorias(), [])
  const { datos: categorias, cargando, error } = useDatos(cargar)

  return (
    <div className="max-w-3xl">
      <Link to="/panel/productos" className="text-sm font-medium text-marca-700 hover:underline">
        ← Productos
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">Nuevo producto</h1>
      <p className="mt-1 text-sm text-slate-600">Después de crearlo podrás agregarle imágenes y variantes.</p>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
        <Alerta>{error}</Alerta>
        {cargando ? (
          <p className="text-slate-500">Cargando…</p>
        ) : (
          <FormularioProducto
            categorias={categorias ?? []}
            textoBoton="Crear producto"
            onGuardar={async (datos) => {
              const nuevo = await crearProducto(datos)
              navegar(`/panel/productos/${nuevo.id}`, { state: { recienCreado: true } })
            }}
          />
        )}
      </div>
    </div>
  )
}
