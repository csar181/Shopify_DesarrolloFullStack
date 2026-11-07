import { useCallback, useState } from 'react'
import { actualizarImagen, agregarImagen, eliminarImagen, listarImagenes } from '../../api/productos'
import { useDatos } from '../../hooks/useDatos'
import Alerta from '../ui/Alerta'
import Boton from '../ui/Boton'
import BotonConfirmar from '../ui/BotonConfirmar'
import Campo from '../ui/Campo'
import Insignia from '../ui/Insignia'

function Miniatura({ url, className }) {
  const [fallo, setFallo] = useState(false)
  if (fallo) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 p-2 text-center text-xs text-slate-500 ${className}`}>
        No se pudo cargar la imagen
      </div>
    )
  }
  return <img src={url} alt="" onError={() => setFallo(true)} className={`bg-slate-100 object-cover ${className}`} />
}

/** Imágenes del producto. El backend solo guarda URLs; la principal es la que se ve en el catálogo. */
export default function SeccionImagenes({ productoId, limite, puedeEditar }) {
  const cargar = useCallback(() => listarImagenes(productoId), [productoId])
  const { datos: imagenes, cargando, error, setDatos } = useDatos(cargar)

  const [url, setUrl] = useState('')
  const [errorUrl, setErrorUrl] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)

  const lista = [...(imagenes ?? [])].sort((a, b) => Number(b.esPrincipal) - Number(a.esPrincipal) || a.id - b.id)
  const lleno = limite != null && lista.length >= limite

  async function agregar(evento) {
    evento.preventDefault()
    setEnviando(true)
    setErrorUrl('')
    setMensaje('')
    try {
      // La primera imagen queda como principal.
      const nueva = await agregarImagen(productoId, { urlImagen: url.trim(), esPrincipal: lista.length === 0 })
      setDatos((actuales) => [...actuales, nueva])
      setUrl('')
    } catch (e) {
      setErrorUrl(e.errores?.urlImagen ?? '')
      setMensaje(e.errores?.urlImagen ? '' : e.message)
    } finally {
      setEnviando(false)
    }
  }

  async function hacerPrincipal(imagen) {
    setMensaje('')
    try {
      await actualizarImagen(productoId, imagen.id, { urlImagen: imagen.urlImagen, esPrincipal: true })
      // El backend quita la marca a la anterior: aquí se hace lo mismo sin volver a pedir la lista.
      setDatos((actuales) => actuales.map((i) => ({ ...i, esPrincipal: i.id === imagen.id })))
    } catch (e) {
      setMensaje(e.message)
    }
  }

  async function quitar(imagen) {
    setMensaje('')
    try {
      await eliminarImagen(productoId, imagen.id)
      setDatos((actuales) => actuales.filter((i) => i.id !== imagen.id))
    } catch (e) {
      setMensaje(e.message)
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-semibold text-slate-900">Imágenes</h2>
        {limite != null && (
          <span className={`text-sm ${lleno ? 'font-medium text-amber-800' : 'text-slate-500'}`}>
            {lista.length} de {limite}
          </span>
        )}
      </div>

      <div className="mt-4 space-y-4">
        <Alerta>{error || mensaje}</Alerta>
        {cargando ? (
          <p className="text-sm text-slate-500">Cargando imágenes…</p>
        ) : lista.length === 0 ? (
          <p className="text-sm text-slate-500">Este producto todavía no tiene imágenes.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {lista.map((imagen) => (
              <li key={imagen.id} className="overflow-hidden rounded-xl border border-slate-200">
                <div className="relative">
                  <Miniatura url={imagen.urlImagen} className="aspect-square w-full" />
                  {imagen.esPrincipal && (
                    <span className="absolute top-2 left-2">
                      <Insignia tono="verde">Principal</Insignia>
                    </span>
                  )}
                </div>
                {puedeEditar && (
                  <div className="flex flex-col gap-2 p-2">
                    {!imagen.esPrincipal && (
                      <Boton variante="secundario" className="w-full px-2 text-xs" onClick={() => hacerPrincipal(imagen)}>
                        Hacer principal
                      </Boton>
                    )}
                    <BotonConfirmar
                      className="w-full px-2 text-xs"
                      pregunta="¿Quitarla?"
                      textoConfirmar="Sí"
                      onConfirmar={() => quitar(imagen)}
                    >
                      Quitar
                    </BotonConfirmar>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* Solo con la lista cargada: si falló, no se sabe si la nueva debe ser la principal. */}
        {imagenes &&
          puedeEditar &&
          (lleno ? (
            <p className="text-sm text-amber-800">
              Llegaste al máximo de imágenes de tu plan. Quita una para agregar otra.
            </p>
          ) : (
            <form onSubmit={agregar} noValidate className="flex flex-wrap items-end gap-3">
              <Campo
                className="min-w-0 flex-1"
                etiqueta="URL de la imagen"
                type="url"
                placeholder="https://..."
                maxLength={500}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                error={errorUrl}
                ayuda="Pega el enlace de una imagen publicada en internet."
              />
              {url.trim().startsWith('http') && <Miniatura key={url} url={url.trim()} className="size-16 rounded-lg" />}
              <Boton type="submit" cargando={enviando} disabled={!url.trim()}>
                Agregar
              </Boton>
            </form>
          ))}
      </div>
    </section>
  )
}
