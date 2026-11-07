import { useState } from 'react'

/** Imagen de producto con un reemplazo gris si no tiene o si la URL falla. */
export default function ImagenProducto({ url, alt = '', className = '' }) {
  const [fallo, setFallo] = useState(false)

  if (!url || fallo) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 text-xs text-slate-400 ${className}`} role="img" aria-label={alt}>
        Sin imagen
      </div>
    )
  }
  return <img src={url} alt={alt} onError={() => setFallo(true)} className={`bg-slate-100 object-cover ${className}`} />
}
