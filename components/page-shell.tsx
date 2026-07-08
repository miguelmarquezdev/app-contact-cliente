import { Sidebar } from './sidebar'

type PageShellProps = {
  children: React.ReactNode
  full?: boolean
  hideMobileNav?: boolean
}

export function PageShell({ children, full = false, hideMobileNav = false }: PageShellProps) {
  return (
    <main className="flex min-h-screen flex-col bg-[#050315] text-white lg:flex-row">
      <Sidebar hideMobileNav={hideMobileNav} hideMobileHeader={full} />
      <section className={full ? 'min-h-0 flex-1 overflow-hidden p-0' : 'flex-1 px-4 pt-4 pb-24 lg:p-8'}>
        {full ? children : <div className="mx-auto max-w-7xl">{children}</div>}
      </section>
    </main>
  )
}
