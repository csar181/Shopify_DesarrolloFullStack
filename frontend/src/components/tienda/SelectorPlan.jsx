import { formatearSoles } from '../../utils/formato'

/** Tarjetas de planes que funcionan como radio buttons. */
export default function SelectorPlan({ planes, valor, onChange, error }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-slate-700">Plan para la prueba gratuita</legend>
      <div className="grid gap-3 sm:grid-cols-3">
        {planes.map((plan) => {
          const elegido = plan.id === valor
          return (
            <label
              key={plan.id}
              className={`cursor-pointer rounded-xl border p-4 transition-colors has-focus-visible:ring-2 has-focus-visible:ring-marca-500 ${
                elegido ? 'border-marca-600 bg-marca-50 ring-1 ring-marca-600' : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                name="planId"
                value={plan.id}
                checked={elegido}
                onChange={() => onChange(plan.id)}
                className="sr-only"
              />
              <span className="block font-semibold text-slate-900">{plan.nombre}</span>
              <span className="mt-1 block text-sm text-slate-600">{formatearSoles(plan.precio)} / mes</span>
              <span className="mt-2 block text-xs text-slate-500">
                {plan.maxProductos} productos · {plan.maxCategorias} categorías
              </span>
            </label>
          )
        })}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      <p className="mt-2 text-xs text-slate-500">
        Son 7 días gratis con los límites del plan. Mientras dure la prueba puedes cambiar de plan.
      </p>
    </fieldset>
  )
}
