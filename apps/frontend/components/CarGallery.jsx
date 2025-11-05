'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'

/** Парсим размер типа 900x900 из URL 999.md (если есть) */
function extractSize(src) {
  if (!src) return null
  const m = String(src).match(/\/BoardImages\/(\d+x\d+)\//i)
  return m ? m[1] : null
}

/** Возвращаем «базовый» ключ URL без сегмента размера — для дедупликации */
function baseKey(src) {
  if (!src) return ''
  return String(src).replace(/\/BoardImages\/\d+x\d+\//i, '/BoardImages/')
}

/** При необходимости апгрейдим миниатюру до большого варианта (здесь — 900x900) */
function upgradeCdnSize(src) {
  if (!src) return ''
  // если уже большой — вернём как есть
  if (/\/BoardImages\/(900x900|1024x1024|1200x1200|1600x1600|2000x2000)\//i.test(src)) return src
  // если есть размер — заменим на 900x900
  if (/\/BoardImages\/\d+x\d+\//i.test(src)) {
    return src.replace(/\/BoardImages\/\d+x\d+\//i, '/BoardImages/900x900/')
  }
  return src
}

/** Сравнение размеров по приоритету (чем больше — тем лучше) */
const SIZE_PRIORITY = [
  '2000x2000', '1600x1600', '1400x1400', '1200x1200', '1024x1024', '900x900',
  '800x800', '700x700', '600x600', '500x500', '400x400', '300x300', '200x200', '120x120'
]
function sizeRank(size) {
  const i = SIZE_PRIORITY.indexOf(size || '')
  return i >= 0 ? i : SIZE_PRIORITY.length + 1
}

/** Нормализуем массив фото */
function normalizePhotos(raw = [], cover = '') {
  const items = []
  if (Array.isArray(raw)) {
    for (let i = 0; i < raw.length; i++) {
      const p = raw[i] || {}
      const src0 = p.image || p.image_url || p.image_file || ''
      if (!src0) continue
      const src = upgradeCdnSize(src0)
      items.push({
        src,
        key: baseKey(src),
        size: extractSize(src),
        is_primary: !!p.is_primary,
        sort: Number.isFinite(p.sort_order) ? p.sort_order : i
      })
    }
  }

  // Если нет массива, но есть cover — добавим
  if (!items.length && cover) {
    const src = upgradeCdnSize(cover)
    items.push({ src, key: baseKey(src), size: extractSize(src), is_primary: true, sort: 0 })
  }

  if (!items.length) return []

  // Группируем по baseKey и выбираем лучший размер
  const byKey = new Map()
  for (const it of items) {
    const prev = byKey.get(it.key)
    if (!prev) {
      byKey.set(it.key, it)
      continue
    }
    const rNew = sizeRank(it.size)
    const rOld = sizeRank(prev.size)
    if (rNew < rOld) {
      byKey.set(it.key, it)
    } else if (rNew === rOld) {
      const scoreNew = (it.is_primary ? 0 : 1) + (isFinite(it.sort) ? it.sort / 1e6 : 1)
      const scoreOld = (prev.is_primary ? 0 : 1) + (isFinite(prev.sort) ? prev.sort / 1e6 : 1)
      if (scoreNew < scoreOld) byKey.set(it.key, it)
    }
  }

  // Итоговый массив, сортировка: primary -> sort
  const unique = Array.from(byKey.values())
  unique.sort((a, b) => (b.is_primary - a.is_primary) || (a.sort - b.sort))
  return unique
}

export default function CarGallery({ photos = [], cover, title = '' }) {
  const list = useMemo(() => normalizePhotos(photos, cover), [photos, cover])

  const [open, setOpen] = useState(false)
  const [idx, setIdx] = useState(0)

  const openAt = useCallback((i) => {
    setIdx(i)
    setOpen(true)
  }, [])
  const close = useCallback(() => setOpen(false), [])
  const prev = useCallback(
    () => setIdx(i => (i - 1 + list.length) % list.length),
    [list.length]
  )
  const next = useCallback(
    () => setIdx(i => (i + 1) % list.length),
    [list.length]
  )

  // <<< НОВОЕ: управляем body-классом, чтобы спрятать bottom/footer сайта >>>
  useEffect(() => {
    if (open) {
      document.body.classList.add('gallery-fullscreen-open')
    } else {
      document.body.classList.remove('gallery-fullscreen-open')
    }

    // safety: если компонент размонтируется пока открыто — уберём класс
    return () => {
      document.body.classList.remove('gallery-fullscreen-open')
    }
  }, [open])
  // ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close, prev, next])

  if (!list.length) {
    return <div className="aspect-video rounded-2xl bg-gray-100 border" />
  }

  return (
    <div>
      {/* Основное изображение на карточке */}
      <button
        type="button"
        onClick={() => openAt(0)}
        className="group relative block w-full overflow-hidden rounded-2xl border"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={list[0].src}
          alt={title || 'photo'}
          className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent" />
        <span className="pointer-events-none absolute right-3 top-3 rounded-xl bg-black/50 px-2 py-1 text-xs font-semibold text-white">
          {list.length} photo{list.length > 1 ? 's' : ''}
        </span>
      </button>

      {/* Превьюшки под основным фото на странице */}
      {list.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {list.slice(0, 10).map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => openAt(i)}
              className="aspect-video overflow-hidden rounded-xl border"
              title={title}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Фуллскрин модалка */}
      {open && (
        <div
          className="fixed inset-0 z-[999999] bg-black/90 flex items-center justify-center"
          onClick={close} // клик по тёмному фону = закрыть
        >
          {/* Кнопка закрыть (фиксирована в правом верхнем углу экрана) */}
          <button
            type="button"
            aria-label="Close"
            onClick={(e) => {
              e.stopPropagation()
              close()
            }}
            className="absolute right-4 top-4 rounded-lg border border-white/20 px-3 py-1 text-white hover:bg-white/10"
          >
            ✕
          </button>

          {/* Кнопка Prev слева по центру экрана */}
          <button
            type="button"
            aria-label="Prev"
            onClick={(e) => {
              e.stopPropagation()
              prev()
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-lg border border-white/20 px-3 py-2 text-2xl text-white hover:bg-white/10"
          >
            ‹
          </button>

          {/* Кнопка Next справа по центру экрана */}
          <button
            type="button"
            aria-label="Next"
            onClick={(e) => {
              e.stopPropagation()
              next()
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-lg border border-white/20 px-3 py-2 text-2xl text-white hover:bg-white/10"
          >
            ›
          </button>

          {/* Контейнер для большого фото */}
          <div
            className="pointer-events-auto flex flex-col items-center max-w-[92vw]"
            onClick={(e) => e.stopPropagation()} // чтобы клик по фото не закрывал
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={list[idx].src}
              alt={title || 'photo'}
              className="max-h-[80vh] max-w-[92vw] object-contain"
            />
          </div>

          {/* Галерея миниатюр внизу экрана, как на 999 */}
          {list.length > 1 && (
            <div
              className="absolute bottom-4 left-1/2 -translate-x-1/2 max-w-[92vw] overflow-x-auto rounded-xl bg-black/40 backdrop-blur-sm p-2 flex gap-2"
              onClick={(e) => e.stopPropagation()} // не закрывать модалку при клике по миниатюрам
            >
              {list.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIdx(i)}
                  className={`h-16 w-24 flex-shrink-0 overflow-hidden rounded-md border ${
                    i === idx
                      ? 'ring-2 ring-white'
                      : 'opacity-80 hover:opacity-100'
                  }`}
                  title={title}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.src}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
