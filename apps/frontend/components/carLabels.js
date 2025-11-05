// apps/frontend/components/carLabels.js

// ===================== TOPLIVO / FUEL =====================

function normalizeFuel(raw) {
  const s = String(raw || "").trim().toLowerCase();
  if (!s) return "other";

  if (s.includes("diesel") || s.includes("диз")) return "diesel";

  if (
    s.includes("benz") ||
    s.includes("benzin") ||
    s.includes("petrol") ||
    s.includes("gasoline") ||
    s.includes("бенз")
  ) {
    return "petrol";
  }

  if (
    (s.includes("plug") && s.includes("hybrid")) ||
    (s.includes("plug") && s.includes("hibrid")) ||
    s.includes("плагин")
  ) {
    return "phev";
  }

  if (
    s.includes("hybrid") ||
    s.includes("hibrid") ||
    s.includes("гибрид")
  ) {
    return "hybrid";
  }

  if (
    s.includes("electr") ||
    s.includes("электр") ||
    s.includes("ev ") ||
    s.endsWith(" ev") ||
    s === "ev" ||
    s === "электро" ||
    s === "electric" ||
    s === "electrică"
  ) {
    return "electric";
  }

  if (s.includes("lpg") || s.includes("газ") || s.includes("gaz")) {
    return "lpg";
  }

  if (
    s.includes("cng") ||
    s.includes("metan") ||
    s.includes("methane") ||
    s.includes("метан")
  ) {
    return "cng";
  }

  return "other";
}

export function fuelLabel(rawFuel, lang) {
  const kind = normalizeFuel(rawFuel);

  const map = {
    diesel: {
      ru: "Дизель",
      ro: "Motorină",
    },
    petrol: {
      ru: "Бензин",
      ro: "Benzină",
    },
    phev: {
      ru: "Плагин-гибрид",
      ro: "Hibrid Plug-In",
    },
    hybrid: {
      ru: "Гибрид",
      ro: "Hibrid",
    },
    electric: {
      ru: "Электро",
      ro: "Electrică",
    },
    lpg: {
      ru: "Газ (LPG)",
      ro: "Gaz (LPG)",
    },
    cng: {
      ru: "Метан (CNG)",
      ro: "Metan (CNG)",
    },
    other: {
      ru: String(rawFuel || ""),
      ro: String(rawFuel || ""),
    },
  };

  return map[kind]?.[lang] ?? String(rawFuel || "");
}

// ===================== КПП / TRANSMISSION =====================

function normalizeTransmission(raw) {
  const s = String(raw || "").trim().toLowerCase();
  if (!s) return "other";

  // автомат, авто, автоматическая, автоматическая кпп, акпп, dsg, tiptronic, вариатор и т.д.
  if (
    /(auto|automat|automatic|cvt|робот|вариатор|акпп|dsg|tiptronic)/i.test(s) ||
    s.includes("автомат") || // "Автомат", "автоматическая"
    s.includes("авто.кпп") ||
    s.includes("авто кпп")
  ) {
    return "auto";
  }

  // механика, механическая, мех, мкпп, manual, mecanic
  if (
    /(manual|mecanic|мех|мкпп)/i.test(s) ||
    s.includes("механик") || // "механика", "механическая"
    s.includes("ручная") ||
    s.includes("ручная кпп") ||
    s.includes("ручная коробка")
  ) {
    return "manual";
  }

  return "other";
}

export function trLabel(rawTr, lang) {
  const kind = normalizeTransmission(rawTr);

  const map = {
    auto: {
      ru: "Автомат",
      ro: "Automată",
    },
    manual: {
      ru: "Механика",
      ro: "Manuală",
    },
    other: {
      ru: String(rawTr || ""),
      ro: String(rawTr || ""),
    },
  };

  return map[kind]?.[lang] ?? String(rawTr || "");
}

// ===================== КУЗОВ / BODY TYPE =====================

function normalizeBody(raw) {
  const s = String(raw || "").trim().toLowerCase();
  if (!s) return "other";

  // седан / limuzină
  if (s.includes("седан") || s.includes("sedan") || s.includes("limuzină")) {
    return "sedan";
  }

  // хэтчбек / хетчбек / hatchback
  if (
    s.includes("хэтч") ||
    s.includes("хетч") ||
    s.includes("hatch") ||
    s.includes("hatchback")
  ) {
    return "hatch";
  }

  // универсал / combi / break / wagon / touring
  if (
    s.includes("универс") ||
    s.includes("combi") ||
    s.includes("break") ||
    s.includes("wagon") ||
    s.includes("touring")
  ) {
    return "wagon";
  }

  // кроссовер / кросовер / кросс / внедорожник / джип / suv / crossover
  if (
    s.includes("кроссовер") ||
    s.includes("кросовер") ||
    s.includes("кросс") ||
    s.includes("внедорож") ||
    s.includes("джип") ||
    s.includes("suv") ||
    s.includes("crossover") ||
    s.includes("cross") ||
    s.includes("cros")
  ) {
    return "suv";
  }

  // купе / coupe
  if (s.includes("купе") || s.includes("coupe") || s.includes("coupé")) {
    return "coupe";
  }

  // кабриолет / cabrio / convertible
  if (
    s.includes("кабрио") ||
    s.includes("cabrio") ||
    s.includes("cabriolet") ||
    s.includes("convertible")
  ) {
    return "cabrio";
  }

  // пикап / pickup / pick-up
  if (s.includes("пикап") || s.includes("pickup") || s.includes("pick-up")) {
    return "pickup";
  }

  return "other";
}

export function bodyLabel(rawBody, lang) {
  const kind = normalizeBody(rawBody);

  const map = {
    sedan: {
      ru: "Седан",
      ro: "Sedan",
    },
    hatch: {
      ru: "Хэтчбек",
      ro: "Hatchback",
    },
    wagon: {
      ru: "Универсал",
      ro: "Break / Combi",
    },
    suv: {
      ru: "Кроссовер / SUV",
      ro: "SUV / Crossover",
    },
    coupe: {
      ru: "Купе",
      ro: "Coupé",
    },
    cabrio: {
      ru: "Кабриолет",
      ro: "Cabriolet",
    },
    pickup: {
      ru: "Пикап",
      ro: "Pick-up",
    },
    other: {
      ru: String(rawBody || ""),
      ro: String(rawBody || ""),
    },
  };

  return map[kind]?.[lang] ?? String(rawBody || "");
}
