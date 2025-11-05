'use client'
import { useRouter } from 'next/navigation'

export default function BackButton({ fallback = '/', className = '' }) {
  const router = useRouter()

  function goBack() {
    // если пришли изнутри сайта — вернёмся по истории; иначе — на fallback
    if (typeof window !== 'undefined') {
      try {
        const ref = document.referrer
        if (ref && new URL(ref).origin === window.location.origin) {
          router.back()
          return
        }
      } catch {}
    }
    router.push(fallback)
  }

  return (
    <button
      type="button"
      onClick={goBack}
      className={
        className ||
        'rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10'
      }
      aria-label="Назад"
    >
      ← Назад
    </button>
  )
}
