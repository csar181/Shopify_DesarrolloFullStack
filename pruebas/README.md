# Pruebas

Pruebas automáticas de la API con las mismas llamadas que hace el frontend. Sirven para comprobar que el backend y el frontend siguen de acuerdo.

```powershell
node pruebas/api/todas.mjs          # todas (el backend debe estar en marcha)
node pruebas/api/07-checkout.mjs    # solo una
```

La guía completa está en [`docs/PRUEBAS.md`](../docs/PRUEBAS.md). Ahí se explica qué cubre cada archivo, cómo borrar los datos que crean y el recorrido manual en el navegador.
