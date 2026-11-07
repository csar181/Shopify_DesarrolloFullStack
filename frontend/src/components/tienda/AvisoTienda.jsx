import { Link, useLocation } from 'react-router'
import { estadoTienda } from '../../utils/tienda'

const ESTILOS = {
  ambar: 'border-amber-200 bg-amber-50 text-amber-900',
  rojo: 'border-red-200 bg-red-50 text-red-800',
  gris: 'border-slate-200 bg-slate-100 text-slate-700',
}

/** Aviso en la parte superior del panel cuando la tienda no está publicada. */
export default function AvisoTienda({ tienda }) {
  const { pathname } = useLocation()
  const { etiqueta, tono, detalle } = estadoTienda(tienda)
  if (tono === 'verde') return null

  // En prueba o en solo lectura, la solución es contratar un plan; desactivada, reactivarla.
  const accion = tienda.activo
    ? { a: '/panel/suscripcion', texto: tono === 'ambar' ? 'Ver planes' : 'Contratar un plan' }
    : { a: '/panel/configuracion', texto: 'Reactivar' }

  return (
    <div role="status" className={`mb-6 rounded-lg border px-4 py-3 text-sm ${ESTILOS[tono]}`}>
      <strong className="font-semibold">{etiqueta}.</strong> {detalle}{' '}
      {pathname !== accion.a && (
        <Link to={accion.a} className="font-semibold underline underline-offset-2">
          {accion.texto} →
        </Link>
      )}
    </div>
  )
}
