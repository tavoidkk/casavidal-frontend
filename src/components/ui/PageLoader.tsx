export default function PageLoader() {
  return (
    <div className="grid place-items-center h-full min-h-[220px]">
      <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/90 text-sm font-medium text-gray-700 shadow-lg border border-gray-200">
        <span className="h-2.5 w-2.5 rounded-full bg-sky-500 animate-pulse" aria-hidden />
        Cargando módulo
      </div>
    </div>
  );
}
