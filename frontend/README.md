# Frontend de ShopCloud

React 19 con Vite, React Router, Axios y Tailwind CSS 4.

- Qué se hizo, cómo está armado y por qué: [`docs/FRONTEND.md`](../docs/FRONTEND.md).
- Cómo probar que todo funciona: [`docs/PRUEBAS.md`](../docs/PRUEBAS.md).

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

### Si después de `npm ci` dice que "vite" no se reconoce

En Windows, `npm ci` con `npm run dev` corriendo deja `node_modules` a medias. Detén el servidor y vuelve a ejecutar `npm ci`.

## Estructura

```text
src/
  api/          una función por endpoint, agrupadas por módulo
    cliente.js        apiPublica y apiPropietario (token y X-Tenant-ID)
    clienteTienda.js  rutas del cliente de una tienda (su propio token)
    errores.js        convierte las respuestas problem+json en ErrorApi
    sesion.js         sesiones, tienda activa y carrito en localStorage
  context/      AuthContext, TiendaContext y TiendaPublicaContext
  hooks/        useDatos (cargar datos) y usePlanTienda (límites del plan)
  layouts/      PublicoLayout, PanelLayout y TiendaPublicaLayout
  pages/        auth/, panel/ y tienda/ (la tienda pública)
  components/   ui/ (Boton, Campo, Alerta...) y uno por módulo
  utils/        formatos, estados, slug y colores
```

## Cómo llamar a la API

```js
import { apiPropietario } from '../api/cliente'

try {
  await apiPropietario.post('/productos', datos)
} catch (error) {
  // ErrorApi: status, codigo (LIMITE_PLAN...), errores por campo y message.
  setErrores(error.errores) // { nombre: 'El nombre es obligatorio' }
  setMensaje(error.message)
}
```

Más detalles en la sección "Cómo habla con el backend" de [`docs/FRONTEND.md`](../docs/FRONTEND.md#4-cómo-habla-con-el-backend).
