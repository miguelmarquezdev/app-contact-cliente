import { Sidebar } from './sidebar'

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen bg-[#030712] text-white">
      <Sidebar />
      <section className="flex-1 p-4 pb-28 lg:p-8">
        <div className="mx-auto max-w-7xl">{children}</div>
      </section>
    </main>
  )
}
