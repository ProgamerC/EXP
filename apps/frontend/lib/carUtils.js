/* === Утилиты совместимые со старым синтаксисом (без optional chaining) === */

function val(x) {
    return typeof x === "undefined" || x === null ? "" : x;
}

/* === Форматирование чисел/цен (единое) === */
export function fmtNumber(n, lang) {
    if (n === null || typeof n === "undefined" || n === "") return "";
    var num = Number(String(n).replace(/[^\d.-]/g, ""));
    if (isNaN(num)) return String(n);
    var locale = lang === "ro" ? "ro-RO" : "ru-RU";
    return num.toLocaleString(locale, { maximumFractionDigits: 0 });
}

export function fmtPrice(value, currency, lang) {
    if (value === null || typeof value === "undefined" || value === "") return "";
    var cur = String((currency || "EUR")).toUpperCase();
    var formatted = fmtNumber(value, lang);
    return formatted ? (formatted + " " + cur) : "";
}

/* === Канонизация топлива (единая) === */
var FUEL_LABELS = {
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
        hydrogen: "Hidrogen"
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
        hydrogen: "Водород"
    }
};

function textToCanonical(s) {
    var t = String(val(s)).trim().toLowerCase();
    if (!t) return "";

    var hasDiesel = /(diesel|диз)/.test(t);
    var hasPetrol = /(benz|benzin|petrol|gasolin|бенз)/.test(t);
    var hasHybrid = /(hyb|гибр|hibrid)/.test(t);
    var hasPlug = /(plug|плаг)/.test(t);
    var isElectric = /(electr|элект)/.test(t);
    var isLpg = /(lpg|пропан|gpl)/.test(t);
    var isCng = /(cng|метан|metan)/.test(t);
    var isH2 = /(hydrogen|водород|h2)/.test(t);

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
    var best = fallback || "";
    var bestRank = best ? codeRank(best) : 99;
    for (var i = 0; i < candidates.length; i++) {
        var c = candidates[i];
        if (!c) continue;
        var r = codeRank(c);
        if (r < bestRank) {
            best = c;
            bestRank = r;
        }
    }
    return best;
}

/* Без optional chaining: аккуратно читаем поля */
function get(car, key) {
    return car && typeof car[key] !== "undefined" && car[key] !== null ? car[key] : "";
}

/* ====== Канон топлива из объекта авто ====== */
export function inferCanonicalFromCar(car) {
    var explicitCanon = get(car, "fuel_type_canonical") || "";
    var code = String(get(car, "fuel_type_code")).toLowerCase();

    var textCandidates = [
        textToCanonical(get(car, "fuel")),
        textToCanonical(get(car, "fuel_type_label")),
        textToCanonical(get(car, "fuel_type_raw")),
        textToCanonical(get(car, "title")),
        textToCanonical(get(car, "description"))
    ];

    var codeCanon = code;
    if (codeCanon === "hybrid") {
        var spec = pickMostSpecific(textCandidates, "");
        if (spec.indexOf("phev_") === 0 || spec.indexOf("hybrid_") === 0) {
            codeCanon = spec;
        } else {
            codeCanon = "hybrid_petrol";
        }
    }

    var candidates = [explicitCanon, codeCanon].concat(textCandidates);
    return pickMostSpecific(candidates, explicitCanon || codeCanon || "");
}

function labelFromCanonical(canon, lang) {
    var L = lang === "ro" ? FUEL_LABELS.ro : FUEL_LABELS.ru;
    return (L && L[canon]) || "";
}

/* ====== EV-флаг (как в карточке) ====== */
export function isElectricFromCar(car, canonMaybe) {
    var canon = canonMaybe || inferCanonicalFromCar(car);
    if (canon === "electric") return true;
    var s = String(get(car, "fuel") || get(car, "fuel_type_label"))
        .trim()
        .toLowerCase();
    return (
        s === "electric" ||
        s === "электро" ||
        s.indexOf("electr") !== -1 ||
        s.indexOf("элект") !== -1 ||
        s === "ev" ||
        / ev$/.test(s)
    );
}

/* ====== NOU: sursa unică pentru combustibil (canon + isEv + label) ======
   fuelLabelFn — опционально: передай сюда fuelLabel из carLabels.js,
   чтобы получить fallback-перевод сырых значений (если канон пуст). */
export function fuelMeta(car, lang, fuelLabelFn) {
    var canon = inferCanonicalFromCar(car);
    var ev = isElectricFromCar(car, canon);
    var label = "";

    if (!ev) {
        // сначала — локализованный label по канону
        label = labelFromCanonical(canon, lang);
        // если канона нет/не распознан — пытаемся аккуратно перевести сырое поле
        if (!label) {
            var rawFuel = get(car, "fuel");
            if (rawFuel && typeof fuelLabelFn === "function") {
                label = fuelLabelFn(rawFuel, lang) || "";
            }
            if (!label) label = get(car, "fuel_type_label") || "";
        }
    } else {
        // для EV текст — пустой (как в CarCard)
        label = "";
    }

    return { canon: canon, isEv: ev, label: label };
}

/* === Совместимость: старый API, теперь обёртка над fuelMeta ===
   fuelLabelFallback — пробрасываем как fuelLabelFn (если нужен). */
export function fuelTextFromCar(car, lang, fuelLabelFallback) {
    var meta = fuelMeta(car, lang, fuelLabelFallback);
    return meta.label;
}