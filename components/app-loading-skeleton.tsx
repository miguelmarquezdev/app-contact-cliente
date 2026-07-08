import { PageShell } from '@/components/page-shell'

function SkeletonLine({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-full bg-white/10 ${className}`} />
}

function SkeletonCard({ rows = 3 }: { rows?: number }) {
  return (
    <div className="rounded-[1.75rem] border border-violet-400/10 bg-[#0b1020]/90 p-4 shadow-2xl shadow-black/20 lg:p-5">
      <div className="space-y-3">
        <SkeletonLine className="h-3 w-24 bg-emerald-400/15" />
        <SkeletonLine className="h-7 w-2/3" />
        {Array.from({ length: rows }).map((_, index) => (
          <SkeletonLine key={index} className={`h-3 ${index % 2 ? 'w-4/5' : 'w-full'}`} />
        ))}
      </div>
    </div>
  )
}

export function AppLoadingSkeleton({ variant = 'default' }: { variant?: 'default' | 'client' | 'collaborator' }) {
  const titleWidth = variant === 'client' ? 'w-44' : variant === 'collaborator' ? 'w-52' : 'w-56'

  return (
    <PageShell>
      <div className="space-y-5">
        <section className="rounded-[1.75rem] border border-violet-400/10 bg-gradient-to-br from-violet-500/10 via-[#0b1020] to-emerald-500/10 p-5 shadow-2xl shadow-black/20 lg:rounded-[2rem] lg:p-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 animate-pulse rounded-2xl bg-violet-400/15" />
            <div className="flex-1 space-y-3">
              <SkeletonLine className="h-3 w-28 bg-emerald-400/20" />
              <SkeletonLine className={`h-8 ${titleWidth}`} />
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <SkeletonLine className="h-12 w-full rounded-2xl" />
            <SkeletonLine className="h-12 w-full rounded-2xl" />
            <SkeletonLine className="h-12 w-full rounded-2xl" />
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>

        <section className="rounded-[1.75rem] border border-violet-400/10 bg-[#0b1020]/90 p-4 shadow-2xl shadow-black/20 lg:p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="space-y-2">
              <SkeletonLine className="h-5 w-40" />
              <SkeletonLine className="h-3 w-56" />
            </div>
            <SkeletonLine className="h-10 w-10 rounded-full bg-emerald-400/15" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3 rounded-2xl bg-white/[.03] p-3">
                <div className="h-11 w-11 animate-pulse rounded-full bg-violet-400/15" />
                <div className="min-w-0 flex-1 space-y-2">
                  <SkeletonLine className="h-4 w-1/2" />
                  <SkeletonLine className="h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  )
}
