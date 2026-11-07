# Frontend de ShopCloud

React 19 con Vite, React Router, Axios y Tailwind CSS 4.

## Ejecutar

Requiere Node.js 20 o superior y el backend en marcha en `http://localhost:8080` (ver `docs/API_BACKEND.md`).

```powershell
cd frontend
npm install
npm run dev      # http://localhost:5173
```

El puerto 5173 es fijo: el CORS del backend solo acepta ese origen. Si el backend corre en otra URL, copia `.env.example` como `.env.local` y cambia `VITE_API_URL`.

| Comando | Uso |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compilación de producción en `dist/` |
| `npm run lint` | Revisión del código con oxlint |

### Si la página se ve sin estilos

A veces, después de cambiar de rama o de un `git pull` que modifica `vite.config.js`, Vite se reinicia solo y Tailwind deja de procesar el CSS. Detén el servidor (`Ctrl + C`), vuelve a ejecutar `npm run dev` y recarga con `Ctrl + F5`.

## Estructura

```text
src/
  api/          llamadas al backend
    cliente.js    instancias de Axios: apiPublica y apiPropietario
    errores.js    convierte las respuestas problem+json en ErrorApi
    sesion.js     token del propietario y tienda actual en localStorage
  context/      estado global (AuthContext: sesión del propietario)
  components/   piezas reutilizables (ui/ tiene Boton, Campo, Alerta)
  layouts/      PublicoLayout (sitio) y PanelLayout (panel del propietario)
  pages/        una carpeta por área: auth/, panel/...
  utils/        formato de montos y otras utilidades
```

## Cómo llamar a la API

- Rutas públicas: `apiPublica`.
- Rutas del propietario: `apiPropietario`. Agrega `Authorization` y, si hay una tienda elegida, `X-Tenant-ID`. Si el token vence (401), cierra la sesión y lleva al login.
- Todos los errores llegan como `ErrorApi`, con `status`, `codigo` (por ejemplo `LIMITE_PLAN`), `errores` por campo y `message` listo para mostrar.

```js
try {
  await apiPropietario.post('/productos', datos)
} catch (error) {
  setErrores(error.errores) // { nombre: 'El nombre es obligatorio' }
  setMensaje(error.message)
}
```
