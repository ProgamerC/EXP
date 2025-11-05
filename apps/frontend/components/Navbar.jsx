'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const pathname = usePathname()
  const isCatalog = pathname === '/' || pathname.startsWith('/?')

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-black/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-extrabold tracking-wide text-white hover:opacity-90">
          ExpertAuto
        </Link>

        <nav className="flex items-center gap-2">
          <Link
            href="/"
            className={`rounded-lg px-3 py-1.5 text-sm ${
              isCatalog
                ? 'bg-white text-black'
                : 'text-white hover:bg-white/10'
            }`}
          >
            Каталог
          </Link>

          {/* Если нужна админка — раскомментируй/обнови ссылку  */}
          {/* <Link href="/admin" className="rounded-lg px-3 py-1.5 text-sm text-white hover:bg-white/10">Админка</Link> */}
        </nav>
      </div>
    </header>
  )
}
