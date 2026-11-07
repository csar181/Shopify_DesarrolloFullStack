import { estadoTienda } from '../../utils/tienda'

const TONOS = {
  verde: 'bg-marca-50 text-marca-700 ring-marca-600/20',
  ambar: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  rojo: 'bg-red-50 text-red-700 ring-red-600/20',
  gris: 'bg-slate-100 text-slate-600 ring-slate-500/20',
}

/** Etiqueta con la situación de la tienda: Publicada, Prueba gratis, Solo lectura o Desactivada. */
export default function EstadoTienda({ tienda }) {
  const { etiqueta, tono } = estadoTienda(tienda)
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${TONOS[tono]}`}>
      {etiqueta}
    </span>
  )
}
