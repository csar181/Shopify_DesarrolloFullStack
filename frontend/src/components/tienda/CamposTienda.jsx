import { COLOR_POR_DEFECTO } from '../../utils/tienda'
import Campo from '../ui/Campo'

function Seccion({ titulo, descripcion, children }) {
  return (
    <section className="grid gap-4 border-t border-slate-200 pt-6 md:grid-cols-3">
      <div>
        <h2 className="font-semibold text-slate-900">{titulo}</h2>
        {descripcion && <p className="mt-1 text-sm text-slate-500">{descripcion}</p>}
      </div>
      <div className="space-y-4 md:col-span-2">{children}</div>
    </section>
  )
}

/**
 * Campos del formulario. `datos` usa los mismos nombres que los DTO del backend,
 * así los errores de validación (`errores.nombre`, `errores.correoContacto`...) caen en su campo.
 */
export default function CamposTienda({ datos, errores, onChange, deshabilitado = false, despuesDelNombre }) {
  const props = (nombre) => ({
    name: nombre,
    value: datos[nombre],
    onChange,
    error: errores[nombre],
    disabled: deshabilitado,
  })

  return (
    <>
      <Seccion titulo="Datos generales" descripcion="Así verán tu tienda los clientes.">
        <Campo etiqueta="Nombre de la tienda" required maxLength={150} {...props('nombre')} />
        {despuesDelNombre}
        <Campo etiqueta="Descripción" multilinea {...props('descripcion')} />
      </Seccion>

      <Seccion titulo="Apariencia" descripcion="Pega la URL de una imagen publicada en internet.">
        <Campo etiqueta="URL del logo" type="url" maxLength={500} placeholder="https://..." {...props('urlLogo')} />
        <Campo etiqueta="URL del banner" type="url" maxLength={500} placeholder="https://..." {...props('urlBanner')} />
        <div>
          <label htmlFor="colorPrimario" className="mb-1 block text-sm font-medium text-slate-700">
            Color principal
          </label>
          <div className="flex items-center gap-3">
            <input
              id="colorPrimario"
              type="color"
              name="colorPrimario"
              value={datos.colorPrimario || COLOR_POR_DEFECTO}
              onChange={onChange}
              disabled={deshabilitado}
              className="h-10 w-14 cursor-pointer rounded-lg border border-slate-300 bg-white p-1 disabled:cursor-not-allowed"
            />
            <span className="font-mono text-sm text-slate-600">{datos.colorPrimario}</span>
          </div>
          {errores.colorPrimario && <p className="mt-1 text-sm text-red-600">{errores.colorPrimario}</p>}
        </div>
      </Seccion>

      <Seccion titulo="Contacto" descripcion="Opcional. Se muestra en tu tienda.">
        <Campo etiqueta="Correo de contacto" type="email" maxLength={150} {...props('correoContacto')} />
        <Campo etiqueta="Teléfono de contacto" type="tel" maxLength={30} {...props('telefonoContacto')} />
      </Seccion>
    </>
  )
}
