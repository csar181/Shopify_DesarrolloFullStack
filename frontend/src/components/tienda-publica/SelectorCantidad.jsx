/** Botones − y + para elegir una cantidad entre `minimo` y `maximo`. */
export default function SelectorCantidad({ valor, onChange, minimo = 1, maximo, etiqueta = 'Cantidad', disabled = false }) {
  const boton =
    'flex size-9 items-center justify-center text-lg text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent'

  return (
    <div className="inline-flex items-center rounded-lg border border-slate-300 bg-white" role="group" aria-label={etiqueta}>
      <button
        type="button"
        className={`${boton} rounded-l-lg`}
        onClick={() => onChange(valor - 1)}
        disabled={disabled || valor <= minimo}
        aria-label="Quitar uno"
      >
        −
      </button>
      <span className="min-w-10 text-center text-sm font-medium text-slate-900 tabular-nums" aria-live="polite">
        {valor}
      </span>
      <button
        type="button"
        className={`${boton} rounded-r-lg`}
        onClick={() => onChange(valor + 1)}
        disabled={disabled || valor >= maximo}
        aria-label="Agregar uno"
      >
        +
      </button>
    </div>
  )
}
