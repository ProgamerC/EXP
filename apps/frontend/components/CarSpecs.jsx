"use client";

import { useI18n } from "@/lib/i18n.jsx";
import { fuelLabel, trLabel, bodyLabel } from "@/components/carLabels.js";

/* ==== ВСПОМОГАТЕЛЬНОЕ ЧТЕНИЕ БЕЗ OPTIONAL CHAINING ==== */
function get(obj, key) {
  return obj && typeof obj[key] !== "undefined" && obj[key] !== null ? obj[key] : "";
}

/* ===== формат чисел / цены — ИДЕНТИЧНО CarCard ===== */
function fmtNumber(n, lang) {
  if (n === null || typeof n === "undefined" || n === "") return "";
  const num = Number(String(n).replace(/[^\d.-]/g, ""));
  if (isNaN(num)) return String(n);
  return num.toLocaleString(lang === "ro" ? "ro-RO" : "ru-RU", { maximumFractionDigits: 0 });
}
function fmtPrice(value, currency, lang) {
  if (value === null || typeof value === "undefined" || value === "") return "";
  const cur = String(currency || "EUR").toUpperCase();
  const formatted = fmtNumber(value, lang);
  return formatted ? formatted + " " + cur : "";
}

/* ===== Afișaj combustibil — ИДЕНТИЧНО CarCard ===== */
const FUEL_LABELS = {
  ro: {
    petrol: "Benzină",
    diesel: "Diesel",
    hybrid_petrol: "Hybrid (Benzină)",
    hybrid_diesel: "Hybrid (Diesel)",
    phev_petrol: "Plug-in Hybrid (Benzină)",
    phev_diesel: "Plug-in Hybrid (Diesel)",
    electric: "Electric",
    lpg: "GPL",
    cng: "CNG",
    hydrogen: "Hidrogen",
  },
  ru: {
    petrol: "Бензин",
    diesel: "Дизель",
    hybrid_petrol: "Гибрид (бензин)",
    hybrid_diesel: "Гибрид (дизель)",
    phev_petrol: "Плагин-гибрид (бензин)",
    phev_diesel: "Плагин-гибрид (дизель)",
    electric: "Электро",
    lpg: "Газ (LPG)",
    cng: "Метан (CNG)",
    hydrogen: "Водород",
  },
};

function textToCanonical(s) {
  const t = String(get({ s }, "s") || s).trim().toLowerCase();
  if (!t) return "";
  const hasDiesel = /(diesel|диз)/.test(t);
  const hasPetrol = /(benz|benzin|petrol|gasolin|бенз)/.test(t);
  const hasHybrid = /(hyb|гибр|hibrid)/.test(t);
  const hasPlug = /(plug|плаг)/.test(t);
  const isElectric = /(electr|элект)/.test(t);
  const isLpg = /(lpg|пропан|gpl)/.test(t);
  const isCng = /(cng|метан|metan)/.test(t);
  const isH2 = /(hydrogen|водород|h2)/.test(t);

  if (isElectric) return "electric";
  if (hasPlug && hasHybrid) return hasDiesel ? "phev_diesel" : "phev_petrol";
  if (hasHybrid) return hasDiesel ? "hybrid_diesel" : "hybrid_petrol";
  if (isLpg) return "lpg";
  if (isCng) return "cng";
  if (isH2) return "hydrogen";
  if (hasDiesel) return "diesel";
  if (hasPetrol) return "petrol";
  return "";
}
function codeRank(code) {
  if (code === "electric") return 0;
  if (code === "phev_petrol" || code === "phev_diesel") return 1;
  if (code === "hybrid_petrol" || code === "hybrid_diesel" || code === "hybrid") return 2;
  if (code === "lpg" || code === "cng" || code === "hydrogen") return 3;
  if (code === "diesel" || code === "petrol") return 4;
  return 9;
}
function pickMostSpecific(candidates, fallback) {
  let best = fallback || "";
  let bestRank = best ? codeRank(best) : 99;
  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    if (!c) continue;
    const r = codeRank(c);
    if (r < bestRank) {
      best = c;
      bestRank = r;
    }
  }
  return best;
}
function inferCanonicalFromCar(car) {
  const explicitCanon = get(car, "fuel_type_canonical") || "";
  const code = String(get(car, "fuel_type_code") || "").toLowerCase();

  const textCandidates = [
    textToCanonical(get(car, "fuel")),
    textToCanonical(get(car, "fuel_type_label")),
    textToCanonical(get(car, "fuel_type_raw")),
    textToCanonical(get(car, "title")),
    textToCanonical(get(car, "description")),
  ];

  let codeCanon = code;
  if (codeCanon === "hybrid") {
    const spec = pickMostSpecific(textCandidates, "");
    codeCanon = spec.indexOf("phev_") === 0 || spec.indexOf("hybrid_") === 0 ? spec : "hybrid_petrol";
  }

  const candidates = [explicitCanon, codeCanon].concat(textCandidates);
  return pickMostSpecific(candidates, explicitCanon || codeCanon || "");
}
function labelFromCanonical(canon, lang) {
  const L = lang === "ro" ? FUEL_LABELS.ro : FUEL_LABELS.ru;
  return (L && L[canon]) || "";
}
function fuelTextFromCarStrict(car, lang) {
  const canon = inferCanonicalFromCar(car);
  if (canon) {
    const mapped = labelFromCanonical(canon, lang);
    if (mapped) return mapped;
  }
  const rawFuel = get(car, "fuel");
  if (rawFuel) return fuelLabel(rawFuel, lang);
  return get(car, "fuel_type_label") || "";
}
function isElectricFromCarStrict(car) {
  const canon = inferCanonicalFromCar(car);
  if (canon === "electric") return true;
  const s = String(get(car, "fuel") || get(car, "fuel_type_label")).trim().toLowerCase();
  return (
    s === "electric" ||
    s === "электро" ||
    s.indexOf("electr") !== -1 ||
    s.indexOf("элект") !== -1 ||
    s === "ev" ||
    / ev$/.test(s)
  );
}

/* ===== маленький атомарный UI-компонент поля ===== */
function Field({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-white/5 px-3 py-2.5 ring-1 ring-inset ring-white/10">
      <div className="flex items-center gap-2 text-sm text-white/70">
        <span className="text-base">{icon}</span>
        <span>{label}</span>
      </div>
      <div className="text-sm font-semibold tracking-wide text-white">
        {value || "—"}
      </div>
    </div>
  );
}

/* ===== основной компонент ===== */
export default function CarSpecs({ car, fuelCanonical, isEv }) {
  const { t, lang } = useI18n();

  const make = get(car, "make") || get(car, "brand") || get(car, "mark") || "";
  const model = get(car, "model") || get(car, "series") || get(car, "generation") || "";
  const title = (make + " " + model).trim() || "Automobile";

  const priceText = fmtPrice(
    get(car, "price_eur") !== "" ? get(car, "price_eur") : get(car, "price"),
    get(car, "currency"),
    lang
  );

  const yearVal = get(car, "year");
  const yearText = yearVal ? (lang === "ro" ? String(yearVal) : String(yearVal) + " г.") : "";

  const mileageVal = get(car, "mileage_km");
  const mileageText = mileageVal
    ? (lang === "ro" ? (fmtNumber(mileageVal, lang) + " km") : (fmtNumber(mileageVal, lang) + " км"))
    : "";

  const engineVal = get(car, "engine_cc");
  const engineText = engineVal
    ? (lang === "ro" ? (fmtNumber(engineVal, lang) + " cm³") : (fmtNumber(engineVal, lang) + " см³"))
    : "";

  // ===== Топливо: ИКОНКА ВСЕГДА ⛽, ЗНАЧЕНИЕ — ⚡ ДЛЯ EV =====
  // canon/isEv из пропсов если есть, иначе считаем локально
  const canon = typeof fuelCanonical === "string" && fuelCanonical ? fuelCanonical : inferCanonicalFromCar(car);
  const ev = typeof isEv === "boolean" ? isEv : isElectricFromCarStrict(car);

  const fuelIcon = "⛽"; // <- всегда насос
  const fuelValue = ev ? "⚡" : (labelFromCanonical(canon, lang) || fuelTextFromCarStrict(car, lang) || get(car, "fuel") || "—");

  const transmissionTranslated = trLabel(get(car, "transmission"), lang);
  const bodyTranslated = bodyLabel(get(car, "body_type"), lang);

  return (
    <aside className="lg:col-span-1">
      <div className="sticky top-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
        {/* Заголовок */}
        <div className="text-[30px] font-extrabold leading-tight tracking-tight text-white lg:text-[34px]">
          <span className="block">{title}</span>
        </div>

        {/* Цена */}
        <div className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-5 py-3 text-center text-2xl font-bold text-emerald-300 shadow">
          {priceText || "—"}
        </div>

        {/* Спецификация */}
        <div className="mt-5 grid grid-cols-1 gap-2.5">
          <Field icon="📅" label={t("car.year")} value={yearText} />
          <Field icon="🧭" label={t("car.mileage")} value={mileageText} />
          <Field icon="🔧" label={t("car.engine")} value={engineText} />
          {/* ⛽ Вид топлива ⚡ / текст */}
          <Field icon={fuelIcon} label={t("car.fuel")} value={fuelValue} />
          <Field
            icon="⚙️"
            label={t("car.transmission")}
            value={transmissionTranslated || get(car, "transmission") || "—"}
          />
          <Field
            icon="🚘"
            label={t("car.body")}
            value={bodyTranslated || get(car, "body_type") || "—"}
          />
        </div>
      </div>
    </aside>
  );
}
