import { Sidebar } from './sidebar'

type PageShellProps = {
  children: React.ReactNode
  full?: boolean
  hideMobileNav?: boolean
}

export function PageShell({ children, full = false, hideMobileNav = false }: PageShellProps) {
  return (
    <main className="flex min-h-screen bg-[#050315] text-white">
      <Sidebar hideMobileNav={hideMobileNav} />
      <section className={full ? 'flex-1 overflow-hidden p-0' : 'flex-1 p-4 pb-28 lg:p-8'}>
        {full ? children : <div className="mx-auto max-w-7xl">{children}</div>}
      </section>
    </main>
  )
}
