import { useId } from 'react'

/**
 * Input con etiqueta, ayuda y mensaje de error (por ejemplo, el de `errores` del backend).
 * Con `multilinea` se muestra un textarea; con `seleccion`, un select (las opciones van como children).
 */
export default function Campo({
  etiqueta,
  error,
  ayuda,
  multilinea = false,
  seleccion = false,
  className = '',
  ...props
}) {
  const id = useId()
  const idAyuda = `${id}-ayuda`
  const idError = `${id}-error`
  const descritoPor = [ayuda && idAyuda, error && idError].filter(Boolean).join(' ') || undefined
  const Elemento = multilinea ? 'textarea' : seleccion ? 'select' : 'input'

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">
        {etiqueta}
      </label>
      <Elemento
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={descritoPor}
        rows={multilinea ? 3 : undefined}
        className={`block w-full rounded-lg border bg-white px-3 py-2 text-sm shadow-xs outline-none focus:ring-2 disabled:bg-slate-50 disabled:text-slate-500 ${
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
            : 'border-slate-300 focus:border-marca-500 focus:ring-marca-100'
        }`}
        {...props}
      />
      {ayuda && !error && (
        <p id={idAyuda} className="mt-1 text-xs text-slate-500">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={idError} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
