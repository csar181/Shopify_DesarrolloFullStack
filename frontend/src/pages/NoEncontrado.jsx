import { Link } from 'react-router'

export default function NoEncontrado() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <p className="text-sm font-semibold text-marca-700">404</p>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">Página no encontrada</h1>
      <p className="mt-2 text-slate-600">La dirección no existe o fue movida.</p>
      <Link to="/" className="mt-6 inline-block font-medium text-marca-700 hover:underline">
        Volver al inicio
      </Link>
    </div>
  )
}
