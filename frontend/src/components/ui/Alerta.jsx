const TIPOS = {
  error: 'border-red-200 bg-red-50 text-red-800',
  info: 'border-sky-200 bg-sky-50 text-sky-800',
  exito: 'border-marca-100 bg-marca-50 text-marca-700',
}

export default function Alerta({ tipo = 'error', children }) {
  if (!children) return null
  return (
    <div role={tipo === 'error' ? 'alert' : 'status'} className={`rounded-lg border px-4 py-3 text-sm ${TIPOS[tipo]}`}>
      {children}
    </div>
  )
}
