import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { listarPlanes } from '../../../api/planes'
import { crearTienda } from '../../../api/tiendas'
import CamposTienda from '../../../components/tienda/CamposTienda'
import SelectorPlan from '../../../components/tienda/SelectorPlan'
import Alerta from '../../../components/ui/Alerta'
import Boton from '../../../components/ui/Boton'
import Campo from '../../../components/ui/Campo'
import { useTiendas } from '../../../context/TiendaContext'
import { datosInicialesTienda, generarSlug, vaciosANull } from '../../../utils/tienda'

export default function NuevaTienda() {
  const { guardarEnLista, seleccionar } = useTiendas()
  const navegar = useNavigate()

  const [planes, setPlanes] = useState([])
  const [planId, setPlanId] = useState(null)
  const [datos, setDatos] = useState({ ...datosInicialesTienda(), slug: '' })
  const [errores, setErrores] = useState({})
  const [mensaje, setMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    listarPlanes()
      .then((lista) => {
        setPlanes(lista)
        setPlanId((actual) => actual ?? lista[0]?.id ?? null)
      })
      .catch((e) => setMensaje(e.message))
  }, [])

  function cambiar(evento) {
    setDatos({ ...datos, [evento.target.name]: evento.target.value })
  }

  async function enviar(evento) {
    evento.preventDefault()
    setEnviando(true)
    setErrores({})
    setMensaje('')
    try {
      const nueva = await crearTienda(vaciosANull({ ...datos, planId }))
      guardarEnLista(nueva)
      seleccionar(nueva.id)
      navegar('/panel')
    } catch (error) {
      setErrores(error.errores ?? {})
      setMensaje(Object.keys(error.errores ?? {}).length > 0 ? 'Revisa los campos marcados.' : error.message)
      setEnviando(false)
    }
  }

  const slugPrevisto = generarSlug(datos.slug || datos.nombre) || 'mi-tienda'

  return (
    <div className="max-w-4xl">
      <Link to="/panel/tiendas" className="text-sm font-medium text-marca-700 hover:underline">
        ← Mis tiendas
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">Nueva tienda</h1>

      <form onSubmit={enviar} noValidate className="mt-6 space-y-6">
        <Alerta>{mensaje}</Alerta>

        {planes.length > 0 && (
          <SelectorPlan planes={planes} valor={planId} onChange={setPlanId} error={errores.planId} />
        )}

        <CamposTienda
          datos={datos}
          errores={errores}
          onChange={cambiar}
          despuesDelNombre={
            <Campo
              etiqueta="Dirección (opcional)"
              name="slug"
              maxLength={100}
              placeholder={generarSlug(datos.nombre) || 'mi-tienda'}
              value={datos.slug}
              onChange={cambiar}
              error={errores.slug}
              ayuda={`Tu tienda quedará en /tienda/${slugPrevisto}. Si ya está en uso, se le agrega un número. No se puede cambiar después.`}
            />
          }
        />

        <div className="flex justify-end gap-3 border-t border-slate-200 pt-6">
          <Link
            to="/panel/tiendas"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </Link>
          <Boton type="submit" cargando={enviando} disabled={!planId}>
            Crear tienda
          </Boton>
        </div>
      </form>
    </div>
  )
}
