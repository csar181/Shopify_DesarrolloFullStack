import { useState } from 'react'
import Boton from './Boton'

/**
 * Botón de acción delicada: al pulsarlo pide confirmación en el mismo lugar.
 * `onConfirmar` puede ser async; mientras corre, los botones quedan deshabilitados.
 * Los errores los maneja quien la llama.
 */
export default function BotonConfirmar({
  children,
  pregunta = '¿Seguro?',
  textoConfirmar = 'Sí, continuar',
  // Rojo por defecto (desactivar, quitar...); 'primario' para confirmaciones no destructivas, como pagar.
  varianteConfirmar = 'peligro',
  onConfirmar,
  disabled = false,
  className = '',
}) {
  const [confirmando, setConfirmando] = useState(false)
  const [procesando, setProcesando] = useState(false)

  async function confirmar() {
    setProcesando(true)
    try {
      await onConfirmar()
    } finally {
      setProcesando(false)
      setConfirmando(false)
    }
  }

  if (!confirmando) {
    return (
      <Boton variante="secundario" disabled={disabled} onClick={() => setConfirmando(true)} className={className}>
        {children}
      </Boton>
    )
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span className="text-sm text-slate-700">{pregunta}</span>
      <Boton variante={varianteConfirmar} cargando={procesando} onClick={confirmar}>
        {textoConfirmar}
      </Boton>
      <Boton variante="secundario" disabled={procesando} onClick={() => setConfirmando(false)}>
        Cancelar
      </Boton>
    </span>
  )
}
