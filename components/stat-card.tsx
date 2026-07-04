export function StatCard({ title, value, helper }: { title: string; value: string; helper: string }) {
  return (
    <div className="card p-6 transition hover:-translate-y-1 hover:border-emerald-500/40">
      <p className="text-sm font-bold text-slate-400">{title}</p>
      <h3 className="mt-2 break-words text-3xl font-black text-white">{value}</h3>
      <p className="mt-2 text-sm text-slate-500">{helper}</p>
    </div>
  )
}
