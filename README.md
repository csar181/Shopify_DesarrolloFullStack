# ShopCloud

Proyecto universitario de Desarrollo Full Stack.

ShopCloud es una plataforma SaaS de comercio electrónico
inspirada en Shopify que permite a diferentes comerciantes
crear y administrar sus propias tiendas virtuales.

## Tecnologías

### Backend
- Java 22
- Spring Boot
- Spring Security
- JWT
- Spring Data JPA
- PostgreSQL
- Maven

### Frontend
- React (con Vite)
- Axios
- React Router
- Tailwind CSS

### Base de datos
- PostgreSQL


## Arquitectura

El sistema utiliza una arquitectura multi-tenant donde cada
tienda administra de manera independiente sus productos,
clientes, pedidos, inventario y demás recursos.

## Cómo ejecutarlo

Requiere PostgreSQL 17 o 18, JDK 22 y Node.js 20 o superior, más las variables `DB_PASSWORD` y `JWT_SECRET`. Ver [`docs/PRUEBAS.md`](docs/PRUEBAS.md#0-preparación-una-sola-vez).

```powershell
./database/aplicar.ps1                      # primera vez: crea la base y carga los planes
cd backend;  ./mvnw spring-boot:run         # http://localhost:8080
cd frontend; npm install; npm run dev       # http://localhost:5173
```

## Documentación

| Documento | Para qué |
|---|---|
| [`docs/API_BACKEND.md`](docs/API_BACKEND.md) | Rutas de la API, autenticación, errores y límites de los planes |
| [`docs/FRONTEND.md`](docs/FRONTEND.md) | Qué se hizo en el frontend, cómo está armado y por qué |
| [`docs/PRUEBAS.md`](docs/PRUEBAS.md) | Cómo verificar que todo funciona: pruebas del backend, de la API y recorrido en el navegador |
| [`database/README.md`](database/README.md) | Scripts de la base de datos |
| [`frontend/README.md`](frontend/README.md) | Comandos del frontend |
