// apps/frontend/components/Pagination.jsx
// Server Component (без "use client")

export default function Pagination({ page, totalPages, q = "", ordering = "" }) {
  if (!totalPages || totalPages <= 1) return null;

  const current = Math.min(Math.max(1, Number(page || 1)), totalPages);

  const windowSize = 7;
  const half = Math.floor(windowSize / 2);
  let start = Math.max(1, current - half);
  let end = Math.min(totalPages, start + windowSize - 1);
  if (end - start + 1 < windowSize) start = Math.max(1, end - windowSize + 1);

  const pages = [];
  for (let i = start; i <= end; i++) pages.push(i);

  const makeHref = (n) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (ordering) sp.set("ordering", ordering);
    sp.set("page", String(n));
    return `/?${sp.toString()}`;
  };

  return (
    <nav className="mt-6 flex items-center justify-center gap-1">
      <a
        href={makeHref(Math.max(1, current - 1))}
        aria-disabled={current === 1}
        className={`rounded-xl border px-3 py-2 text-sm ${
          current === 1 ? "pointer-events-none opacity-40" : ""
        }`}
      >
        «
      </a>

      {start > 1 && (
        <>
          <a href={makeHref(1)} className="rounded-xl border px-3 py-2 text-sm">
            1
          </a>
          {start > 2 && <span className="px-2 text-sm">…</span>}
        </>
      )}

      {pages.map((n) => (
        <a
          key={n}
          href={makeHref(n)}
          aria-current={n === current ? "page" : undefined}
          className={`rounded-xl border px-3 py-2 text-sm ${
            n === current ? "border-black font-semibold" : ""
          }`}
        >
          {n}
        </a>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-2 text-sm">…</span>}
          <a href={makeHref(totalPages)} className="rounded-xl border px-3 py-2 text-sm">
            {totalPages}
          </a>
        </>
      )}

      <a
        href={makeHref(Math.min(totalPages, current + 1))}
        aria-disabled={current === totalPages}
        className={`rounded-xl border px-3 py-2 text-sm ${
          current === totalPages ? "pointer-events-none opacity-40" : ""
        }`}
      >
        »
      </a>
    </nav>
  );
}
