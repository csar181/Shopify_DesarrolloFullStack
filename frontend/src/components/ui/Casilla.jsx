/** Checkbox con su texto. */
export default function Casilla({ etiqueta, ayuda, className = '', ...props }) {
  return (
    <label className={`flex items-start gap-3 ${className}`}>
      <input
        type="checkbox"
        className="mt-0.5 size-4 rounded border-slate-300 accent-marca-600 disabled:cursor-not-allowed"
        {...props}
      />
      <span>
        <span className="block text-sm font-medium text-slate-700">{etiqueta}</span>
        {ayuda && <span className="block text-xs text-slate-500">{ayuda}</span>}
      </span>
    </label>
  )
}
