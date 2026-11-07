const VARIANTES = {
  primario: 'bg-marca-600 text-white hover:bg-marca-700 disabled:bg-marca-600/60',
  secundario: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-60',
  peligro: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-600/60',
}

export default function Boton({
  variante = 'primario',
  cargando = false,
  disabled = false,
  className = '',
  children,
  ...props
}) {
  return (
    <button
      type="button"
      {...props}
      // Va después de {...props}: mientras carga, el botón queda bloqueado aunque reciba disabled={false}.
      disabled={cargando || disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-600 disabled:cursor-not-allowed ${VARIANTES[variante]} ${className}`}
    >
      {cargando && (
        <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
      )}
      {children}
    </button>
  )
}
