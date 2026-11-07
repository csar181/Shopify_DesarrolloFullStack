import { useState } from 'react'
import { actualizarInventario, crearInventario, eliminarInventario } from '../../api/inventario'
import Alerta from '../ui/Alerta'
import BotonConfirmar from '../ui/BotonConfirmar'
import EditorStock from './EditorStock'
import EstadoStock from './EstadoStock'

function FilaStock({ titulo, subtitulo, registro, puedeEditar, onGuardar, onQuitar }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <p className="font-medium text-slate-900">{titulo}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <EstadoStock registro={registro} />
          {subtitulo && <span className="text-xs text-slate-500">{subtitulo}</span>}
        </div>
      </div>
      <div className="flex flex-wrap items-end justify-end gap-2">
        <EditorStock
          key={registro ? `${registro.id}-${registro.cantidad}-${registro.cantidadMinima}` : 'nuevo'}
          etiqueta={titulo}
          registro={registro}
          puedeEditar={puedeEditar}
          onGuardar={onGuardar}
        />
        {onQuitar && puedeEditar && (
          <BotonConfirmar pregunta="¿Quitar el registro?" textoConfirmar="Sí, quitar" onConfirmar={onQuitar}>
            Quitar registro
          </BotonConfirmar>
        )}
      </div>
    </li>
  )
}

/**
 * Stock de un producto, en su detalle. Sin variantes se lleva un stock general;
 * con variantes, uno por cada variante (el backend no permite mezclar las dos formas).
 *
 * `inventario` son los registros de este producto; `setInventario` actualiza la lista completa de la tienda.
 */
export default function SeccionInventario({ producto, variantes, inventario, setInventario, puedeEditar }) {
  const [mensaje, setMensaje] = useState('')

  const general = inventario.find((r) => r.varianteId == null) ?? null
  const porVariante = inventario.filter((r) => r.varianteId != null)
  const usaVariantes = !general && (variantes.length > 0 || porVariante.length > 0)
  // Registros de variantes que ya fueron eliminadas: quedan en el backend con su stock.
  const huerfanos = porVariante.filter((r) => !variantes.some((v) => v.id === r.varianteId))

  const reemplazar = (registro) =>
    setInventario((todos) =>
      todos.some((r) => r.id === registro.id) ? todos.map((r) => (r.id === registro.id ? registro : r)) : [...todos, registro],
    )

  /** Crea el registro si no existe o actualiza el existente. */
  const guardar = (registro, varianteId) => async (valores) => {
    setMensaje('')
    reemplazar(
      registro
        ? await actualizarInventario(registro.id, valores)
        : await crearInventario({ productoId: producto.id, varianteId, ...valores }),
    )
  }

  const quitar = (registro) => async () => {
    setMensaje('')
    try {
      await eliminarInventario(registro.id)
      setInventario((todos) => todos.filter((r) => r.id !== registro.id))
    } catch (e) {
      setMensaje(e.message)
    }
  }

  return (
    <section id="inventario" className="scroll-mt-6 rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
      <h2 className="font-semibold text-slate-900">Inventario</h2>
      <p className="mt-1 text-sm text-slate-500">
        {usaVariantes
          ? 'Este producto tiene variantes: el stock se lleva por cada una.'
          : 'Stock del producto. Si lo vendes en tallas o colores, crea variantes antes de registrar el stock.'}{' '}
        Sin stock registrado, el producto no se puede comprar.
      </p>

      <div className="mt-4 space-y-3">
        <Alerta>{mensaje}</Alerta>
        <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200">
          {usaVariantes ? (
            <>
              {variantes.map((variante) => {
                const registro = porVariante.find((r) => r.varianteId === variante.id) ?? null
                return (
                  <FilaStock
                    key={variante.id}
                    titulo={variante.nombre}
                    registro={registro}
                    puedeEditar={puedeEditar}
                    onGuardar={guardar(registro, variante.id)}
                  />
                )
              })}
              {huerfanos.map((registro) => (
                <FilaStock
                  key={registro.id}
                  titulo={registro.varianteNombre}
                  subtitulo="Variante eliminada"
                  registro={registro}
                  puedeEditar={puedeEditar}
                  onGuardar={guardar(registro)}
                  onQuitar={registro.cantidad === 0 ? quitar(registro) : undefined}
                />
              ))}
            </>
          ) : (
            <FilaStock
              titulo="Stock del producto"
              registro={general}
              puedeEditar={puedeEditar}
              onGuardar={guardar(general, null)}
              // Con stock 0 se puede quitar el registro general para pasar a stock por variantes.
              onQuitar={general?.cantidad === 0 ? quitar(general) : undefined}
            />
          )}
        </ul>
        {general && general.cantidad > 0 && (
          <p className="text-xs text-slate-500">
            Para manejar el stock por variantes, deja la cantidad en 0, quita el registro y luego agrega las variantes.
          </p>
        )}
      </div>
    </section>
  )
}
