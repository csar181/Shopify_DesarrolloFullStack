// Corre todas las pruebas de la API, una tras otra, y muestra un resumen.
//   node pruebas/api/todas.mjs
// Ver docs/PRUEBAS.md.
import { spawnSync } from 'node:child_process'
import { readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const carpeta = dirname(fileURLToPath(import.meta.url))
const pruebas = readdirSync(carpeta).filter((archivo) => /^\d{2}-.+\.mjs$/.test(archivo)).sort()
const resultados = []

for (const archivo of pruebas) {
  console.log(`\n=== ${archivo} ===`)
  const { status } = spawnSync(process.execPath, [join(carpeta, archivo)], { stdio: 'inherit' })
  resultados.push({ archivo, bien: status === 0 })
  if (status === 2) break // el backend no responde: no tiene sentido seguir
}

console.log('\n=== Resumen ===')
for (const { archivo, bien } of resultados) console.log(`${bien ? '  OK ' : '  XX '} ${archivo}`)
const fallidas = resultados.filter((r) => !r.bien).length
console.log(fallidas ? `\n${fallidas} prueba(s) con fallas.` : '\nTodas las pruebas pasaron.')
console.log('Para borrar los datos que crearon: ver "Limpiar" en docs/PRUEBAS.md.')
process.exitCode = fallidas ? 1 : 0
