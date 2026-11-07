import { useEffect, useRef, useState } from 'react'
import { formatearSoles } from '../../utils/formato'

// Gráfico de columnas hecho a mano en SVG (sin librerías), con las reglas de la guía de dataviz:
// columnas de 24px como máximo, punta redondeada de 4px y base recta, 2px de separación,
// rejilla de 1px apenas visible, una sola etiqueta (el día más alto) y tooltip al pasar
// el mouse o al moverse con las flechas del teclado.

const COLOR = '#059669' // marca-600: validado con validate_palette.js sobre blanco (contraste >= 3:1)
const ALTO = 240
const M = { arriba: 28, abajo: 28, izquierda: 64, derecha: 8 }

const soles0 = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 })
const solesCompacto = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  notation: 'compact',
  maximumFractionDigits: 1,
})
const diaCorto = new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short' })
const diaLargo = new Intl.DateTimeFormat('es-PE', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
// 'YYYY-MM-DD' se interpreta como fecha local (con new Date('2026-11-07') sería UTC y se correría un día).
const aFecha = (texto) => {
  const [a, m, d] = texto.split('-').map(Number)
  return new Date(a, m - 1, d)
}

/** Tope y paso "redondos" para el eje: 0, 25, 50, 75, 100… */
function escala(maximo) {
  if (maximo <= 0) return { tope: 100, paso: 25 }
  const bruto = maximo / 4
  const magnitud = 10 ** Math.floor(Math.log10(bruto))
  const n = bruto / magnitud
  const paso = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * magnitud
  return { tope: paso * Math.ceil(maximo / paso), paso }
}

/** Columna con la punta redondeada (4px) y la base recta. */
function columna(x, y, ancho, base) {
  const r = Math.min(4, ancho / 2, base - y)
  return `M${x},${base} V${y + r} Q${x},${y} ${x + r},${y} H${x + ancho - r} Q${x + ancho},${y} ${x + ancho},${y + r} V${base} Z`
}

/**
 * `dias`: todos los días del rango, también los que no tuvieron ventas
 * ([{ fecha: 'YYYY-MM-DD', monto, pedidos, productos, clientes }]).
 */
export default function GraficoVentasDiarias({ dias }) {
  const contenedor = useRef(null)
  const [ancho, setAncho] = useState(0)
  const [activo, setActivo] = useState(null)

  // Se dibuja en píxeles reales (no con viewBox) para que las columnas nunca pasen de 24px.
  useEffect(() => {
    const observador = new ResizeObserver(([entrada]) => setAncho(entrada.contentRect.width))
    observador.observe(contenedor.current)
    return () => observador.disconnect()
  }, [])

  const n = dias.length
  const { tope, paso } = escala(Math.max(...dias.map((d) => d.monto), 0))
  const marcas = Array.from({ length: Math.round(tope / paso) + 1 }, (_, i) => i * paso)
  const etiquetaEje = (v) => (tope >= 10000 ? solesCompacto.format(v) : soles0.format(v))

  const util = Math.max(0, ancho - M.izquierda - M.derecha)
  const ranura = n > 0 ? util / n : 0
  const anchoColumna = Math.max(2, Math.min(24, ranura - 2))
  const base = ALTO - M.abajo
  const y = (v) => M.arriba + (base - M.arriba) * (1 - v / tope)
  const xColumna = (i) => M.izquierda + i * ranura + (ranura - anchoColumna) / 2
  const centro = (i) => M.izquierda + i * ranura + ranura / 2

  // Solo se rotula el día más alto; el resto queda en el tooltip y en la tabla.
  const indiceMaximo = dias.reduce((mejor, d, i) => (d.monto > (dias[mejor]?.monto ?? 0) ? i : mejor), 0)
  const cadaCuanto = Math.max(1, Math.ceil(n / Math.max(1, Math.floor(util / 64))))

  function indiceEn(clienteX) {
    const caja = contenedor.current.getBoundingClientRect()
    const i = Math.floor((clienteX - caja.left - M.izquierda) / ranura)
    return i >= 0 && i < n ? i : null
  }

  function teclado(evento) {
    const mover = { ArrowRight: 1, ArrowLeft: -1 }[evento.key]
    if (mover) {
      evento.preventDefault()
      setActivo((a) => Math.min(n - 1, Math.max(0, (a ?? indiceMaximo) + mover)))
    } else if (evento.key === 'Home') {
      setActivo(0)
    } else if (evento.key === 'End') {
      setActivo(n - 1)
    }
  }

  const dia = activo !== null ? dias[activo] : null
  const descripcion = dia
    ? `${diaLargo.format(aFecha(dia.fecha))}: ${formatearSoles(dia.monto)}, ${dia.pedidos} ${dia.pedidos === 1 ? 'pedido' : 'pedidos'}`
    : ''

  return (
    <div
      ref={contenedor}
      className="relative outline-none focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-marca-500"
      tabIndex={0}
      role="group"
      aria-label="Ventas por día. Usa las flechas izquierda y derecha para recorrer los días."
      onPointerMove={(e) => setActivo(indiceEn(e.clientX))}
      onPointerLeave={() => setActivo(null)}
      onKeyDown={teclado}
      onFocus={() => setActivo((a) => a ?? indiceMaximo)}
      onBlur={() => setActivo(null)}
    >
      <svg width={ancho} height={ALTO} aria-hidden="true" className="block">
        {/* Rejilla y eje Y: 1px, sólida y apenas visible. */}
        {marcas.map((v) => (
          <g key={v}>
            <line x1={M.izquierda} x2={ancho - M.derecha} y1={y(v)} y2={y(v)} stroke="#e2e8f0" strokeWidth="1" />
            <text x={M.izquierda - 8} y={y(v)} dy="0.32em" textAnchor="end" className="fill-slate-500 text-[11px] tabular-nums">
              {etiquetaEje(v)}
            </text>
          </g>
        ))}

        {/* Línea vertical del día activo. */}
        {dia && <line x1={centro(activo)} x2={centro(activo)} y1={M.arriba} y2={base} stroke="#cbd5e1" strokeWidth="1" />}

        {dias.map((d, i) =>
          d.monto > 0 ? (
            <path
              key={d.fecha}
              d={columna(xColumna(i), y(d.monto), anchoColumna, base)}
              fill={COLOR}
              opacity={activo === null || activo === i ? 1 : 0.55}
            />
          ) : null,
        )}

        {/* Única etiqueta directa: el valor del día más alto, sobre su columna. */}
        {dias[indiceMaximo]?.monto > 0 && (
          <text
            x={centro(indiceMaximo)}
            y={y(dias[indiceMaximo].monto) - 8}
            textAnchor="middle"
            className="fill-slate-700 text-[11px] font-semibold tabular-nums"
          >
            {soles0.format(dias[indiceMaximo].monto)}
          </text>
        )}

        {dias.map((d, i) =>
          i % cadaCuanto === 0 ? (
            <text key={d.fecha} x={centro(i)} y={ALTO - 8} textAnchor="middle" className="fill-slate-500 text-[11px]">
              {diaCorto.format(aFecha(d.fecha))}
            </text>
          ) : null,
        )}
      </svg>

      {dia && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md"
          style={{
            left: Math.min(Math.max(centro(activo), 80), ancho - 80),
            top: Math.max(0, y(dia.monto) - 64),
          }}
        >
          <p className="text-sm font-semibold text-slate-900 tabular-nums">{formatearSoles(dia.monto)}</p>
          <p className="whitespace-nowrap text-slate-600">{diaLargo.format(aFecha(dia.fecha))}</p>
          <p className="whitespace-nowrap text-slate-500">
            {dia.pedidos} {dia.pedidos === 1 ? 'pedido' : 'pedidos'} · {dia.productos}{' '}
            {dia.productos === 1 ? 'unidad' : 'unidades'}
          </p>
        </div>
      )}
      {/* Lo mismo que el tooltip, para lectores de pantalla. */}
      <p className="sr-only" aria-live="polite">
        {descripcion}
      </p>
    </div>
  )
}
