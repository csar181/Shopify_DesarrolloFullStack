/** Dirección pública de la tienda: enlace si está publicada; si no, solo el texto. */
export default function DireccionTienda({ tienda, className = '' }) {
  const ruta = `/tienda/${tienda.slug}`

  if (!tienda.publicada) {
    return (
      <span className={className} title="Se podrá visitar cuando la tienda tenga un plan pagado">
        {ruta} <span className="font-normal text-slate-400">(aún no visible)</span>
      </span>
    )
  }
  return (
    <a href={ruta} target="_blank" rel="noreferrer" className={`hover:underline ${className}`}>
      {ruta} ↗
    </a>
  )
}
