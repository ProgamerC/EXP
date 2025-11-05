"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n.jsx";

/* =======================
   Переиспользуемая форма
   ======================= */
function FilterForm({
  t,
  lang,
  filters,
  initial,
  isPending,
  onApply,
  onReset,

  // передаём refs/стейт из родителя
  make,
  setMake,
  fuel,
  setFuel,
  transmission,
  setTransmission,
  body,
  setBody,
  yearMinRef,
  yearMaxRef,
  priceMinRef,
  priceMaxRef,
  mileageMaxRef,
}) {
  const makes = filters?.makes ?? [];
  const fuels = filters?.fuels ?? [];
  const transmissions = filters?.transmissions ?? [];
  const bodies = filters?.body_types ?? [];

  const yearsMinPlaceholder = filters?.years?.min ?? "";
  const yearsMaxPlaceholder = filters?.years?.max ?? "";
  const priceMinPlaceholder =
    filters?.price_eur?.min != null ? Math.round(filters.price_eur.min) : "";
  const priceMaxPlaceholder =
    filters?.price_eur?.max != null ? Math.round(filters.price_eur.max) : "";
  const mileageMaxPlaceholder =
    filters?.mileage_km?.max != null ? filters.mileage_km.max : "";

  /* ---------- нормализация + i18n ---------- */
  function normalizeFuelCode(raw) {
    const s = String(raw || "").toLowerCase();
    if (s.includes("diesel") || s.includes("диз")) return "diesel";
    if (
      s.includes("benz") ||
      s.includes("benzin") ||
      s.includes("petrol") ||
      s.includes("gasoline") ||
      s.includes("бенз")
    )
      return "petrol";
    if (s.includes("plug") && s.includes("hyb")) return "phev";
    if (s.includes("hyb") || s.includes("гибр") || s.includes("hibrid"))
      return "hybrid";
    if (s.includes("electr") || s.includes("элект")) return "electric";
    if (s.includes("lpg") || s.includes("gaz") || s.includes("газ")) return "lpg";
    if (s.includes("cng") || s.includes("metan") || s.includes("метан"))
      return "cng";
    return "other";
  }
  function fuelDisplay(opt) {
    const kind = normalizeFuelCode(opt.code || opt.label);
    const map = {
      diesel: { ru: "Дизель", ro: "Diesel" },
      petrol: { ru: "Бензин", ro: "Benzină" },
      phev: { ru: "Плагин-гибрид", ro: "Plug-in Hybrid " },
      hybrid: { ru: "Гибрид", ro: "Hybrid" },
      electric: { ru: "Электро", ro: "Electric" },
      lpg: { ru: "Газ (LPG)", ro: "GPL (gaz)" },
      cng: { ru: "Метан (CNG)", ro: "Metan (CNG)" },
      other: { ru: opt.label || opt.code || "", ro: opt.label || opt.code || "" },
    };
    return map[kind]?.[lang] ?? (opt.label || opt.code || "");
  }

  // ADDED: canonical labels (RU/RO) pentru afişare unitară
  const FUEL_LABELS = {
    petrol: { ru: "Бензин", ro: "Benzină" },
    diesel: { ru: "Дизель", ro: "Diesel" },
    hybrid_petrol: { ru: "Гибрид (бензин)", ro: "Hybrid (benzină)" },
    hybrid_diesel: { ru: "Гибрид (дизель)", ro: "Hybrid (Diesel)" },
    phev_petrol: { ru: "Плагин-гибрид (бензин)", ro: "Plug-in Hybrid (benzină)" },
    phev_diesel: { ru: "Плагин-гибрид (дизель)", ro: "Plug-in Hybrid (Diesel)" },
    electric: { ru: "Электро", ro: "Electric" },
    lpg: { ru: "Газ (LPG)", ro: "GPL (gaz)" },
    cng: { ru: "Метан (CNG)", ro: "Metan (CNG)" },
    hydrogen: { ru: "Водород", ro: "Hidrogen" },
  };

  // ADDED: ordine logică în <select>
  const FUEL_ORDER = [
    "petrol",
    "diesel",
    "hybrid_petrol",
    "hybrid_diesel",
    "phev_petrol",
    "phev_diesel",
    "electric",
    "lpg",
    "cng",
    "hydrogen",
  ];

  // ADDED: normalizează în chei canonice fine (distinge PHEV/HYBRID + diesel/benzină)
  function fuelCanonicalFromText(text) {
    const s = String(text || "").trim().toLowerCase();
    if (!s) return "";
    const hasDiesel = /(diesel|диз)/.test(s);
    const hasPetrol = /(benz|benzin|petrol|gasolin|бенз)/.test(s);
    const isPlug = /(plug|плаг)/.test(s) && /(hyb|гибр)/.test(s);
    const isHybrid = /(hyb|гибр)/.test(s);

    if (isPlug) return hasDiesel ? "phev_diesel" : "phev_petrol";
    if (isHybrid) return hasDiesel ? "hybrid_diesel" : "hybrid_petrol";
    if (/(electr|элект)/.test(s)) return "electric";
    if (/(lpg|пропан)/.test(s)) return "lpg";
    if (/(cng|метан)/.test(s)) return "cng";
    if (/(hydrogen|водород|h2)/.test(s)) return "hydrogen";
    if (hasDiesel) return "diesel";
    if (hasPetrol) return "petrol";
    return "";
  }

  // ADDED: extrage canonical din obiect de filtru (preferă coduri deja canonice)
  function fuelCanonicalFromOption(opt) {
    const rawCode = String(opt?.code || "").toLowerCase();
    if (
      [
        "petrol","diesel","hybrid_petrol","hybrid_diesel",
        "phev_petrol","phev_diesel","electric","lpg","cng","hydrogen",
      ].includes(rawCode)
    ) {
      return rawCode;
    }
    return fuelCanonicalFromText(opt?.code) || fuelCanonicalFromText(opt?.label);
  }

  // ADDED: construiește opțiuni deduplicate după canonical
  function buildFuelOptionsDedup(filterFuels) {
    const map = new Map();
    (filterFuels || []).forEach((f) => {
      const canon = fuelCanonicalFromOption(f);
      if (!canon) return;
      if (!map.has(canon)) {
        map.set(canon, {
          code: canon,
          label: FUEL_LABELS[canon]?.[lang] || f.label || f.code || canon,
        });
      }
    });

    const arr = Array.from(map.values());
    arr.sort(
      (a, b) => FUEL_ORDER.indexOf(a.code) - FUEL_ORDER.indexOf(b.code)
    );
    return arr;
  }

  function fuelDisplayLabel(opt) {
    return opt?.label || fuelDisplay(opt);
  }

  function normalizeTransmissionCode(raw) {
    const s = String(raw || "").toLowerCase();
    if (
      /(auto|automat|automatic|tiptronic|dsg|cvt|робот|вариатор|акпп|автомат)/i.test(
        s
      )
    )
      return "auto";
    if (/(manual|manuală|мех|механика|мкпп|mecanic|mecanică)/i.test(s))
      return "manual";
    return "other";
  }
  function transmissionDisplay(opt) {
    const kind = normalizeTransmissionCode(opt.code || opt.label);
    const map = {
      auto: { ru: "Автомат", ro: "Automată" },
      manual: { ru: "Механика", ro: "Manuală" },
      other: { ru: opt.label || opt.code || "", ro: opt.label || opt.code || "" },
    };
    return map[kind]?.[lang] ?? (opt.label || opt.code || "");
  }

  function normalizeBodyCode(raw) {
    const s = String(raw || "").toLowerCase();
    if (/(sedan|седан)/i.test(s)) return "sedan";
    if (/(hatch|hatchback|хэтч)/i.test(s)) return "hatchback";
    if (/(wagon|estate|break|комби|универсал|combi)/i.test(s)) return "wagon";
    if (/(suv|crossover|кросс|кроссовер|паркетник)/i.test(s)) return "suv";
    if (/(coupe|купе)/i.test(s)) return "coupe";
    if (/(cabrio|convertible|cabriolet|кабрио|кабриолет|decapotabil)/i.test(s))
      return "cabrio";
    if (/(minivan|mpv|минивэн|monovolum|van)/i.test(s)) return "minivan";
    if (/(pickup|pick-up|пикап)/i.test(s)) return "pickup";
    return "other";
  }
  function bodyDisplay(opt) {
    const kind = normalizeBodyCode(opt.code || opt.label);
    const map = {
      sedan: { ru: "Седан", ro: "Sedan" },
      hatchback: { ru: "Хэтчбек", ro: "Hatchback" },
      wagon: { ru: "Универсал", ro: "Break / Combi" },
      suv: { ru: "Кроссовер / SUV", ro: "Crossover / SUV" },
      coupe: { ru: "Купе", ro: "Coupé" },
      cabrio: { ru: "Кабриолет", ro: "Decapotabil" },
      minivan: { ru: "Минивэн", ro: "Minivan" },
      pickup: { ru: "Пикап", ro: "Pickup" },
      other: { ru: opt.label || opt.code || "", ro: opt.label || opt.code || "" },
    };
    return map[kind]?.[lang] ?? (opt.label || opt.code || "");
  }

  function SelectField({
    label,
    value,
    onChange,
    placeholder,
    options,
    valueKey = "code",
    labelKey = "label",
    isPlainString = false,
    transformLabel,
  }) {
    return (
      <div className="mb-5">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-white/70">
          {label}
        </div>
        <div className="relative">
          <select
            className="w-full appearance-none rounded-lg border border-white/30 bg-black/80 text-white px-3 py-2 text-[13px] outline-none ring-1 ring-white/10 focus:border-white/60 focus:ring-white/30"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="">{placeholder}</option>
            {options.map((opt) => {
              const val = isPlainString ? opt : opt[valueKey];
              const rawLabel = isPlainString ? opt : opt[labelKey];
              const shown = transformLabel
                ? transformLabel(isPlainString ? { code: opt, label: opt } : opt)
                : rawLabel;
              return (
                <option key={val} value={val} className="bg-black text-white">
                  {shown}
                </option>
              );
            })}
          </select>
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-white/70">
            ▼
          </div>
        </div>
      </div>
    );
  }

  function RangeField({
    label,
    fromRef,
    toRef,
    fromPlaceholder,
    toPlaceholder,
    type = "number",
  }) {
    return (
      <div className="mb-5">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-white/70">
          {label}
        </div>
        <div className="flex items-center gap-2">
          <input
            type={type}
            ref={fromRef}
            defaultValue={fromRef.current ?? ""}
            className="w-1/2 rounded-lg border border-white/30 bg-black/80 text-white px-3 py-2 text-[13px] outline-none ring-1 ring-white/10 focus:border-white/60 focus:ring-white/30"
            placeholder={fromPlaceholder}
          />
          <span className="text-xs text-white/40">—</span>
          <input
            type={type}
            ref={toRef}
            defaultValue={toRef.current ?? ""}
            className="w-1/2 rounded-lg border border-white/30 bg-black/80 text-white px-3 py-2 text-[13px] outline-none ring-1 ring-white/30"
            placeholder={toPlaceholder}
          />
        </div>
      </div>
    );
  }

  function SingleField({ label, inputRef, placeholder, type = "number" }) {
    return (
      <div className="mb-5">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-white/70">
          {label}
        </div>
        <input
          type={type}
          ref={inputRef}
          defaultValue={inputRef.current ?? ""}
          className="w-full rounded-lg border border-white/30 bg-black/80 text-white px-3 py-2 text-[13px] outline-none ring-1 ring-white/10 focus:border-white/60 focus:ring-white/30"
          placeholder={placeholder}
        />
      </div>
    );
  }

  // ADDED: opțiuni combustibil DEDUP după canonical (din filters.fuels)
  const fuelOptionsCanonical = buildFuelOptionsDedup(fuels);

  return (
    <>
      <div className="mb-4 text-sm font-bold tracking-tight text-white">
        {t("filters.title")}
      </div>

      <SelectField
        label={t("filters.make")}
        placeholder={t("filters.makeAny")}
        value={make}
        onChange={setMake}
        options={[...new Set(makes)]}
        isPlainString
      />

      {/* ADJUSTED: folosim opțiunile canonice deduplicate */}
      <SelectField
        label={t("filters.fuel")}
        placeholder={t("filters.fuelAny")}
        value={fuel}
        onChange={setFuel}
        options={fuelOptionsCanonical}
        valueKey="code"
        labelKey="label"
        transformLabel={fuelDisplayLabel}
      />

      <SelectField
        label={t("filters.transmission")}
        placeholder={t("filters.transmissionAny")}
        value={transmission}
        onChange={setTransmission}
        options={Object.values(
          (transmissions || []).reduce((acc, tItem) => {
            acc[tItem.code] = tItem;
            return acc;
          }, {})
        )}
        valueKey="code"
        labelKey="label"
        transformLabel={transmissionDisplay}
      />

      <SelectField
        label={t("filters.body")}
        placeholder={t("filters.bodyAny")}
        value={body}
        onChange={setBody}
        options={Object.values(
          (bodies || []).reduce((acc, b) => {
            acc[b.code] = b;
            return acc;
          }, {})
        )}
        valueKey="code"
        labelKey="label"
        transformLabel={normalizeBodyCode && bodyDisplay}
      />

      <RangeField
        label={t("filters.price")}
        fromRef={priceMinRef}
        toRef={priceMaxRef}
        fromPlaceholder={priceMinPlaceholder || t("filters.priceFrom")}
        toPlaceholder={priceMaxPlaceholder || t("filters.priceTo")}
        type="number"
      />

      <RangeField
        label={t("filters.year")}
        fromRef={yearMinRef}
        toRef={yearMaxRef}
        fromPlaceholder={yearsMinPlaceholder || t("filters.yearFrom")}
        toPlaceholder={yearsMaxPlaceholder || t("filters.yearTo")}
        type="number"
      />

      <SingleField
        label={t("filters.mileageTo")}
        inputRef={mileageMaxRef}
        placeholder={mileageMaxPlaceholder || t("filters.mileagePlaceholder")}
        type="number"
      />

      <div className="mt-6 flex flex-col gap-2">
        <button
          onClick={onApply}
          disabled={isPending}
          className="w-full rounded-xl bg-emerald-500/20 px-4 py-2 text-center text-sm font-semibold text-emerald-300 ring-1 ring-inset ring-emerald-400/40 hover:bg-emerald-500/30 disabled:opacity-50"
        >
          {t("filters.apply")}
        </button>
        <button
          onClick={onReset}
          disabled={isPending}
          className="w-full rounded-xl bg-white/5 px-4 py-2 text-center text-xs font-medium text-white/70 ring-1 ring-inset ring-white/20 hover:bg-white/10 disabled:opacity-50"
        >
          {t("filters.reset")}
        </button>
      </div>
    </>
  );
}

/* =======================
   Основной экспорт
   ======================= */
export default function FilterSidebar({ filters, initial }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { t, lang } = useI18n();

  // ADDED: inițial combustibil din canonical dacă există, altfel din code
  const initialFuel =
    initial.fuel_type_canonical ??
    initial.fuel_type_code ??
    initial.fuel ??
    "";

  // селекты
  const [make, setMake] = useState(initial.make ?? "");
  const [fuel, setFuel] = useState(initialFuel); // ADJUSTED
  const [transmission, setTransmission] = useState(initial.transmission_code ?? "");
  const [body, setBody] = useState(initial.body_type_code ?? "");

  // refs числовых полей
  const yearMinRef = useRef(initial.year_min ?? "");
  const yearMaxRef = useRef(initial.year_max ?? "");
  const priceMinRef = useRef(initial.price_min ?? "");
  const priceMaxRef = useRef(initial.price_max ?? "");
  const mileageMaxRef = useRef(initial.mileage_max ?? "");

  // мобильная панель
  const [open, setOpen] = useState(false);

  // ADDED: mapare canonical (select) -> parametru backend
  function mapCanonicalFuelToApiCode(canon) {
    switch (canon) {
      case "hybrid_petrol":
      case "hybrid_diesel":
        return "hybrid"; // backend are 'hybrid' unic
      case "phev_petrol":
        return "phev_petrol";
      case "phev_diesel":
        return "phev_diesel";
      case "petrol":
      case "diesel":
      case "electric":
      case "lpg":
      case "cng":
      case "hydrogen":
        return canon;
      default:
        return "";
    }
  }

  // блокируем скролл body при открытой панели
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);
  // 🔧 Sync UI cu valorile din URL (initial) la fiecare navigare
useEffect(() => {
  setMake(initial.make ?? "");

  // preferăm canonical dacă vine; apoi code; apoi fallback
  setFuel(
    initial.fuel_type_canonical ??
    initial.fuel_type_code ??
    initial.fuel ??
    ""
  );

  setTransmission(initial.transmission_code ?? "");
  setBody(initial.body_type_code ?? "");

  if (yearMinRef.current) yearMinRef.current.value = initial.year_min ?? "";
  if (yearMaxRef.current) yearMaxRef.current.value = initial.year_max ?? "";
  if (priceMinRef.current) priceMinRef.current.value = initial.price_min ?? "";
  if (priceMaxRef.current) priceMaxRef.current.value = initial.price_max ?? "";
  if (mileageMaxRef.current) mileageMaxRef.current.value = initial.mileage_max ?? "";
}, [initial]);

  function applyFilters() {
    const usp = new URLSearchParams();
    if (make) usp.set("make", make);

    // ADJUSTED: trimitem și code compat, și canonical
    if (fuel) {
      const apiCode = mapCanonicalFuelToApiCode(fuel);
      if (apiCode) usp.set("fuel_type_code", apiCode);
      usp.set("fuel_type_canonical", fuel);
    }

    if (transmission) usp.set("transmission_code", transmission);
    if (body) usp.set("body_type_code", body);

    const yearMinVal = yearMinRef.current?.value?.trim();
    const yearMaxVal = yearMaxRef.current?.value?.trim();
    const priceMinVal = priceMinRef.current?.value?.trim();
    const priceMaxVal = priceMaxRef.current?.value?.trim();
    const mileageMaxVal = mileageMaxRef.current?.value?.trim();

    if (yearMinVal) usp.set("year_min", yearMinVal);
    if (yearMaxVal) usp.set("year_max", yearMaxVal);
    if (priceMinVal) usp.set("price_min", priceMinVal);
    if (priceMaxVal) usp.set("price_max", priceMaxVal);
    if (mileageMaxVal) usp.set("mileage_max", mileageMaxVal);

    const qs = usp.toString();
    startTransition(() => {
      router.push(qs ? `/cars?${qs}` : "/cars");
    });
    setOpen(false); // на мобилке закрываем панель
  }

  function resetFilters() {
    setMake("");
    setFuel("");
    setTransmission("");
    setBody("");

    if (yearMinRef.current) yearMinRef.current.value = "";
    if (yearMaxRef.current) yearMaxRef.current.value = "";
    if (priceMinRef.current) priceMinRef.current.value = "";
    if (priceMaxRef.current) priceMaxRef.current.value = "";
    if (mileageMaxRef.current) mileageMaxRef.current.value = "";

    startTransition(() => {
      router.push("/cars");
    });
    setOpen(false);
  }

  /* ===== DESKTOP (md+) — как раньше, sticky блок) ===== */
  return (
    <>
      {/* Мобильная кнопка открытия */}
      <div className="mb-4 md:hidden">
        <button
          onClick={() => setOpen(true)}
          className="
        w-full inline-flex items-center justify-center gap-2
        rounded-full px-4 py-2 text-sm font-semibold
        bg-gradient-to-r from-emerald-500/30 to-teal-500/30
        text-white ring-1 ring-inset ring-emerald-400/40
        hover:from-emerald-500/40 hover:to-teal-500/40
        active:scale-[0.99] transition
        backdrop-blur-sm
        "
          aria-expanded={open}
          aria-controls="filters-drawer"
          aria-label={t('filters.open') ?? 'Filters'}
        >
          {/* Иконка воронки */}
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            xmlns="http://www.w3.org/2000/svg" aria-hidden="true"
          >
            <path d="M3 5h18M6 12h12M10 19h4"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span>{t('filters.open') ?? 'Filters'}</span>
        </button>
      </div>

      {/* Десктопный сайдбар */}
      <aside
        className="
          sticky top-4 hidden self-start md:block
          rounded-2xl border border-white/10 bg-white/5 p-4
          shadow-xl backdrop-blur
        "
      >
        <FilterForm
          t={t}
          lang={lang}
          filters={filters}
          initial={initial}
          isPending={isPending}
          onApply={applyFilters}
          onReset={resetFilters}
          make={make}
          setMake={setMake}
          fuel={fuel}
          setFuel={setFuel}
          transmission={transmission}
          setTransmission={setTransmission}
          body={body}
          setBody={setBody}
          yearMinRef={yearMinRef}
          yearMaxRef={yearMaxRef}
          priceMinRef={priceMinRef}
          priceMaxRef={priceMaxRef}
          mileageMaxRef={mileageMaxRef}
        />
      </aside>

      {/* Мобильная выезжающая панель */}
      {open && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          role="dialog"
          aria-modal="true"
          id="filters-drawer"
        >
          {/* Подложка */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Панель */}
          <div className="absolute right-0 top-0 h-full w-[86%] max-w-[420px] overflow-hidden rounded-l-2xl border-l border-white/10 bg-zinc-900 shadow-2xl">
            {/* Шапка */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-zinc-900/95 px-4 py-3">
              <div className="text-sm font-semibold text-white">
                {t("filters.title")}
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label={t("filters.close") ?? "Close"}
                className="rounded-lg bg-white/10 px-2 py-1 text-xs text-white hover:bg-white/15"
              >
                ✕
              </button>
            </div>

            {/* Контент — прокрутка */}
            <div className="h-[calc(100%-3rem)] overflow-y-auto px-4 pb-24 pt-4">
              <FilterForm
                t={t}
                lang={lang}
                filters={filters}
                initial={initial}
                isPending={isPending}
                onApply={applyFilters}
                onReset={resetFilters}
                make={make}
                setMake={setMake}
                fuel={fuel}
                setFuel={setFuel}
                transmission={transmission}
                setTransmission={setTransmission}
                body={body}
                setBody={setBody}
                yearMinRef={yearMinRef}
                yearMaxRef={yearMaxRef}
                priceMinRef={priceMinRef}
                priceMaxRef={priceMaxRef}
                mileageMaxRef={mileageMaxRef}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
