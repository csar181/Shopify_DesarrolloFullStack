/**
 * Color de texto legible sobre un fondo: blanco sobre colores oscuros, casi negro sobre claros.
 * Así un comerciante puede elegir amarillo como color principal y los botones siguen siendo legibles.
 */
export function textoSobre(hex) {
  const valor = /^#?([0-9a-f]{6})$/i.exec(hex ?? '')?.[1]
  if (!valor) return '#ffffff'
  const [r, g, b] = [0, 2, 4].map((i) => {
    const canal = parseInt(valor.slice(i, i + 2), 16) / 255
    return canal <= 0.03928 ? canal / 12.92 : ((canal + 0.055) / 1.055) ** 2.4
  })
  const luminancia = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return luminancia > 0.4 ? '#0f172a' : '#ffffff'
}
