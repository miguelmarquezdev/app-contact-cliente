type SunbeamLogoProps = {
  compact?: boolean
  className?: string
}

export function SunbeamLogo({ compact = false, className = '' }: SunbeamLogoProps) {
  if (compact) {
    return (
      <div className={`flex items-center ${className}`}>
        <img
          src="/brand/sunbeam-mark.png"
          alt="Sunbeam App"
          className="h-10 w-10 rounded-xl border border-slate-200 bg-white object-cover shadow-sm"
        />
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src="/brand/sunbeam-mark.png"
        alt="Sunbeam App"
        className="h-12 w-12 shrink-0 rounded-xl border border-slate-200 bg-white object-cover shadow-sm"
      />
      <div className="min-w-0 leading-tight">
        <p className="text-[10px] font-black uppercase tracking-[.20em] text-[#1E40AF]">Tour CRM</p>
        <h1 className="truncate text-xl font-black tracking-tight text-[#14264F]">Sunbeam App</h1>
        <p className="truncate text-[11px] font-semibold text-slate-500">Tailored South American Experiences</p>
      </div>
    </div>
  )
}
