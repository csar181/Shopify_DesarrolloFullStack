import { estadoTienda } from '../../utils/tienda'

const ESTILOS = {
  ambar: 'border-amber-200 bg-amber-50 text-amber-900',
  rojo: 'border-red-200 bg-red-50 text-red-800',
  gris: 'border-slate-200 bg-slate-100 text-slate-700',
}

/** Aviso en la parte superior del panel cuando la tienda no está publicada. */
export default function AvisoTienda({ tienda }) {
  const { etiqueta, tono, detalle } = estadoTienda(tienda)
  if (tono === 'verde') return null

  return (
    <div role="status" className={`mb-6 rounded-lg border px-4 py-3 text-sm ${ESTILOS[tono]}`}>
      <strong className="font-semibold">{etiqueta}.</strong> {detalle}
    </div>
  )
}
