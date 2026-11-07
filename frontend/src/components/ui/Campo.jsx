import { useId } from 'react'

/** Input con etiqueta y mensaje de error (por ejemplo, el de `errores` del backend). */
export default function Campo({ etiqueta, error, className = '', ...props }) {
  const id = useId()
  const idError = `${id}-error`

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">
        {etiqueta}
      </label>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? idError : undefined}
        className={`block w-full rounded-lg border bg-white px-3 py-2 text-sm shadow-xs outline-none focus:ring-2 ${
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
            : 'border-slate-300 focus:border-marca-500 focus:ring-marca-100'
        }`}
        {...props}
      />
      {error && (
        <p id={idError} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
