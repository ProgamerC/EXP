"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n.jsx";
import { fuelLabel, trLabel, bodyLabel } from "@/components/carLabels.js";
import { fuelMeta } from "@/lib/carUtils.js"; // ✅ nou: sursa unică (canon/isEv/label)

/* ===== helpers фото ===== */
function pickPhoto(car) {
  if (car?.main_photo) return String(car.main_photo);
  if (car?.main_photo_url) return String(car.main_photo_url);
  if (car?.image) return String(car.image);
  if (car?.cover_image) return String(car.cover_image);
  if (car?.image_url) return String(car.image_url);
  if (car?.image_file) return String(car.image_file);

  if (Array.isArray(car?.photos) && car.photos.length) {
    const primary = car.photos.find(
      (p) => p && p.is_primary && (p.image || p.image_url || p.image_file)
    );
    if (primary) return primary.image || primary.image_url || primary.image_file;

    const sorted = [...car.photos].sort((a, b) => {
      const sa = a && typeof a.sort_order === "number" ? a.sort_order : 999999;
      const sb = b && typeof b.sort_order === "number" ? b.sort_order : 999999;
      return sa - sb;
    });
    const first = sorted.find((p) => p && (p.image || p.image_url || p.image_file));
    if (first) return first.image || first.image_url || first.image_file;
  }
  return "/placeholder.png";
}

/* ===== формат чисел / цены ===== */
function fmtNumber(n, lang) {
  if (n === null || n === undefined || n === "") return "";
  const num = Number(String(n).replace(/[^\d.-]/g, ""));
  if (Number.isNaN(num)) return String(n);
  return num.toLocaleString(lang === "ro" ? "ro-RO" : "ru-RU", { maximumFractionDigits: 0 });
}
function fmtPrice(value, currency, lang) {
  if (value === null || value === undefined || value === "") return "";
  const cur = (currency || "EUR").toUpperCase();
  const formatted = fmtNumber(value, lang);
  return formatted ? `${formatted} ${cur}` : "";
}

/* ===== Afișaj combustibil unitar (lăsat ca în codul tău, dar nu îl mai folosim pentru afișare) ===== */
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
  const t = String(s || "").trim().toLowerCase();
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
function pickMostSpecific(candidates, fallback = "") {
  let best = fallback || "";
  let bestRank = best ? codeRank(best) : 99;
  for (const c of candidates) {
    if (!c) continue;
    const r = codeRank(c);
    if (r < bestRank) { best = c; bestRank = r; }
  }
  return best;
}
function inferCanonicalFromCar(car) {
  const explicitCanon = car?.fuel_type_canonical || "";
  const code = String(car?.fuel_type_code || "").toLowerCase();
  const textCandidates = [
    textToCanonical(car?.fuel),
    textToCanonical(car?.fuel_type_label),
    textToCanonical(car?.fuel_type_raw),
    textToCanonical(car?.title),
    textToCanonical(car?.description),
  ];
  let codeCanon = code;
  if (codeCanon === "hybrid") {
    const spec = pickMostSpecific(textCandidates, "");
    if (spec.startsWith("phev_") || spec.startsWith("hybrid_")) codeCanon = spec;
    else codeCanon = "hybrid_petrol";
  }
  const candidates = [explicitCanon, codeCanon, ...textCandidates];
  return pickMostSpecific(candidates, explicitCanon || codeCanon || "");
}
function labelFromCanonical(canon, lang) {
  const L = lang === "ro" ? FUEL_LABELS.ro : FUEL_LABELS.ru;
  return L[canon] || "";
}
function fuelTextFromCar(car, lang) {
  const canon = inferCanonicalFromCar(car);
  if (canon) {
    const mapped = labelFromCanonical(canon, lang);
    if (mapped) return mapped;
  }
  if (car?.fuel) return fuelLabel(car.fuel, lang);
  return car?.fuel_type_label || "";
}
function isElectricFromCar(car) {
  const canon = inferCanonicalFromCar(car);
  if (canon === "electric") return true;
  const s = String(car?.fuel || car?.fuel_type_label || "").trim().toLowerCase();
  return s === "electric" || s === "электро" || s.includes("electr") || s.includes("элект") || s === "ev" || s.endsWith(" ev");
}

export default function CarCard({ car }) {
  const { lang } = useI18n();

  const id = car?.id ? car.id : "";

  // ✅ Combustibil dintr-o singură sursă (canon/isEv/label)
  const { canon, isEv, label } = fuelMeta(car, lang, fuelLabel);

  // ✅ Link cu sincron 100% (trimite canon + EV în page.jsx)
  const href = id
    ? `/cars/${id}?fc=${encodeURIComponent(canon || "")}&ev=${isEv ? 1 : 0}`
    : "#";

  const make = car?.make || car?.brand || car?.mark || "";
  const model = car?.model || car?.series || car?.generation || "";
  const title = `${make || ""} ${model || ""}`.trim() || "Automobile";

  const photo = pickPhoto(car);
  const priceText = fmtPrice(car?.price_eur ?? car?.price, car?.currency, lang);

  const yearText = car?.year ? (lang === "ro" ? `${car.year}` : `${car.year} г.`) : "";
  const mileageText = car?.mileage_km
    ? lang === "ro" ? `${fmtNumber(car.mileage_km, lang)} km` : `${fmtNumber(car.mileage_km, lang)} км`
    : "";

  const transmissionTranslated = trLabel(car?.transmission, lang);
  const bodyTranslated = bodyLabel(car?.body_type, lang);

  // ✅ Afișare combustibil 1:1 cu canon + EV
  const fuelIcon = isEv ? "⚡" : "⛽";
  const fuelText = isEv ? "" : (label || car?.fuel || "—");

  return (
    <Link
      href={href}
      className="
        group overflow-hidden rounded-2xl border border-white/10 bg-white/5
        shadow-lg transition hover:border-white/20 hover:bg-white/10 hover:shadow-2xl
      "
    >
      <div className="aspect-[16/10] w-full overflow-hidden bg-black/40">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt={title}
            className="
              h-full w-full object-cover object-center
              transition duration-300 group-hover:scale-[1.03]
            "
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-white/40">
            фото нет
          </div>
        )}
      </div>

      <div className="p-4 text-white">
        <div className="line-clamp-2 text-lg font-semibold leading-snug">
          {title || (lang === "ro" ? "Fără nume" : "Без названия")}
        </div>

        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[13px] leading-snug text-white/60">
          {yearText ? <span>{yearText}</span> : null}
          {mileageText ? <span>{mileageText}</span> : null}
        </div>

        <div className="mt-2 text-xl font-bold leading-none tracking-tight text-emerald-300">
          {priceText || "—"}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-white/70">
          {/* Combustibil */}
          <div className="flex flex-col items-center rounded-lg bg-white/5 p-2 text-center ring-1 ring-white/10">
            <div className="mb-1 text-[16px] leading-none text-white/80">
              {fuelIcon}
            </div>
            <div className="break-words text-center text-[12px] font-semibold leading-snug text-white">
              {fuelText || (!isEv ? "—" : "")}
            </div>
          </div>

          {/* Transmisie */}
          <div className="flex flex-col items-center rounded-lg bg-white/5 p-2 text-center ring-1 ring-white/10">
            <div className="mb-1 text-[16px] leading-none text-white/80">⚙️</div>
            <div className="break-words text-center text-[12px] font-semibold leading-snug text-white">
              {transmissionTranslated || car?.transmission || "—"}
            </div>
          </div>

          {/* Caroserie */}
          <div className="flex flex-col items-center rounded-lg bg-white/5 p-2 text-center ring-1 ring-white/10">
            <div className="mb-1 text-[16px] leading-none text-white/80">🚘</div>
            <div className="break-words text-center text-[12px] font-semibold leading-snug text-white">
              {bodyTranslated || car?.body_type || "—"}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
