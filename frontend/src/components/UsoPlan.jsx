/**
 * Cuánto del límite del plan se está usando: "3 de 5 categorías activas".
 * Si no hay plan vigente (o el límite es null, que significa ilimitado), solo muestra el total.
 */
export default function UsoPlan({ usados, limite, recurso, plan }) {
  if (limite === null || limite === undefined) {
    return (
      <p className="text-sm text-slate-500">
        {usados} {recurso}
      </p>
    )
  }

  const porcentaje = Math.min(100, Math.round((usados / limite) * 100))
  const lleno = usados >= limite

  return (
    <div className="w-full max-w-xs">
      <p className={`text-sm ${lleno ? 'font-medium text-amber-800' : 'text-slate-600'}`}>
        {usados} de {limite} {recurso}
        {plan && <span className="text-slate-500"> · plan {plan}</span>}
      </p>
      <div
        className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200"
        role="progressbar"
        aria-valuenow={usados}
        aria-valuemin={0}
        aria-valuemax={limite}
        aria-label={`${recurso} usados`}
      >
        <div className={`h-full rounded-full ${lleno ? 'bg-amber-500' : 'bg-marca-600'}`} style={{ width: `${porcentaje}%` }} />
      </div>
      {lleno && <p className="mt-1 text-xs text-amber-800">Llegaste al límite. Desactiva alguno o cambia de plan.</p>}
    </div>
  )
}
