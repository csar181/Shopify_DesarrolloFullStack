import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { listarCategorias } from '../../../api/categorias'
import { activarProducto, actualizarProducto, desactivarProducto, obtenerProducto } from '../../../api/productos'
import FormularioProducto from '../../../components/catalogo/FormularioProducto'
import SeccionImagenes from '../../../components/catalogo/SeccionImagenes'
import SeccionVariantes from '../../../components/catalogo/SeccionVariantes'
import Alerta from '../../../components/ui/Alerta'
import Boton from '../../../components/ui/Boton'
import BotonConfirmar from '../../../components/ui/BotonConfirmar'
import Insignia from '../../../components/ui/Insignia'
import { useTiendas } from '../../../context/TiendaContext'
import { useDatos } from '../../../hooks/useDatos'
import { usePlanTienda } from '../../../hooks/usePlanTienda'

function ZonaEstado({ producto, puedeEditar, onCambio }) {
  const [error, setError] = useState('')

  async function ejecutar(accion) {
    setError('')
    try {
      onCambio(await accion())
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
      <h2 className="font-semibold text-slate-900">{producto.activo ? 'Desactivar producto' : 'Reactivar producto'}</h2>
      <p className="mt-1 text-sm text-slate-600">
        {producto.activo
          ? 'Deja de mostrarse en la tienda y libera un cupo de tu plan. No se borra: podrás reactivarlo.'
          : 'Vuelve a mostrarse en la tienda. Ocupa un cupo de tu plan.'}
      </p>
      <div className="mt-4 space-y-3">
        <Alerta>{error}</Alerta>
        {producto.activo ? (
          <BotonConfirmar
            disabled={!puedeEditar}
            pregunta="¿Seguro que quieres desactivarlo?"
            textoConfirmar="Sí, desactivar"
            onConfirmar={() =>
              ejecutar(async () => {
                await desactivarProducto(producto.id)
                return { ...producto, activo: false }
              })
            }
          >
            Desactivar producto
          </BotonConfirmar>
        ) : (
          <Boton disabled={!puedeEditar} onClick={() => ejecutar(() => activarProducto(producto.id))}>
            Reactivar producto
          </Boton>
        )}
      </div>
    </section>
  )
}

export default function DetalleProducto() {
  const { id } = useParams()
  const { pathname, state } = useLocation()
  const navegar = useNavigate()
  // El aviso de "recién creado" se muestra una sola vez: después se borra del historial
  // para que no reaparezca al recargar o al volver con el botón Atrás.
  const [recienCreado] = useState(() => Boolean(state?.recienCreado))
  useEffect(() => {
    if (state?.recienCreado) navegar(pathname, { replace: true, state: null })
  }, [state, pathname, navegar])
  const { tienda } = useTiendas()
  const plan = usePlanTienda()
  const puedeEditar = tienda.administrable

  const cargar = useCallback(() => Promise.all([obtenerProducto(id), listarCategorias()]), [id])
  const { datos, cargando, error, setDatos } = useDatos(cargar)
  const [producto, categorias] = datos ?? [null, []]

  const actualizarEnPantalla = (nuevo) => setDatos(([, cats]) => [nuevo, cats])

  return (
    <div className="max-w-4xl">
      <Link to="/panel/productos" className="text-sm font-medium text-marca-700 hover:underline">
        ← Productos
      </Link>

      {cargando ? (
        <p className="mt-4 text-slate-500">Cargando producto…</p>
      ) : !producto ? (
        <div className="mt-4">
          <Alerta>{error || 'No se encontró el producto.'}</Alerta>
        </div>
      ) : (
        <>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold break-words text-slate-900">{producto.nombre}</h1>
            {!producto.activo && <Insignia tono="gris">Desactivado</Insignia>}
            {producto.destacado && <Insignia tono="azul">Destacado</Insignia>}
          </div>

          <div className="mt-6 space-y-6">
            {recienCreado && (
              <Alerta tipo="exito">Producto creado. Ahora puedes agregarle imágenes y variantes.</Alerta>
            )}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
              <h2 className="mb-4 font-semibold text-slate-900">Datos del producto</h2>
              <FormularioProducto
                key={producto.id}
                producto={producto}
                categorias={categorias}
                textoBoton="Guardar cambios"
                deshabilitado={!puedeEditar}
                onGuardar={async (cuerpo) => actualizarEnPantalla(await actualizarProducto(producto.id, cuerpo))}
              />
            </section>

            <SeccionImagenes productoId={producto.id} limite={plan?.maxImagenesProducto} puedeEditar={puedeEditar} />

            <SeccionVariantes productoId={producto.id} precioProducto={producto.precio} puedeEditar={puedeEditar} />

            <ZonaEstado producto={producto} puedeEditar={puedeEditar} onCambio={actualizarEnPantalla} />
          </div>
        </>
      )}
    </div>
  )
}
