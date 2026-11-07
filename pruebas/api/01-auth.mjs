// Registro, inicio de sesión y planes del propietario (PR #6).
import { API, CLAVE, correo, llamar, ok, seccion, terminar } from './comun.mjs'

seccion('CORS y planes')
const preflight = await fetch(`${API}/auth/login`, {
  method: 'OPTIONS',
  headers: { Origin: 'http://localhost:5173', 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type' },
})
ok(preflight.headers.get('access-control-allow-origin') === 'http://localhost:5173', 'el backend acepta llamadas desde http://localhost:5173')
let r = await llamar('GET', '/planes')
ok(r.s === 200 && ['Emprendedor', 'Crecimiento', 'Profesional'].every((n) => r.d.some((p) => p.nombre === n)), `GET /planes: ${r.d.map((p) => p.nombre).join(', ')}`)

seccion('Registro')
r = await llamar('POST', '/auth/registro', { cuerpo: { nombre: '', correoElectronico: 'malo', contrasena: '123' } })
ok(r.s === 400 && r.d.errores.nombre && r.d.errores.correoElectronico && r.d.errores.contrasena, `datos inválidos: un error por campo (${Object.keys(r.d.errores ?? {}).join(', ')})`)
const cuenta = { nombre: 'Prueba Auth', correoElectronico: correo('auth'), contrasena: CLAVE }
r = await llamar('POST', '/auth/registro', { cuerpo: cuenta })
ok(r.s === 201 && r.d.token, 'registro válido: 201 con token (queda con sesión iniciada)')
r = await llamar('POST', '/auth/registro', { cuerpo: cuenta })
ok(r.s === 409, `correo repetido: ${r.s} "${r.d.detail}"`)

seccion('Inicio de sesión')
r = await llamar('POST', '/auth/login', { cuerpo: { correoElectronico: cuenta.correoElectronico, contrasena: 'otra-clave' } })
ok(r.s === 401, 'clave incorrecta: 401')
r = await llamar('POST', '/auth/login', { cuerpo: { correoElectronico: cuenta.correoElectronico.toUpperCase(), contrasena: CLAVE } })
ok(r.s === 200 && r.d.token, 'login correcto (el correo no distingue mayúsculas)')
const token = r.d.token
r = await llamar('GET', '/auth/me', { token })
ok(r.s === 200 && r.d.nombre === 'Prueba Auth', 'GET /auth/me devuelve al usuario')
r = await llamar('GET', '/auth/me', { token: 'abc.def.ghi' })
ok(r.s === 401, 'token inválido: 401 (el frontend cierra la sesión y vuelve al login)')

terminar()
