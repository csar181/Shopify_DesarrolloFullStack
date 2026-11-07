import { useState } from 'react'

/** Logo de la tienda; si no tiene (o la URL falla), su inicial sobre el color de la tienda. */
export default function LogoTienda({ tienda, className = 'size-10' }) {
  const [fallo, setFallo] = useState(false)

  if (tienda.urlLogo && !fallo) {
    return (
      <img
        src={tienda.urlLogo}
        alt=""
        onError={() => setFallo(true)}
        className={`${className} shrink-0 rounded-lg border border-slate-200 bg-white object-contain`}
      />
    )
  }
  return (
    <span
      aria-hidden="true"
      style={{ backgroundColor: tienda.colorPrimario || '#059669' }}
      className={`${className} flex shrink-0 items-center justify-center rounded-lg font-semibold text-white`}
    >
      {tienda.nombre.charAt(0).toUpperCase()}
    </span>
  )
}
