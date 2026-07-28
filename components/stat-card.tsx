export function StatCard({ title, value, helper }: { title: string; value: string; helper: string }) {
  return (
    <div className="card p-4 transition hover:-translate-y-1 hover:border-[#14264F]/10 sm:p-6">
      <p className="text-xs font-bold text-slate-500 sm:text-sm">{title}</p>
      <h3 className="mt-2 min-w-0 break-all text-xl sm:break-words font-black leading-tight text-[#14264F] sm:text-2xl lg:text-3xl">{value}</h3>
      <p className="mt-1 text-xs text-slate-500 sm:mt-2 sm:text-sm">{helper}</p>
    </div>
  )
}
