"use client"

import Link from "next/link"

/**
 * Универсальная генерация href:
 *  - берём все текущие query params (searchParams)
 *  - заменяем только page
 */
function buildPageHref(searchParams, targetPage) {
  const sp = new URLSearchParams()

  // перенести ВСЕ текущие параметры, кроме page
  Object.entries(searchParams || {}).forEach(([key, val]) => {
    if (val === undefined || val === null) return
    if (key === "page") return
    // массивы и строки обрабатываем одинаково: превращаем в [] если нужно
    if (Array.isArray(val)) {
      val.forEach(v => {
        if (v !== undefined && v !== null && v !== "") {
          sp.append(key, String(v))
        }
      })
    } else if (val !== "") {
      sp.set(key, String(val))
    }
  })

  // устанавливаем новую страницу
  sp.set("page", String(targetPage))

  const qs = sp.toString()
  return qs ? `?${qs}` : `?page=${targetPage}`
}

/**
 * Возвращает массив номеров страниц для показа.
 * Показываем "окно" около текущей, максимум 5 кнопок.
 */
function getWindowPages(current, total) {
  const windowSize = 5
  const half = Math.floor(windowSize / 2)

  let start = current - half
  let end = current + half

  if (start < 1) {
    end += (1 - start)
    start = 1
  }
  if (end > total) {
    start -= (end - total)
    end = total
  }
  if (start < 1) start = 1

  const pages = []
  for (let p = start; p <= end; p++) {
    pages.push(p)
  }
  return pages
}

export default function PaginationBar({
  page,
  totalPages,
  searchParams,
}) {
  const current = Number(page) || 1
  const total = Number(totalPages) || 1

  if (total <= 1) {
    // одна страница — пагинация не нужна
    return null
  }

  const pagesToShow = getWindowPages(current, total)
  const prevPage = current > 1 ? current - 1 : null
  const nextPage = current < total ? current + 1 : null

  return (
    <nav className="mt-10 flex flex-col items-center gap-4 text-white/80">
      {/* Кнопки Prev / Next */}
      <div className="flex items-center gap-2">
        {/* Prev */}
        {prevPage ? (
          <Link
            href={buildPageHref(searchParams, prevPage)}
            className="
              rounded-lg bg-white/10 px-3 py-1.5 text-[13px] font-semibold text-white
              ring-1 ring-white/20 hover:bg-white/20 hover:text-white
            "
          >
            ← Назад
          </Link>
        ) : (
          <span
            className="
              cursor-not-allowed rounded-lg bg-white/5 px-3 py-1.5 text-[13px] font-semibold text-white/30
              ring-1 ring-white/10
            "
          >
            ← Назад
          </span>
        )}

        {/* Next */}
        {nextPage ? (
          <Link
            href={buildPageHref(searchParams, nextPage)}
            className="
              rounded-lg bg-white/10 px-3 py-1.5 text-[13px] font-semibold text-white
              ring-1 ring-white/20 hover:bg-white/20 hover:text-white
            "
          >
            Вперёд →
          </Link>
        ) : (
          <span
            className="
              cursor-not-allowed rounded-lg bg-white/5 px-3 py-1.5 text-[13px] font-semibold text-white/30
              ring-1 ring-white/10
            "
          >
            Вперёд →
          </span>
        )}
      </div>

      {/* Номера страниц */}
      <ul className="flex flex-wrap items-center justify-center gap-2 text-[13px] font-semibold">
        {/* Если текущее окно не начинается с 1 — показать "1 ..." */}
        {pagesToShow[0] > 1 && (
          <>
            <li>
              <Link
                href={buildPageHref(searchParams, 1)}
                className="
                  rounded-md bg-white/10 px-2.5 py-1.5 ring-1 ring-white/20
                  text-white/80 hover:bg-white/20 hover:text-white
                "
              >
                1
              </Link>
            </li>
            {pagesToShow[0] > 2 && (
              <li className="px-1 text-white/40">…</li>
            )}
          </>
        )}

        {pagesToShow.map((p) => {
          const active = p === current
          return (
            <li key={p}>
              {active ? (
                <span
                  className="
                    rounded-md bg-emerald-500/20 px-2.5 py-1.5
                    ring-1 ring-emerald-400/40 text-emerald-300
                  "
                >
                  {p}
                </span>
              ) : (
                <Link
                  href={buildPageHref(searchParams, p)}
                  className="
                    rounded-md bg-white/10 px-2.5 py-1.5 ring-1 ring-white/20
                    text-white/80 hover:bg-white/20 hover:text-white
                  "
                >
                  {p}
                </Link>
              )}
            </li>
          )
        })}

        {/* Если окно не заканчивается total — показать "... total" */}
        {pagesToShow[pagesToShow.length - 1] < total && (
          <>
            {pagesToShow[pagesToShow.length - 1] < total - 1 && (
              <li className="px-1 text-white/40">…</li>
            )}
            <li>
              <Link
                href={buildPageHref(searchParams, total)}
                className="
                  rounded-md bg-white/10 px-2.5 py-1.5 ring-1 ring-white/20
                  text-white/80 hover:bg-white/20 hover:text-white
                "
              >
                {total}
              </Link>
            </li>
          </>
        )}
      </ul>

      {/* маленькая подсказка */}
      <div className="text-center text-[11px] font-medium text-white/30">
        Страница {current} из {total}
      </div>
    </nav>
  )
}
