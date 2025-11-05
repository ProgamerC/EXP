// apps/frontend/app/cars/[id]/page.jsx

import CarGallery from "@/components/CarGallery";
import BackButton from "@/components/BackButton";
import CarSpecs from "@/components/CarSpecs";

/* ================= API ================= */
function getApiBase() {
  const raw = (process.env.NEXT_PUBLIC_BACKEND_URL || "").trim();
  if (raw && /^https?:\/\//i.test(raw)) return raw.replace(/\/+$/, "");
  return "http://backend:8000";
}
function buildUrl(path) {
  const base = getApiBase();
  const clean = String(path || "").replace(/^\/+/, "");
  return base + "/" + clean;
}
async function fetchCar(id) {
  if (!id) return null;
  const url = buildUrl("/api/cars/" + encodeURIComponent(id) + "/");
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res || !res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/* ============ Fuel canonicalization (robust, no optional chaining) ============ */
function get(o, k) {
  return o && typeof o[k] !== "undefined" && o[k] !== null ? o[k] : "";
}
function textToCanonical(s) {
  const t = String(s == null ? "" : s).trim().toLowerCase();
  if (!t) return "";

  const hasDiesel  = /(diesel|диз)/.test(t);
  const hasPetrol  = /(benz|benzin|petrol|gasolin|бенз)/.test(t);
  const hasHybrid  = /(hyb|гибр|hibrid)/.test(t);
  const hasPlug    = /(plug|плаг)/.test(t);
  const isElectric = /(electr|элект)/.test(t);
  const isLpg      = /(lpg|пропан|gpl)/.test(t);
  const isCng      = /(cng|метан|metan)/.test(t);
  const isH2       = /(hydrogen|водород|h2)/.test(t);

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
function pickMostSpecific(list, fallback) {
  var best = fallback || "";
  var bestRank = best ? codeRank(best) : 99;
  for (var i = 0; i < list.length; i++) {
    var c = list[i];
    if (!c) continue;
    var r = codeRank(c);
    if (r < bestRank) { best = c; bestRank = r; }
  }
  return best;
}

/* Colectează indicii despre combustibil din multe locuri posibile */
function collectFuelHints(car) {
  var hints = [];

  // 1) câmpuri comune
  var directKeys = [
    "fuel","fuel_type_label","fuel_type_raw","fuel_type","fuel_type_name",
    "fuelType","fueltype","engine_fuel","engineFuel","engine","motor",
    "powertrain","drivetrain","title","description"
  ];
  for (var i = 0; i < directKeys.length; i++) {
    var v = get(car, directKeys[i]);
    if (typeof v === "string" && v) hints.push(textToCanonical(v));
  }

  // 2) perechi la nivel superior unde key sugerează fuel/engine
  for (var key in (car || {})) {
    if (!Object.prototype.hasOwnProperty.call(car, key)) continue;
    var low = String(key).toLowerCase();
    if (/(fuel|engine|motor|powertrain)/.test(low)) {
      var val = car[key];
      if (typeof val === "string" && val) hints.push(textToCanonical(val));
    }
  }

  // 3) containere populare: obiect sau array de parametri
  var containers = ["attributes","attrs","specs","params","details","extra"];
  for (var j = 0; j < containers.length; j++) {
    var box = get(car, containers[j]);

    // obiect: { fuel: "...", ... } sau { key: {value:"..."} }
    if (box && typeof box === "object" && !Array.isArray(box)) {
      for (var k in box) {
        if (!Object.prototype.hasOwnProperty.call(box, k)) continue;
        var kk = String(k).toLowerCase();
        if (/(fuel|combust|carburant|топлив|benzin|diesel|hyb|electr)/.test(kk)) {
          var vv = box[k];
          if (typeof vv === "string" && vv) hints.push(textToCanonical(vv));
          if (vv && typeof vv === "object" && vv.value && typeof vv.value === "string") {
            hints.push(textToCanonical(vv.value));
          }
        }
      }
    }

    // array: [{name/label/key,value}, ...]
    if (Array.isArray(box)) {
      for (var t = 0; t < box.length; t++) {
        var it = box[t];
        var n1 = get(it,"name"), n2 = get(it,"label"), n3 = get(it,"key"), v1 = get(it,"value");
        var keyStr = (String(n1 || n2 || n3 || "")).toLowerCase();
        if (/(fuel|combust|carburant|топлив|benzin|diesel|hyb|electr)/.test(keyStr)) {
          if (typeof v1 === "string" && v1) hints.push(textToCanonical(v1));
        }
      }
    }
  }

  var out = [];
  for (var h = 0; h < hints.length; h++) if (hints[h]) out.push(hints[h]);
  return out;
}

function inferCanonicalRobust(car) {
  var explicitCanon = get(car, "fuel_type_canonical") || "";
  var code = String(get(car, "fuel_type_code") || "").toLowerCase();
  var collected = collectFuelHints(car);

  var codeCanon = code;
  if (codeCanon === "hybrid") {
    var spec = pickMostSpecific(collected, "");
    codeCanon = (spec.indexOf("phev_") === 0 || spec.indexOf("hybrid_") === 0) ? spec : "hybrid_petrol";
  }

  return pickMostSpecific([explicitCanon, codeCanon].concat(collected), explicitCanon || codeCanon || "");
}

function isElectricByCanonOrText(car, canon) {
  if (canon === "electric") return true;
  const s = String(get(car, "fuel") || get(car, "fuel_type_label")).trim().toLowerCase();
  return (
    s === "electric" || s === "электро" ||
    s.indexOf("electr") !== -1 || s.indexOf("элект") !== -1 ||
    s === "ev" || / ev$/.test(s)
  );
}

/* ================= PAGE ================= */
export default async function CarPage({ params, searchParams }) {
  const id = params && typeof params.id !== "undefined" ? params.id : null;
  const car = await fetchCar(id);

  if (!car) {
    return (
      <main className="mx-auto max-w-6xl p-4 text-white">
        <BackButton className="mb-4" fallback="/" />
        <div className="rounded-xl border border-white/10 p-6">Авто не найдено</div>
      </main>
    );
  }

  // Фото — без schimbări
  const photosRaw = Array.isArray(car.photos) ? car.photos : [];
  const photos = photosRaw;
  const cover = photos[0] || null;

  /* ======== Fuel: prioritate URL -> backend -> inferență robustă ======== */
  // 1) din URL (dacă într-un viitor adaugi în CarCard: href={`/cars/${id}?fc=${canon}&ev=${isEv?1:0}`})
  const sp = searchParams || {};
  const fcFromUrl = typeof sp.fc === "string" ? sp.fc.trim().toLowerCase() : "";
  const evFromUrl = typeof sp.ev === "string" ? sp.ev.trim() : "";

  // 2) din backend (dacă există)
  const explicitCanon = get(car, "fuel_type_canonical") || "";

  // 3) inferență robustă
  const inferred = inferCanonicalRobust(car);

  // alege ordinea de prioritate
  const fuelCanonical = fcFromUrl || explicitCanon || inferred;
  const isEv = evFromUrl === "1" || evFromUrl === "true" ? true : isElectricByCanonOrText(car, fuelCanonical);

  return (
    <main className="mx-auto max-w-6xl p-4 text-white">
      <BackButton className="mb-4" fallback="/" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* LEFT: Gallery — НЕ ТРОГАЕМ */}
        <section className="lg:col-span-2">
          <CarGallery photos={photos} cover={cover} />
        </section>

        {/* RIGHT: спеки — trimitem DOAR canonical + EV (textul se traduce în CarSpecs după lang) */}
        <CarSpecs car={car} fuelCanonical={fuelCanonical} isEv={isEv} />
      </div>
    </main>
  );
}
