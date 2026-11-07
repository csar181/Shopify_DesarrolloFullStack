/**
 * Pestañas simples.
 *   <Pestanas opciones={[{ valor: 'activas', texto: 'Activas', cantidad: 3 }]} valor={...} onChange={...} />
 */
export default function Pestanas({ opciones, valor, onChange }) {
  return (
    <div role="tablist" className="flex gap-1 border-b border-slate-200">
      {opciones.map((opcion) => {
        const elegida = opcion.valor === valor
        return (
          <button
            key={opcion.valor}
            type="button"
            role="tab"
            aria-selected={elegida}
            onClick={() => onChange(opcion.valor)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium whitespace-nowrap ${
              elegida
                ? 'border-marca-600 text-marca-700'
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
            }`}
          >
            {opcion.texto}
            {opcion.cantidad !== undefined && (
              <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                {opcion.cantidad}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
