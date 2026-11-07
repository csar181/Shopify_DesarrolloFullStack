const TONOS = {
  verde: 'bg-marca-50 text-marca-700 ring-marca-600/20',
  ambar: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  rojo: 'bg-red-50 text-red-700 ring-red-600/20',
  gris: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  azul: 'bg-sky-50 text-sky-700 ring-sky-600/20',
}

/** Etiqueta pequeña de estado: "Desactivado", "Destacado", "Principal"... */
export default function Insignia({ tono = 'gris', children }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset ${TONOS[tono]}`}>
      {children}
    </span>
  )
}
