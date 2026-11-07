import { useAuth } from '../../context/AuthContext'

export default function InicioPanel() {
  const { usuario } = useAuth()

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold text-slate-900">Hola, {usuario?.nombre}</h1>
      <p className="mt-2 text-slate-600">
        Desde aquí vas a administrar tus tiendas. Pronto podrás crear tu primera tienda y elegir su plan.
      </p>
    </div>
  )
}
