import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import {
  confirmarCompra,
  crearDireccion,
  listarDatosFacturacion,
  listarDirecciones,
  listarMetodosDePago,
  obtenerCarrito,
  resumenCompra,
} from '../../api/clienteTienda'
import { TIPOS_METODO_PAGO } from '../../api/metodosPago'
import FormularioDireccion from '../../components/tienda-publica/FormularioDireccion'
import Alerta from '../../components/ui/Alerta'
import Campo from '../../components/ui/Campo'
import Casilla from '../../components/ui/Casilla'
import { useTiendaPublica } from '../../context/TiendaPublicaContext'
import { useDatos } from '../../hooks/useDatos'
import { formatearSoles } from '../../utils/formato'
import { textoDireccion } from '../../utils/pedido'

const COMPROBANTES = {
  BOLETA: { documento: 'DNI', digitos: 8, etiquetaNombre: 'Nombre completo' },
  FACTURA: { documento: 'RUC', digitos: 11, etiquetaNombre: 'Razón social' },
}

function Paso({ numero, titulo, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 p-5">
      <h2 className="flex items-center gap-3 font-semibold text-slate-900">
        <span className="flex size-7 items-center justify-center rounded-full bg-(--tienda) text-sm text-(--tienda-texto)">
          {numero}
        </span>
        {titulo}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function Opcion({ nombre, valor, elegido, onElegir, children }) {
  return (
    <label
      className={`flex cursor-pointer gap-3 rounded-xl border p-3 has-focus-visible:ring-2 has-focus-visible:ring-slate-400 ${
        elegido ? 'border-(--tienda) bg-slate-50 ring-1 ring-(--tienda)' : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <input type="radio" name={nombre} value={valor} checked={elegido} onChange={() => onElegir(valor)} className="mt-1 accent-slate-900" />
      <span className="min-w-0 flex-1 text-sm">{children}</span>
    </label>
  )
}

function SeccionDireccion({ direcciones, elegida, onElegir, onNueva, slug }) {
  const [agregando, setAgregando] = useState(direcciones.length === 0)

  return (
    <div className="space-y-2">
      {direcciones.map((d) => (
        <Opcion key={d.id} nombre="direccion" valor={d.id} elegido={d.id === elegida} onElegir={onElegir}>
          <span className="font-medium text-slate-900">{textoDireccion(d)}</span>
          {d.referencia && <span className="block text-slate-500">Ref.: {d.referencia}</span>}
        </Opcion>
      ))}
      {agregando ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-4">
          <FormularioDireccion
            onCancelar={direcciones.length > 0 ? () => setAgregando(false) : undefined}
            onGuardar={async (datos) => {
              onNueva(await crearDireccion(slug, datos))
              setAgregando(false)
            }}
          />
        </div>
      ) : (
        <button type="button" onClick={() => setAgregando(true)} className="text-sm font-semibold text-slate-700 underline">
          + Agregar otra dirección
        </button>
      )}
    </div>
  )
}

function SeccionComprobante({ comprobante, setComprobante, guardados, errores }) {
  const reglas = COMPROBANTES[comprobante.tipo]
  // Solo sirven los datos guardados del documento que pide este comprobante (DNI o RUC).
  const aplicables = guardados.filter((g) => g.tipoDocumento === reglas.documento)
  const cambiar = (cambios) => setComprobante({ ...comprobante, ...cambios })

  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-lg border border-slate-300 p-1" role="radiogroup" aria-label="Tipo de comprobante">
        {Object.keys(COMPROBANTES).map((tipo) => (
          <button
            key={tipo}
            type="button"
            role="radio"
            aria-checked={comprobante.tipo === tipo}
            onClick={() => cambiar({ tipo, guardadoId: null })}
            className={`rounded-md px-4 py-1.5 text-sm font-medium ${
              comprobante.tipo === tipo ? 'bg-(--tienda) text-(--tienda-texto)' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tipo === 'BOLETA' ? 'Boleta' : 'Factura'}
          </button>
        ))}
      </div>

      {aplicables.length > 0 && (
        <div className="space-y-2">
          {aplicables.map((g) => (
            <Opcion key={g.id} nombre="facturacion" valor={g.id} elegido={comprobante.guardadoId === g.id} onElegir={(id) => cambiar({ guardadoId: id })}>
              <span className="font-medium text-slate-900">{g.nombreRazonSocial}</span>
              <span className="block text-slate-500">
                {g.tipoDocumento} {g.numeroDocumento}
              </span>
            </Opcion>
          ))}
          <Opcion nombre="facturacion" valor="" elegido={!comprobante.guardadoId} onElegir={() => cambiar({ guardadoId: null })}>
            <span className="font-medium text-slate-900">Usar otros datos</span>
          </Opcion>
        </div>
      )}

      {!comprobante.guardadoId && (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
            <Campo
              etiqueta={reglas.documento}
              inputMode="numeric"
              maxLength={reglas.digitos}
              value={comprobante.numeroDocumento}
              onChange={(e) => cambiar({ numeroDocumento: e.target.value.replace(/\D/g, '') })}
              error={errores.numeroDocumento}
              ayuda={`${reglas.digitos} dígitos`}
            />
            <Campo
              etiqueta={reglas.etiquetaNombre}
              maxLength={150}
              value={comprobante.nombreRazonSocial}
              onChange={(e) => cambiar({ nombreRazonSocial: e.target.value })}
              error={errores.nombreRazonSocial}
            />
          </div>
          {comprobante.tipo === 'FACTURA' && (
            <Campo
              etiqueta="Dirección fiscal (opcional)"
              maxLength={255}
              value={comprobante.direccionFiscal}
              onChange={(e) => cambiar({ direccionFiscal: e.target.value })}
            />
          )}
          <Casilla
            etiqueta="Guardar estos datos para mis próximas compras"
            checked={comprobante.guardar}
            onChange={(e) => cambiar({ guardar: e.target.checked })}
          />
        </div>
      )}
    </div>
  )
}

export default function Checkout() {
  const { slug, cliente, recargarCarrito } = useTiendaPublica()
  const base = `/tienda/${slug}`
  const navegar = useNavigate()

  // Sin sesión no se pide nada: más abajo se redirige a "Ingresar".
  const clienteId = cliente?.id
  const cargar = useCallback(
    () =>
      clienteId
        ? Promise.all([obtenerCarrito(slug), listarDirecciones(slug), listarMetodosDePago(slug), listarDatosFacturacion(slug)])
        : Promise.resolve(null),
    [slug, clienteId],
  )
  const { datos, cargando, error, setDatos } = useDatos(cargar)
  const [carrito, direcciones, metodos, guardados] = datos ?? [null, [], [], []]

  // Mientras no elija otra, se usan la primera dirección y el primer método.
  const [direccionElegida, setDireccionId] = useState(null)
  const [metodoElegido, setMetodoPagoId] = useState(null)
  const direccionId = direccionElegida ?? direcciones[0]?.id ?? null
  const metodoPagoId = metodoElegido ?? metodos[0]?.id ?? null
  const [comprobante, setComprobante] = useState({
    tipo: 'BOLETA',
    guardadoId: null,
    numeroDocumento: '',
    nombreRazonSocial: cliente?.nombre ?? '',
    direccionFiscal: '',
    guardar: true,
  })
  const [erroresComprobante, setErroresComprobante] = useState({})

  // El resumen (descuento, IGV y total) lo calcula siempre el backend.
  const [resumen, setResumen] = useState(null)
  const [codigo, setCodigo] = useState('')
  const [codigoAplicado, setCodigoAplicado] = useState(null)
  const [errorCodigo, setErrorCodigo] = useState('')

  const [errorPago, setErrorPago] = useState('')
  const [pagando, setPagando] = useState(false)

  const hayProductos = carrito?.elementos?.length > 0
  useEffect(() => {
    if (!hayProductos) return
    resumenCompra(slug)
      .then(setResumen)
      .catch((e) => setErrorPago(e.message))
  }, [slug, hayProductos])

  if (!cliente) {
    return <Navigate to={`${base}/ingresar?volver=checkout`} replace />
  }

  async function aplicarCodigo() {
    setErrorCodigo('')
    try {
      const nuevo = await resumenCompra(slug, codigo.trim())
      setResumen(nuevo)
      setCodigoAplicado(nuevo.codigoDescuento ?? codigo.trim())
    } catch (e) {
      setErrorCodigo(e.message)
    }
  }

  async function quitarCodigo() {
    setCodigo('')
    setCodigoAplicado(null)
    setErrorCodigo('')
    setResumen(await resumenCompra(slug))
  }

  /** Revisa lo mismo que el backend antes de enviar, para mostrar el error junto al campo. */
  function validarComprobante() {
    if (comprobante.guardadoId) return {}
    const reglas = COMPROBANTES[comprobante.tipo]
    const errores = {}
    if (!new RegExp(`^\\d{${reglas.digitos}}$`).test(comprobante.numeroDocumento)) {
      errores.numeroDocumento = `El ${reglas.documento} debe tener ${reglas.digitos} dígitos.`
    }
    if (!comprobante.nombreRazonSocial.trim()) {
      errores.nombreRazonSocial = `Ingresa ${reglas.etiquetaNombre.toLowerCase()}.`
    }
    return errores
  }

  async function pagar() {
    setErrorPago('')
    const errores = validarComprobante()
    setErroresComprobante(errores)
    if (Object.keys(errores).length > 0) {
      setErrorPago('Revisa los datos del comprobante.')
      return
    }
    setPagando(true)
    try {
      const datosComprobante = comprobante.guardadoId
        ? { datosFacturacionId: comprobante.guardadoId }
        : {
            numeroDocumento: comprobante.numeroDocumento,
            nombreRazonSocial: comprobante.nombreRazonSocial.trim(),
            direccionFiscal: comprobante.tipo === 'FACTURA' ? comprobante.direccionFiscal.trim() || null : null,
            guardarDatosFacturacion: comprobante.guardar,
          }
      const pedido = await confirmarCompra(slug, {
        direccionId,
        metodoPagoId,
        codigoDescuento: codigoAplicado,
        tipoComprobante: comprobante.tipo,
        ...datosComprobante,
      })
      navegar(`${base}/pedido/${pedido.id}`, { replace: true, state: { recienComprado: true } })
      // El backend ya cerró el carrito: se vuelve a pedir, vendrá vacío.
      recargarCarrito().catch(() => {})
    } catch (e) {
      setErrorPago(e.message)
      setPagando(false)
    }
  }

  if (cargando) {
    return <p className="p-8 text-center text-slate-500">Preparando tu compra…</p>
  }
  if (!datos) {
    return (
      <div className="mx-auto max-w-md px-4 py-12">
        <Alerta>{error}</Alerta>
      </div>
    )
  }
  if (!hayProductos) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Tu carrito está vacío</h1>
        <Link to={base} className="mt-6 inline-block font-semibold underline">
          Ver productos
        </Link>
      </div>
    )
  }

  const metodo = metodos.find((m) => m.id === metodoPagoId)
  const listo = direccionId && metodoPagoId && resumen && !pagando

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link to={`${base}/carrito`} className="text-sm font-medium text-slate-600 hover:underline">
        ← Volver al carrito
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">Finalizar compra</h1>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-5">
          <Paso numero="1" titulo="Dirección de envío">
            <SeccionDireccion
              slug={slug}
              direcciones={direcciones}
              elegida={direccionId}
              onElegir={setDireccionId}
              onNueva={(nueva) => {
                setDatos(([c, dirs, mets, guards]) => [c, [...dirs, nueva], mets, guards])
                setDireccionId(nueva.id)
              }}
            />
          </Paso>

          <Paso numero="2" titulo="Método de pago">
            {metodos.length === 0 ? (
              <Alerta>Esta tienda todavía no tiene métodos de pago disponibles.</Alerta>
            ) : (
              <div className="space-y-2">
                {metodos.map((m) => (
                  <Opcion key={m.id} nombre="metodo" valor={m.id} elegido={m.id === metodoPagoId} onElegir={setMetodoPagoId}>
                    <span className="font-medium text-slate-900">{m.nombre}</span>
                    <span className="block text-slate-500">{TIPOS_METODO_PAGO[m.tipo] ?? m.tipo}</span>
                  </Opcion>
                ))}
                {metodo && (metodo.datosPago || metodo.instrucciones) && (
                  <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                    {metodo.datosPago && <p className="font-medium">{metodo.datosPago}</p>}
                    {metodo.instrucciones && <p className="mt-1 whitespace-pre-line">{metodo.instrucciones}</p>}
                  </div>
                )}
                <p className="text-xs text-slate-500">Pago simulado: la compra se registra como pagada sin cobrar nada.</p>
              </div>
            )}
          </Paso>

          <Paso numero="3" titulo="Comprobante">
            <SeccionComprobante
              comprobante={comprobante}
              setComprobante={setComprobante}
              guardados={guardados}
              errores={erroresComprobante}
            />
          </Paso>
        </div>

        <aside className="h-fit space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 lg:sticky lg:top-20">
          <h2 className="font-semibold text-slate-900">Tu pedido</h2>
          <ul className="space-y-2 text-sm">
            {carrito.elementos.map((e) => (
              <li key={e.id} className="flex justify-between gap-3">
                <span className="min-w-0 text-slate-700">
                  {e.cantidad} × {e.nombreProducto}
                  {e.nombreVariante && <span className="text-slate-500"> ({e.nombreVariante})</span>}
                </span>
                <span className="shrink-0 tabular-nums">{formatearSoles(e.subtotal)}</span>
              </li>
            ))}
          </ul>

          <div className="border-t border-slate-200 pt-4">
            {codigoAplicado ? (
              <p className="flex items-center justify-between text-sm">
                <span>
                  Código <strong>{codigoAplicado}</strong> aplicado
                </span>
                <button type="button" onClick={quitarCodigo} className="text-slate-600 underline">
                  Quitar
                </button>
              </p>
            ) : (
              <div className="flex items-start gap-2">
                <Campo
                  className="flex-1"
                  etiqueta="Código de descuento"
                  maxLength={50}
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  error={errorCodigo}
                />
                <button
                  type="button"
                  onClick={aplicarCodigo}
                  disabled={!codigo.trim()}
                  className="mt-6 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Aplicar
                </button>
              </div>
            )}
          </div>

          {resumen && (
            <dl className="space-y-1 border-t border-slate-200 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-600">Subtotal</dt>
                <dd className="tabular-nums">{formatearSoles(resumen.subtotal)}</dd>
              </div>
              {Number(resumen.montoDescuento) > 0 && (
                <div className="flex justify-between text-marca-700">
                  <dt>Descuento</dt>
                  <dd className="tabular-nums">−{formatearSoles(resumen.montoDescuento)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-semibold text-slate-900">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatearSoles(resumen.total)}</dd>
              </div>
              <p className="text-xs text-slate-500">
                Incluye IGV ({Number(resumen.porcentajeIgv)}%) de {formatearSoles(resumen.montoIgv)}.
              </p>
            </dl>
          )}

          <Alerta>{errorPago}</Alerta>
          <button
            type="button"
            onClick={pagar}
            disabled={!listo}
            className="w-full rounded-lg bg-(--tienda) px-4 py-3 font-semibold text-(--tienda-texto) hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pagando ? 'Procesando…' : resumen ? `Pagar ${formatearSoles(resumen.total)}` : 'Pagar'}
          </button>
          {(!direccionId || !metodoPagoId) && (
            <p className="text-center text-xs text-slate-500">Elige una dirección y un método de pago.</p>
          )}
        </aside>
      </div>
    </div>
  )
}
