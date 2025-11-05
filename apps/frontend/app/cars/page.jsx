import FilterSidebar from "./FilterSidebar";
import PaginationBar from "@/components/PaginationBar";
import CarCard from "@/components/CarCard";

/* ================= helpers ================= */
function getApiBase() {
  const env = process.env.NEXT_PUBLIC_BACKEND_URL?.trim();
  if (env && /^https?:\/\//i.test(env)) return env.replace(/\/+$/, "");
  return "http://backend:8000";
}

function buildUrl(path) {
  const base = getApiBase();
  const clean = String(path || "").replace(/^[\/]+/, "");
  return `${base}/${clean}`;
}

/**
 * Собираем querystring из searchParams,
 * поддерживаем и одиночные значения и массивы.
 */
function buildQueryFromSearchParams(searchParams = {}) {
  const usp = new URLSearchParams();
  for (const [key, val] of Object.entries(searchParams)) {
    if (val === undefined || val === null) continue;
    if (Array.isArray(val)) {
      for (const v of val) {
        if (v !== undefined && v !== null && v !== "") {
          usp.append(key, v);
        }
      }
    } else {
      if (val !== "") {
        usp.append(key, val);
      }
    }
  }
  return usp.toString();
}

/* ====== API fetchers ====== */
async function fetchFilters() {
  const url = buildUrl("/api/filters/");
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Тянем машины с метой.
 * Возвращаем объект:
 * {
 *   cars: [...],
 *   meta: {
 *     page,
 *     page_size,
 *     total_pages,
 *     count,
 *   }
 * }
 */
async function fetchCarsWithMeta(searchParams = {}) {
  const qs = buildQueryFromSearchParams(searchParams);
  const url = buildUrl(`/api/cars/${qs ? `?${qs}` : ""}`);

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      return {
        cars: [],
        meta: {
          page: 1,
          page_size: 0,
          total_pages: 1,
          count: 0,
        },
      };
    }

    const data = await res.json();

    // 2 варианта ответа бэка:
    // а) просто массив без пагинации
    if (Array.isArray(data)) {
      return {
        cars: data,
        meta: {
          page: 1,
          page_size: data.length || 0,
          total_pages: 1,
          count: data.length || 0,
        },
      };
    }

    // б) объект с meta + results
    // {
    //   "page": 1,
    //   "page_size": 12,
    //   "total_pages": 5,
    //   "count": 60,
    //   "results": [ {...}, ... ]
    // }
    const cars = Array.isArray(data.results) ? data.results : [];

    const meta = {
      page: Number(data.page || 1) || 1,
      page_size: Number(data.page_size || cars.length || 0) || 0,
      total_pages: Number(data.total_pages || 1) || 1,
      count: Number(data.count || cars.length || 0) || 0,
    };

    return { cars, meta };
  } catch {
    return {
      cars: [],
      meta: {
        page: 1,
        page_size: 0,
        total_pages: 1,
        count: 0,
      },
    };
  }
}

/* ============== PAGE (server component) ============== */
export default async function CarsPage({ searchParams }) {
  // грузим фильтры и машины (с метой пагинации)
  const [filters, carsRes] = await Promise.all([
    fetchFilters(),
    fetchCarsWithMeta(searchParams),
  ]);

  const cars = carsRes.cars;
  const meta = carsRes.meta;

  // initial значения фильтра для формы (чтоб инпуты не прыгали)
  const initial = Object.fromEntries(
    Object.entries(searchParams || {}).map(([k, v]) => [k, String(v)])
  );

  return (
    <main className="w-full px-2 py-4 text-white lg:px-4">
      {/* сетка страницы:
         - фильтр слева фикс ширины
         - машины справа
         - gap-8 расстояние
         без max-w чтобы фильтр реально прижат к левому краю */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px,1fr]">
        {/* ЛЕВЫЙ СТОЛБЕЦ: фильтр */}
        <FilterSidebar filters={filters || {}} initial={initial} />

        {/* ПРАВЫЙ СТОЛБЕЦ: список авто + пагинация */}
        <section>
          {/* Заголовок секции */}
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-white">
                Автомобили
              </h1>
              <p className="text-sm leading-tight text-white/50">
                {meta.count
                  ? `${meta.count} предложений`
                  : cars.length
                  ? `${cars.length} предложений`
                  : "Нет предложений"}
              </p>
            </div>
          </div>

          {/* Сетка карточек:
             мобайл: 1 колонка
             md: 2 колонки
             lg+: 3 колонки */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {cars.length ? (
              cars.map((car) => <CarCard key={car.id} car={car} />)
            ) : (
              <div className="col-span-full rounded-xl border border-white/10 p-6 text-white/60">
                Нет автомобилей по этому фильтру
              </div>
            )}
          </div>

          {/* Пагинация */}
          <PaginationBar
            page={meta.page}
            totalPages={meta.total_pages}
            searchParams={searchParams}
          />

          {/* маленькая статистика под пагинацией */}
          <div className="mt-4 text-center text-[11px] font-medium text-white/30">
            Стр. {meta.page} из {meta.total_pages} • {meta.count} авто •{" "}
            {meta.page_size} на странице
          </div>
        </section>
      </div>
    </main>
  );
}
