/** Contenedor común del login y el registro. */
export default function TarjetaAuth({ titulo, subtitulo, pie, children }) {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-12 md:py-20">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs md:p-8">
        <h1 className="text-2xl font-semibold text-slate-900">{titulo}</h1>
        {subtitulo && <p className="mt-1 text-sm text-slate-500">{subtitulo}</p>}
        <div className="mt-6">{children}</div>
      </div>
      {pie && <p className="mt-6 text-center text-sm text-slate-600">{pie}</p>}
    </div>
  )
}
