import { useState } from 'react'
import { vaciosANull } from '../../utils/tienda'
import Alerta from '../ui/Alerta'
import Boton from '../ui/Boton'
import Campo from '../ui/Campo'
import Casilla from '../ui/Casilla'

function datosIniciales(producto) {
  return {
    nombre: producto?.nombre ?? '',
    descripcion: producto?.descripcion ?? '',
    categoriaId: producto?.categoriaId ? String(producto.categoriaId) : '',
    sku: producto?.sku ?? '',
    precio: producto?.precio != null ? String(producto.precio) : '',
    destacado: producto?.destacado ?? false,
  }
}

/**
 * Datos básicos de un producto. `onGuardar` recibe el cuerpo listo para la API y puede lanzar
 * un ErrorApi: sus errores por campo se muestran bajo cada input.
 * `categorias` son las activas: el backend solo acepta categorías activas.
 */
export default function FormularioProducto({ producto, categorias, textoBoton, onGuardar, deshabilitado = false }) {
  const [datos, setDatos] = useState(() => datosIniciales(producto))
  const [errores, setErrores] = useState({})
  const [aviso, setAviso] = useState({ tipo: 'error', texto: '' })
  const [enviando, setEnviando] = useState(false)

  // Si su categoría fue desactivada, se muestra igual para que se entienda por qué no se puede guardar.
  const categoriaDesactivada =
    producto?.categoriaId && !categorias.some((c) => c.id === producto.categoriaId)
      ? { id: producto.categoriaId, nombre: `${producto.categoriaNombre} (desactivada)` }
      : null

  function cambiar(evento) {
    const { name, value, type, checked } = evento.target
    setDatos({ ...datos, [name]: type === 'checkbox' ? checked : value })
  }

  async function enviar(evento) {
    evento.preventDefault()
    setEnviando(true)
    setErrores({})
    setAviso({ tipo: 'error', texto: '' })
    try {
      await onGuardar(
        vaciosANull({
          ...datos,
          categoriaId: datos.categoriaId ? Number(datos.categoriaId) : null,
        }),
      )
      if (producto) setAviso({ tipo: 'exito', texto: 'Cambios guardados.' })
    } catch (error) {
      setErrores(error.errores ?? {})
      setAviso({
        tipo: 'error',
        texto: Object.keys(error.errores ?? {}).length > 0 ? 'Revisa los campos marcados.' : error.message,
      })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="space-y-4">
      <Alerta tipo={aviso.tipo}>{aviso.texto}</Alerta>
      <Campo
        etiqueta="Nombre"
        name="nombre"
        required
        maxLength={150}
        value={datos.nombre}
        onChange={cambiar}
        error={errores.nombre}
        disabled={deshabilitado}
      />
      <Campo
        etiqueta="Descripción"
        name="descripcion"
        multilinea
        value={datos.descripcion}
        onChange={cambiar}
        error={errores.descripcion}
        disabled={deshabilitado}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Campo
          etiqueta="Precio (S/)"
          name="precio"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          required
          value={datos.precio}
          onChange={cambiar}
          error={errores.precio}
          disabled={deshabilitado}
        />
        <Campo
          etiqueta="Categoría"
          name="categoriaId"
          seleccion
          value={datos.categoriaId}
          onChange={cambiar}
          error={errores.categoriaId}
          disabled={deshabilitado}
        >
          <option value="">Sin categoría</option>
          {categoriaDesactivada && <option value={categoriaDesactivada.id}>{categoriaDesactivada.nombre}</option>}
          {categorias.map((categoria) => (
            <option key={categoria.id} value={categoria.id}>
              {categoria.nombre}
            </option>
          ))}
        </Campo>
        <Campo
          etiqueta="SKU (opcional)"
          name="sku"
          maxLength={100}
          value={datos.sku}
          onChange={cambiar}
          error={errores.sku}
          ayuda="Código interno. No se repite en la tienda."
          disabled={deshabilitado}
        />
      </div>
      <Casilla
        etiqueta="Producto destacado"
        ayuda="Se muestra primero en la tienda."
        name="destacado"
        checked={datos.destacado}
        onChange={cambiar}
        disabled={deshabilitado}
      />
      <div className="flex justify-end">
        <Boton type="submit" cargando={enviando} disabled={deshabilitado}>
          {textoBoton}
        </Boton>
      </div>
    </form>
  )
}
