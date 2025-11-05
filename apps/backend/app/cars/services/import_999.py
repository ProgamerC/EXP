import os
import time
import re
import datetime
from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, Any, Tuple, Optional, List, Union

from django.db import transaction
from django.utils import timezone
from requests import HTTPError
from bs4 import BeautifulSoup

from app.cars.models import Car, Photo
from app.integrations.partners999 import (
    get_adverts,
    get_advert,
    get_advert_features,
    get_public_ad_html,
)

# =========================
# Конфиг
# =========================
LANG = os.getenv("N999_LANG", "ru")  # парсим ru, чтобы ключи были типа "Тип топлива"
STATES = os.getenv("N999_STATES", "public")

FEATURE_RETRIES = int(os.getenv("N999_FEATURE_RETRIES", "5"))
FEATURE_RETRY_SLEEP = float(os.getenv("N999_FEATURE_RETRY_SLEEP", "1.5"))
PER_ADVERT_SLEEP = float(os.getenv("N999_PER_ADVERT_SLEEP", "0.4"))
PER_PAGE_SLEEP = float(os.getenv("N999_PER_PAGE_SLEEP", "1.0"))

# =========================
# Человеко-читаемые лейблы
# =========================
FUEL_LABELS = {
    "petrol": "Бензин",
    "diesel": "Дизель",
    "lpg_propane": "Газ / Бензин (пропан)",
    "cng_methane": "Газ / Бензин (метан)",
    "hybrid": "Гибрид",
    "electric": "Электричество",
    "phev_petrol": "Плагин-гибрид (бензин)",
    "phev_diesel": "Плагин-гибрид (дизель)",
    "mhev_petrol": "Мягкий-гибрид (бензин)",
    "mhev_diesel": "Мягкий-гибрид (дизель)",
    "other": "Другое",
}

TRANSMISSION_LABELS = {
    "automatic": "Автомат",
    "manual": "Механика",
    "robot": "Робот",
    "cvt": "Вариатор",
    "other": "Другое",
    "": "Другое",
    None: "Другое",
}

# =========================
# Ключи фичей из API (fallback)
# =========================
FEATURE_MAP = {
    "make": [
        "марка", "marcă", "marca", "brand",
        "producător", "producator"
    ],
    "model": [
        "модель", "model"
    ],
    "generation": [
        "поколение", "generație", "generatie",
        "generația", "generatia"
    ],
    "registration_country": [
        "регистрация", "înmatriculare", "inmatriculare",
        "țara înmatriculării", "tara inmatricularii",
    ],
    "condition": [
        "состояние", "stare"
    ],
    "availability": [
        "наличие", "disponibil"
    ],
    "origin_country": [
        "происхождение", "origine",
        "țara de origine", "tara de origine"
    ],
    "year": [
        "год выпуска", "an fabricației", "an fabricatiei",
        "anul", "anul fabricației", "anul fabricatiei",
        "an", "anul fabricatiei"
    ],
    "seats": [
        "количество мест", "număr locuri", "numar locuri",
        "număr de locuri", "numar de locuri",
        "locuri", "кол-во мест", "мест",
    ],
    "body_type": [
        "тип кузова", "caroserie", "caroseria",
        "tip caroserie", "кузов",
    ],
    "mileage_km": [
        "пробег", "rulaj", "kilometraj",
    ],
    "engine_cc": [
        "объём двигателя", "объем двигателя", "capacitate motor",
        "capacitate cilindrică", "capacitate cilindrica",
        "capacitate", "cap. cilindrică", "cap. cilindrica",
    ],
    "power_hp": [
        "мощность", "putere", "cai putere",
        "putere (cp)", "мощность, л.с.", "мощность (л.с.)",
    ],
    "fuel_type": [
        "тип топлива", "топливо", "combustibil", "tip combustibil",
        "carburant", "combustibilul",
    ],
    "transmission": [
        "кпп", "коробка передач",
        "cutie de viteze", "cutie viteze",
        "transmisie", "cutie", "cutia",
    ],
    "drive": [
        "привод", "tracțiune", "tractiune",
        "tip tracțiune", "tip tractiune",
    ],
    "color": [
        "цвет", "culoare",
    ],
    "location_city": [
        "город", "oraș", "oras", "регион", "регион:",
    ],
}

# =========================
# Утилиты
# =========================

def _to_int_digits(s: str) -> Optional[int]:
    digits = "".join(ch for ch in s if ch.isdigit())
    if not digits:
        return None
    try:
        return int(digits)
    except Exception:
        return None


def extract_numeric(val) -> Optional[int]:
    """
    "163 000 км" -> 163000
    163000 -> 163000
    """
    if val is None:
        return None
    if isinstance(val, (int, float)):
        try:
            return int(val)
        except Exception:
            return None
    return _to_int_digits(str(val))


def parse_engine_cc(raw: str) -> Optional[int]:
    """
    Объём двигателя в см³.
    Поддержка:
    - "1995 cm3", "1995 cm³", "1995 cc"
    - "2.0 L", "2.0 литра", "2,0 л" -> 2000
    """
    if not raw:
        return None
    txt = raw.lower().strip()

    # см³ / cm3
    m_cc = re.search(r'(\d{3,5})\s*(?:cm3|cm³|cc|cmc|см3|см³|см\^3|см куб)', txt)
    if m_cc:
        try:
            return int(m_cc.group(1))
        except Exception:
            pass

    # литры
    m_l = re.search(r'(\d+(?:[.,]\d)?)\s*(?:l|l\.|litri|litru|litre|л|литра|литры|литров)', txt)
    if m_l:
        try:
            liters = Decimal(m_l.group(1).replace(",", "."))
            cc = (liters * Decimal("1000")).quantize(
                Decimal("1"), rounding=ROUND_HALF_UP
            )
            return int(cc)
        except Exception:
            pass

    # fallback: просто число типа "1995"
    m_plain = re.search(r'\b(\d{3,5})\b', txt)
    if m_plain:
        try:
            val = int(m_plain.group(1))
            if 600 <= val <= 7000:
                return val
        except Exception:
            pass

    return None


def parse_year_from_text(s: str) -> Optional[int]:
    if not s:
        return None
    m = re.search(r'(19[6-9]\d|20[0-4]\d)', s)
    if not m:
        return None
    try:
        y = int(m.group(1))
    except Exception:
        return None
    this_year = datetime.datetime.now().year
    if 1960 <= y <= this_year + 1:
        return y
    return None


def norm_condition(val: str) -> str:
    s = (val or "").lower()
    if "nou" in s or "нов" in s:
        return "new"
    if "accident" in s or "дтп" in s:
        return "after_accident"
    if "piese" in s or "част" in s:
        return "for_parts"
    return "used"


def norm_availability(v: str) -> str:
    s = (v or "").lower()
    if "în stoc" in s or "in stoc" in s or "налич" in s:
        return "in_stock"
    if "la comandă" in s or "la comanda" in s or "заказ" in s:
        return "on_order"
    if "rezerv" in s or "резерв" in s:
        return "reserved"
    if "vândut" in s or "vandut" in s or "продан" in s:
        return "sold"
    return "in_stock"


def is_hybrid_family(code: str) -> bool:
    """
    Типы топлива, где не бывает реальной "механики".
    """
    return code in (
        "hybrid",
        "electric",
        "phev_petrol",
        "phev_diesel",
        "mhev_petrol",
        "mhev_diesel",
    )

# =========================
# спец-эвристика Mercedes PHEV
# =========================

def _mercedes_phev_badge_looks_diesel(title: str, make: str, model: str) -> Optional[bool]:
    """
    Если это Mercedes:
       "E300de", "E 300 de", "GLC300de" -> дизельный PHEV
       "E300e",  "GLC300e"              -> бензиновый PHEV

    True  -> дизельный phev
    False -> бензиновый phev
    None  -> неясно
    """
    t = f"{title} {make} {model}".lower()

    if "mercedes" not in t:
        return None

    pat_de = re.compile(r'\b[a-z]{1,4}\s*[- ]?\s*\d{3}\s*de\b', re.I)
    if pat_de.search(t):
        return True

    pat_e = re.compile(r'\b[a-z]{1,4}\s*[- ]?\s*\d{3}\s*e\b', re.I)
    if pat_e.search(t) and not pat_de.search(t):
        return False

    if (
        ("bluetec" in t or re.search(r'\b\d{2,3}d\b', t, re.I))
        and ("plug" in t or "phev" in t or "плагин" in t or "plug-in" in t)
    ):
        return True

    return None

# =========================
# EV определение по тексту
# =========================

def _detect_ev_status_txt(txt: str) -> Tuple[bool, bool]:
    """
    Возвращает (hard_ev, soft_ev)
    hard_ev = уверенно чистый EV
    soft_ev = очень похоже на EV
    """
    txt_l = txt.lower()

    hard_markers = [
        "100% electric",
        "full electric",
        "battery electric",
        "bev",
        "vehicul electric",
        "электромобиль",
        "электрокар",
        "электроавто",
        "электромобіль",
        "электрический автомобиль",
        "электрическое авто",
        "electromobil",
        "electromobilă",
        "electromobila",
    ]

    if re.search(r'\b\d{2,3}\s*kwh\b', txt_l):
        return True, True

    hard_hit = any(marker in txt_l for marker in hard_markers)

    soft_markers = [
        "electro",
        "электро",
        "электрическ",
        "electrica",
        "electrică",
        "машина электрическая",
        "plug-in electric",
        "plug in electric",
    ]
    soft_hit = any(marker in txt_l for marker in soft_markers)

    return hard_hit, soft_hit

# =========================
# нормализация топлива
# =========================

def normalize_fuel_code(raw: str) -> str:
    """
    Превращает сырой текст топлива (из HTML или из API 999) в наш код:
    - petrol
    - diesel
    - lpg_propane
    - cng_methane
    - hybrid
    - electric
    - phev_petrol
    - phev_diesel
    - mhev_petrol
    - mhev_diesel
    - other
    """

    s = (raw or "").strip().lower()
    if not s:
        return "other"

    # --- ELECTRIC / ЭЛЕКТРИЧЕСТВО ---
    # На 999 встречаются варианты:
    #  - "Electricitate" (ro)
    #  - "Electrica", "Electrică"
    #  - "Electric"
    #  - "Электричество" (ru)
    #  - "Электро", "Электромобиль", "электрический"
    #
    # Ловим сразу любые формы со стволом "electr" или "электр".
    if (
        "electr" in s                      # electric / electricitate / electrica ...
        or s.startswith("электр")          # электричество / электрическая / электрич...
        or "электро" in s                  # электро / электромобиль
        or s in ("ev", "bev")              # короткие метки
        or "vehicul electric" in s         # румынские описания
        or "электромоб" in s               # электромобиль / электромобиля
        or "электрическ" in s              # электрический (двигатель)
    ):
        return "electric"

    # --- PLUG-IN HYBRID (PHEV) / Плагин-гибрид ---
    # Смотрим маркеры плагин-гибрида.
    phev_words = [
        "plug-in", "plug in", "phev", "plug–in", "plug – in",
        "плагин-гибрид", "плагин гибрид",
        "plug-in hybrid", "plug in hybrid",
        "plug-in hibrid", "plug in hibrid",
        "плагин-гiбрид", "плагiн-гiбрид", "плагін-гібрид", "плагін гібрид",
    ]
    if any(w in s for w in phev_words):
        diesel_markers = [
            "diesel", "dizel", "дизел", "дизель",
            "motorină", "motorina", "motorin",
        ]
        petrol_markers = [
            "benzin", "бензин", "benzina", "benzină",
            "gasoline", "petrol",
        ]
        has_diesel = any(x in s for x in diesel_markers)
        has_petrol = any(x in s for x in petrol_markers)

        if has_diesel and not has_petrol:
            return "phev_diesel"
        if has_petrol and not has_diesel:
            return "phev_petrol"

        # Бывает просто "Плагин-гибрид" без уточнения дизель/бензин
        # В этом случае мы пока вернём "hybrid", а потом в reconcile_logic
        # (мерседес с индексом "de") мы ещё уточним до phev_diesel/phev_petrol.
        return "hybrid"

    # --- MHEV (мягкий гибрид / mild hybrid) ---
    mhev_words = [
        "mhev", "mild hybrid", "mild-hybrid", "mildhybrid",
        "48v", "48 v", "48-вольт", "48 вольт",
        "мягкий гибрид", "мягкий-гибрид",
        "mild hibrid", "mild-hibrid",
    ]
    if any(w in s for w in mhev_words):
        diesel_markers = [
            "diesel", "dizel", "дизел", "дизель",
            "motorină", "motorina", "motorin",
        ]
        petrol_markers = [
            "benzin", "бензин", "benzina", "benzină",
            "gasoline", "petrol",
        ]
        if any(x in s for x in diesel_markers) and not any(x in s for x in petrol_markers):
            return "mhev_diesel"
        return "mhev_petrol"

    # --- Обычный гибрид HEV ---
    if any(w in s for w in ["hybrid", "hibrid", "гибрид", "hev", "гибридный", "гибридная"]):
        return "hybrid"

    # --- Газ (пропан / метан) ---
    if "gpl" in s or "lpg" in s or "propan" in s or "propane" in s or "gaz/gpl" in s:
        return "lpg_propane"
    if "cng" in s or "metan" in s or "methan" in s or "metane" in s or "metano" in s:
        return "cng_methane"

    # --- Дизель ---
    if any(x in s for x in ["diesel", "dizel", "дизел", "дизель", "motorină", "motorina", "motorin"]):
        return "diesel"

    # --- Бензин ---
    if any(x in s for x in [
        "benzin", "бензин", "benzina", "benzină", "gasoline", "petrol",
        "t-gdi", "tgdi", "gdi", "tsi", "tfsi", "mpi", "ecoboost",
        "t-jet", "tjet", "skyactiv-g", "skyactiv g"
    ]):
        return "petrol"

    # --- "gaz" иногда значит пропан-бутан ---
    if "gaz" in s:
        return "lpg_propane"

    return "other"


# =========================
# fallback: угадать топливо из текста
# =========================

def infer_fuel_from_text(title_text: str, body_text: str, make: str = "", model: str = "") -> Optional[str]:
    """
    Используется только если мы НЕ смогли достать нормальный fuel_type из html
    (или получили "other") и пришлось падать на API/текст.
    """
    txt = f"{title_text} {body_text}".lower()

    # сперва мерседес
    mb = _mercedes_phev_badge_looks_diesel(title_text, make, model)
    if mb is True:
        return "phev_diesel"
    if mb is False:
        return "phev_petrol"

    diesel_markers = [
        "diesel", "dizel", "дизел", "дизель",
        "motorină", "motorina", "motorin",
        "tdi", "dci", "blue dci", "cdi", "multijet",
        "hdi", "bluehdi", "bluetec"
    ]
    petrol_markers = [
        "benzin", "бензин", "benzina", "benzină",
        "gasoline", "petrol", "tsi", "tfsi", "mpi",
        "t-jet", "tjet", "ecoboost", "gdi", "tgdi", "t-gdi",
        "skyactiv-g", "skyactiv g"
    ]
    hybridish_markers = [
        "hybrid", "hibrid", "гибрид", "hev", "гибридный", "гибридная",
        "mhev", "mild hybrid", "mild-hybrid", "48v",
        "мягкий гибрид", "мягкий-гибрид", "mild hibrid", "mild-hibrid"
    ]

    has_dieselish = any(w in txt for w in diesel_markers)
    has_petrolish = any(w in txt for w in petrol_markers)
    has_hybridish = any(w in txt for w in hybridish_markers)

    hard_ev, soft_ev = _detect_ev_status_txt(txt)

    if hard_ev:
        return "electric"

    if soft_ev and not (
        "plug-in" in txt or "plug in" in txt or "phev" in txt or "плагин" in txt or "plug-in hybrid" in txt
        or "hybrid" in txt or "hibrid" in txt or "гибрид" in txt
    ):
        return "electric"

    if any(w in txt for w in [
        "plug-in", "plug in", "phev", "плагин-гибрид",
        "плагин гибрид", "plug-in hybrid", "plug in hybrid", "plug-in hibrid"
    ]):
        if has_dieselish and not has_petrolish:
            return "phev_diesel"
        if has_petrolish and not has_dieselish:
            return "phev_petrol"
        return "hybrid"

    if any(w in txt for w in [
        "mhev", "mild hybrid", "mild-hybrid", "48v",
        "мягкий гибрид", "мягкий-гибрид", "mild hibrid", "mild-hibrid"
    ]):
        if has_dieselish and not has_petrolish:
            return "mhev_diesel"
        return "mhev_petrol"

    if has_hybridish:
        return "hybrid"

    if has_dieselish:
        return "diesel"

    if has_petrolish:
        return "petrol"

    if any(w in txt for w in ["gpl", "lpg", "gaz/gpl", "propan", "propane"]):
        return "lpg_propane"
    if any(w in txt for w in ["cng", "metan", "methan", "metane", "metano"]):
        return "cng_methane"

    return None

# =========================
# КПП нормализация
# =========================

def normalize_transmission_code(raw: str) -> str:
    """
    КПП -> 'automatic' | 'manual' | 'cvt' | 'robot' | 'other'
    """
    s = (raw or "").strip().lower()
    if not s:
        return "other"

    auto_markers = [
        "automat", "automată", "automata", "automatic", "автомат",
        "tiptronic", "steptronic", "s-tronic", "s tronic", "stronic",
        "g-tronic", "gtronic", "7g-tronic", "8g-tronic", "9g-tronic",
        "multitronic", "powershift", "speedshift",
        "dsg", "dct", "6dct", "7dct", "8dct", "9dct",
        "a/t", " at", "at ", "at-", "akpp", "акп", "акпп",
        "easytronic", "easy-tronic", "easy shift", "easy-shift",
        "semi-autom", "semi autom", "semi-automată", "semi automată",
        "semiautomat", "semiautomatic", "semi-automatic", "sequential",
        "secvential", "secvenţial", "secvenţială",
    ]
    if any(m in s for m in auto_markers):
        return "automatic"

    cvt_markers = ["cvt", "variator", "вариатор", "xtronic", "multidrive"]
    if any(m in s for m in cvt_markers):
        return "cvt"

    robot_markers = [
        "robot", "robotizată", "robotizata", "робот",
        "dual clutch", "dual-clutch", "double clutch", "dublu ambreiaj",
    ]
    if any(m in s for m in robot_markers):
        return "robot"

    manual_markers = [
        "manual", "manuală", "manuala", "мех", "механ",
        "m/t", "mt ", " mt", "mkp", "mkpp", "мкп", "мкпп",
        "5mt", "6mt", "7mt", "schimb manual", "cutie manuala"
    ]
    if any(m in s for m in manual_markers):
        return "manual"

    return "other"


def norm_drive(v: str) -> str:
    s = (v or "").lower()
    if "4x4" in s or "4 x 4" in s or "awd" in s or "integral" in s:
        return "awd"
    if "spate" in s or "зад" in s or "rwd" in s:
        return "rwd"
    if "față" in s or "fata" in s or "перед" in s or "fwd" in s:
        return "fwd"
    return "fwd"


def norm_body(v: str) -> str:
    """
    Превращает сырой текст типа кузова ("Кроссовер", "Хэтчбек", "Break", "Monovolum")
    в наш код:
      sedan, hatchback, wagon, suv, coupe, cabrio,
      minivan, pickup, van, other.

    Мы стараемся НЕ возвращать "other", если можно понять.
    """
    s = (v or "").strip().lower()
    if not s:
        return "other"

    # ---- Седан ----
    # "седан", "sedan", рум. "berlina"/"berlină"
    if (
        "седан" in s
        or "sedan" in s
        or "berlina" in s
        or "berlină" in s
        or "berline" in s
    ):
        return "sedan"

    # ---- Хэтчбек ----
    # "хэтчбек", "хетчбек", "хэтч", "hatch", "hatchback"
    if (
        "хэтч" in s
        or "хетч" in s
        or "hatch" in s
        or "hatchback" in s
    ):
        return "hatchback"

    # ---- Универсал / комби / break ----
    # "универсал", "universal", "wagon", "break", "combi"
    if (
        "универс" in s
        or "universal" in s
        or "wagon" in s
        or "estate" in s
        or "touring" in s
        or "break" in s
        or "combi" in s
        or "familiar" in s
    ):
        return "wagon"

    # ---- Кроссовер / внедорожник / SUV ----
    # "кроссовер", "crossover", "cros(s)over", "suv",
    # "внедорожник", "offroad"
    if (
        "кроссов" in s
        or "crossover" in s
        or "cross-over" in s
        or "cross over" in s
        or "suv" in s
        or "внедоро" in s
        or "offroad" in s
        or "off-road" in s
        or "off road" in s
        or "4x4" in s  # часто пишут "SUV 4x4"
    ):
        return "suv"

    # ---- Купе ----
    # "купе", "coupe", "coupé"
    if (
        "купе" in s
        or "coupe" in s
        or "coupé" in s
        or "coupé" in s
    ):
        return "coupe"

    # ---- Кабриолет / кабрио / кабрио / decapotabil ----
    # "кабриолет", "кабрио", "cabrio", "cabriolet", "decapotabil"
    if (
        "кабрио" in s
        or "кабриолет" in s
        or "cabrio" in s
        or "cabriolet" in s
        or "roadster" in s
        or "spider" in s
        or "spyder" in s
        or "decapotabil" in s
        or "decapotabilă" in s
        or "decapotabila" in s
        or "convertible" in s
    ):
        return "cabrio"

    # ---- Минивэн / MPV ----
    # "минивэн", "minivan", "mpv", "monovolum"
    if (
        "минив" in s
        or "minivan" in s
        or "mpv" in s
        or "monovolum" in s
        or "mono-volum" in s
        or "mono volum" in s
        or "monovolum" in s
        or "monovolumă" in s
        or "monovoluma" in s
        or "monocab" in s
        or "multi purpose" in s
        or "multi-purpose" in s
    ):
        return "minivan"

    # ---- Пикап ----
    # "пикап", "pick-up", "pickup", "pick up"
    if (
        "пикап" in s
        or "pick-up" in s
        or "pick up" in s
        or "pickup" in s
        or "pick-up truck" in s
    ):
        return "pickup"

    # ---- Фургон / VAN ----
    # "фургон", "van", "furgon", "cargo van"
    if (
        "фург" in s
        or "furgon" in s
        or "furgoneta" in s
        or "van" in s
        or "cargo van" in s
        or "panel van" in s
    ):
        return "van"

    # Не поняли — метим как other
    return "other"



def kw_to_hp_kwstr(s: str) -> Optional[int]:
    """
    "115 л.с." / "115 CP" -> 115
    "85 kW" -> ~114 hp
    """
    if not s:
        return None
    sl = s.lower()

    m_cp = re.search(r'(\d{2,4})\s*(?:cp|hp|л\.с\.|л.с.|лс|л-с)\b', sl)
    if m_cp:
        try:
            return int(m_cp.group(1))
        except Exception:
            return None

    m_kw = re.search(r'(\d{2,4}(?:[.,]\d{1,2})?)\s*kw\b', sl)
    if m_kw:
        try:
            kw = Decimal(m_kw.group(1).replace(",", "."))
            hp = (kw * Decimal("1.341")).quantize(
                Decimal("1"),
                rounding=ROUND_HALF_UP,
            )
            return int(hp)
        except Exception:
            return None

    return None


def caplen(field_name: str, value: Optional[str]) -> Optional[str]:
    """
    Обрезаем строку под max_length у модели Car.<field_name>
    чтоб не упасть в DataError.
    """
    if value is None:
        return None
    try:
        maxlen = getattr(Car._meta.get_field(field_name), "max_length", None)
        if maxlen and isinstance(value, str) and len(value) > maxlen:
            return value[:maxlen]
    except Exception:
        pass
    return value


# =========================
# Доступ к API 999 (features)
# =========================

def _get_features_with_retry(advert_id: str) -> Dict[str, Any]:
    last_err = None
    for attempt in range(1, FEATURE_RETRIES + 1):
        try:
            return get_advert_features(advert_id, lang=LANG)
        except HTTPError as e:
            status = getattr(e.response, "status_code", None)
            last_err = e
            if status == 429:
                time.sleep(FEATURE_RETRY_SLEEP * attempt)
                continue
            raise
    if last_err:
        raise last_err
    return {"features": []}


def flatten_features(feat_resp: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    get_advert_features -> groups -> features.
    Делаем плоский список.
    """
    out: List[Dict[str, Any]] = []
    groups = feat_resp.get("features_groups") or []
    for grp in groups:
        feats = grp.get("features") or []
        out.extend(feats)

    if not out and isinstance(feat_resp.get("features"), list):
        out = feat_resp["features"]

    return out


def to_text(val: Any) -> str:
    """
    Универсально превращаем значение фичи из API в строку.
    """
    if val is None:
        return ""
    if isinstance(val, str):
        return val
    if isinstance(val, (int, float)):
        return str(val)
    if isinstance(val, dict):
        for k in ("title", "name", "label", "value"):
            if isinstance(val.get(k), str) and val.get(k):
                return val[k]
        if "value" in val:
            return str(val["value"])
        return str(val)
    if isinstance(val, list):
        parts = [to_text(x) for x in val]
        parts = [p for p in parts if p]
        return ", ".join(parts)
    return str(val)


def find_feature_value(features: List[Dict[str, Any]], keys: List[str]) -> Optional[Any]:
    """
    Находим фичу, у которой title/code похожи на любой вариант из FEATURE_MAP[key]
    """
    for f in features:
        title = (f.get("title") or "").lower()
        slug = (f.get("code") or f.get("slug") or "").lower()
        for k in keys:
            kslug = k.replace(" ", "_").lower()
            if k.lower() in title or (slug and kslug in slug):
                return f.get("value")
    return None


def extract_price_from_api(advert: Dict[str, Any]) -> Tuple[Optional[Decimal], str]:
    """
    Цена из partners API (fallback).
    """
    pr = advert.get("price") or {}
    value = pr.get("value")
    unit = (pr.get("unit") or "eur").lower()

    if "eur" in unit:
        curr = "EUR"
    elif "usd" in unit:
        curr = "USD"
    elif "mdl" in unit:
        curr = "MDL"
    else:
        curr = "EUR"

    try:
        return (Decimal(str(value or 0)), curr)
    except Exception:
        return (Decimal("0"), curr)


def derive_make_model_from_title(title: str) -> Tuple[str, str, str]:
    """
    Если не достали make/model из таблицы — пробуем вытащить из title.
    """
    if not title:
        return "", "", ""
    parts = title.strip().split()
    if not parts:
        return "", "", ""
    if len(parts) == 1:
        return parts[0], "", ""
    make = parts[0]
    model = " ".join(parts[1:])
    generation = ""
    return make, model, generation


def _extract_images(ad: Dict[str, Any], features: List[Dict[str, Any]], advert_id: str) -> List[str]:
    """
    Собираем фотки (API -> features -> HTML og:image).
    """
    imgs: List[str] = []

    def push(v: Union[str, Dict[str, Any]]):
        if isinstance(v, str) and v:
            imgs.append(v)
        elif isinstance(v, dict):
            for key in ("url", "path", "name", "filename", "file", "value", "src"):
                val = v.get(key)
                if isinstance(val, str) and val:
                    imgs.append(val)
                    return

    # 1) из ad["images"]
    if isinstance(ad.get("images"), list):
        for it in ad["images"]:
            push(it)

    # 2) из features (если есть блок картинок)
    if not imgs:
        for f in features:
            t = str(f.get("type", "")).lower()
            if t in ("upload_images", "images") or str(f.get("id")) in ("14", "images"):
                val = f.get("value")
                if isinstance(val, list):
                    for it in val:
                        push(it)
                else:
                    push(val)

    # 3) из HTML og:image и т.п.
    if not imgs:
        try:
            html = get_public_ad_html(advert_id, lang="ru")
            soup = BeautifulSoup(html, "html.parser")

            for m in soup.find_all("meta"):
                if m.get("property") in ("og:image", "og:image:secure_url"):
                    cval = m.get("content")
                    if cval:
                        imgs.append(cval)

            for el in soup.select("img, a"):
                for key in ("src", "data-src", "href"):
                    v = el.get(key)
                    if v and ("BoardImages" in v or "999.md" in v):
                        imgs.append(v)

            for script in soup.find_all("script"):
                txt = script.string or ""
                if not txt:
                    continue
                for m in re.findall(
                    r'(https?://[^\s"\']*?(?:BoardImages|999\.md)[^\s"\']*\.(?:jpg|jpeg|png))',
                    txt, flags=re.I
                ):
                    imgs.append(m)
        except Exception:
            pass

    # нормализуем урлы
    base_full = "https://i.simpalsmedia.com/999.md/BoardImages/900x900/"
    abs_urls: List[str] = []
    for s in imgs:
        s = str(s).strip()
        if s.startswith("http://") or s.startswith("https://"):
            abs_urls.append(s)
        else:
            abs_urls.append(base_full + s.lstrip("/"))

    # убираем дубликаты
    seen = set()
    uniq: List[str] = []
    for u in abs_urls:
        if u not in seen:
            seen.add(u)
            uniq.append(u)

    return uniq[:30]


# =========================
# SCRAPE публичной страницы 999.md
# =========================

def _has_class_part(el, needle_substr: str) -> bool:
    """
    Возвращает True если у тега есть класс, содержащий needle_substr.
    Например, needle_substr="group__row__" поймает styles_group__row__AbCdE
    """
    for cls in el.get("class", []):
        if needle_substr in cls:
            return True
    return False


def _scrape_public_html(advert_id: str) -> Dict[str, str]:
    """
    Достаём:
      - таблицу характеристик:
          Марка, Модель, Год выпуска, Количество мест,
          Тип кузова, Пробег, Объём двигателя, Мощность,
          Тип топлива, КПП, Привод, Цвет, Город
        Верстка бывает разная, поэтому:
          1) сначала ищем ряды, где класс содержит 'group__row__'
             внутри них ищем элемент классом содержащим 'group__key__'
             и элемент классом содержащим 'group__value__'
          2) fallback: ищем key-элементы по 'group__key__' и тянем value
      - мета price/valuta/title/description/og:image
    """

    result: Dict[str, str] = {}

    try:
        html = get_public_ad_html(advert_id, lang="ru")
    except Exception:
        return result

    soup = BeautifulSoup(html, "html.parser")

    # ---- META (цена и витрина) ----
    m_price = soup.find("meta", {"property": "product:price:amount"})
    if m_price and m_price.get("content"):
        result["price_amount"] = m_price.get("content").strip()

    m_curr = soup.find("meta", {"property": "product:price:currency"})
    if m_curr and m_curr.get("content"):
        result["currency"] = m_curr.get("content").strip()

    m_title = soup.find("meta", {"property": "og:title"})
    if m_title and m_title.get("content"):
        result["title"] = m_title.get("content").strip()

    m_desc = soup.find("meta", {"property": "og:description"})
    if m_desc and m_desc.get("content"):
        result["description"] = m_desc.get("content").strip()

    m_img = soup.find("meta", {"property": "og:image"})
    if m_img and m_img.get("content"):
        result["main_photo_url"] = m_img.get("content").strip()

    # ---- словарь синонимов ключей ----
    KEY_SYNONYMS = {
        "make": [
            "марка", "marcă", "marca", "марка автомобиля", "марка авто",
        ],
        "model": [
            "модель", "model", "модель авто", "modelul", "modelul авто",
        ],
        "year": [
            "год выпуска", "anul fabricației", "an fabricației",
            "anul fabricatiei", "an fabricatiei",
            "anul", "an",
        ],
        "seats": [
            "количество мест", "număr locuri", "numar locuri",
            "număr de locuri", "numar de locuri",
            "locuri", "кол-во мест", "мест",
        ],
        "body_type": [
            "тип кузова", "caroserie", "caroseria",
            "tip caroserie", "кузов",
        ],
        "mileage_km": [
            "пробег", "rulaj", "kilometraj",
        ],
        "engine_cc": [
            "объём двигателя", "объем двигателя", "capacitate motor",
            "capacitate cilindrică", "capacitate cilindrica",
            "capacitate", "cap. cilindrică", "cap. cilindrica",
        ],
        "power_hp": [
            "мощность", "putere", "cai putere",
            "putere (cp)", "мощность, л.с.", "мощность (л.с.)",
        ],
        "fuel_type": [
            "тип топлива", "топливо", "combustibil", "tip combustibil",
            "carburant", "combustibilul",
        ],
        "transmission": [
            "кпп", "коробка передач",
            "cutie de viteze", "cutie viteze",
            "transmisie", "cutie", "cutia",
        ],
        "drive": [
            "привод", "tracțiune", "tractiune",
            "tip tracțiune", "tip tractiune",
        ],
        "color": [
            "цвет", "culoare",
        ],
        "location_city": [
            "город", "oraș", "oras", "регион", "регион:",
        ],
    }

    inv_map: Dict[str, str] = {}
    for canon, syns in KEY_SYNONYMS.items():
        for s_text in syns:
            inv_map[s_text.lower().strip(" :")] = canon

    pairs: List[Tuple[str, str]] = []

    # pass 1: искать строки-характеристики по row-контейнеру
    for row in soup.find_all(lambda tag: _has_class_part(tag, "group__row__")):
        key_el = None
        val_el = None

        # ищем внутри row элементы с классами содержащими 'group__key__' и 'group__value__'
        for child in row.find_all(recursive=False):
            if _has_class_part(child, "group__key__"):
                key_el = child
            if _has_class_part(child, "group__value__"):
                val_el = child

        # иногда value лежит глубже
        if val_el is None:
            cand = row.find(lambda t: _has_class_part(t, "group__value__"))
            if cand:
                val_el = cand

        # иногда key лежит глубже
        if key_el is None:
            cand = row.find(lambda t: _has_class_part(t, "group__key__"))
            if cand:
                key_el = cand

        if not key_el or not val_el:
            continue

        raw_label = key_el.get_text(" ", strip=True)
        raw_value = val_el.get_text(" ", strip=True)

        if raw_label and raw_value:
            pairs.append((raw_label, raw_value))

    # pass 2 (fallback): если вдруг что-то не нашлось через row,
    # пройдём напрямую по ключам
    if not pairs:
        for key_el in soup.find_all(lambda tag: _has_class_part(tag, "group__key__")):
            raw_label = key_el.get_text(" ", strip=True)
            if not raw_label:
                continue

            # value может быть соседом или во всём родителе
            parent = key_el.parent
            val_el = None

            # прямые дети родителя
            for child in parent.find_all(recursive=False):
                if _has_class_part(child, "group__value__"):
                    val_el = child
                    break

            # соседи
            if not val_el:
                sib = key_el.next_sibling
                while sib and not val_el:
                    if getattr(sib, "get", None) and _has_class_part(sib, "group__value__"):
                        val_el = sib
                        break
                    sib = sib.next_sibling

            # любой потомок
            if not val_el:
                cand = parent.find(lambda t: _has_class_part(t, "group__value__"))
                if cand:
                    val_el = cand

            if not val_el:
                continue

            raw_value = val_el.get_text(" ", strip=True)
            if raw_value:
                pairs.append((raw_label, raw_value))

    # теперь мапим пары в канонические имена
    for (label, value) in pairs:
        norm_label = label.lower().strip(" :")
        canon_key = inv_map.get(norm_label)
        if canon_key and value:
            # setdefault чтобы первое встреченное значение победило
            result.setdefault(canon_key, value.strip())

    return result


# =========================
# reconcile_logic
# =========================

def reconcile_logic(
    fuel_code_in: str,
    transm_code_in: str,
    year_in: Optional[int],
    *,
    title_text: str,
    body_text: str,
    make: str = "",
    model: str = "",
    fuel_source: str = "unknown",  # "html" или "api"
) -> Tuple[str, str, Optional[int]]:
    """
    Логика доуточнения:
    1) Если топливо пришло из HTML и успешно распознано (не "other"):
         НЕ трогаем вообще (доверяем объявлению).
    2) Если топлива нет / "other" / это только API:
         пытаемся угадать (diesel vs petrol для PHEV, EV и т.д.)
    3) Для гибридов/электро → коробка точно не manual/other/robot → ставим automatic
    4) Если нет года → ищем год в тексте
    """

    fuel_code = fuel_code_in or ""
    transm_code = transm_code_in or ""
    year_val = year_in
    full_txt = f"{title_text} {body_text}".lower()

    need_refine = False
    # если источник не html -> можем улучшать
    if fuel_source != "html":
        need_refine = True
    # даже если html, но код пустой или other -> надо улучшить
    if (not fuel_code) or (fuel_code == "other"):
        need_refine = True

    if need_refine:
        guess = infer_fuel_from_text(title_text, body_text, make=make, model=model)
        if guess:
            fuel_code = guess

        # уточнение phev diesel / petrol по тексту
        mb = _mercedes_phev_badge_looks_diesel(title_text, make, model)
        if mb is True:
            fuel_code = "phev_diesel"
        elif mb is False:
            if (
                "plug" in full_txt
                or "phev" in full_txt
                or "плагин" in full_txt
            ):
                # только если явно сказано "e", без "de"
                fuel_code = "phev_petrol"

        if fuel_code.startswith("phev_") or (
            "plug" in full_txt or "phev" in full_txt or "плагин" in full_txt
        ):
            diesel_words = [
                "diesel", "dizel", "дизел", "дизель",
                "motorină", "motorina", "motorin",
                "tdi", "cdi", "bluetec", "bluehdi", "hdi",
                "multijet", "blue dci",
            ]
            petrol_words = [
                "benzin", "бензин", "benzina", "benzină",
                "gasoline", "petrol", "tsi", "tfsi", "mpi",
                "ecoboost", "tjet", "t-jet", "gdi", "tgdi", "t-gdi",
            ]
            d_hit = any(w in full_txt for w in diesel_words)
            p_hit = any(w in full_txt for w in petrol_words)

            if d_hit and not p_hit:
                fuel_code = "phev_diesel"
            elif p_hit and not d_hit:
                fuel_code = "phev_petrol"
            elif d_hit and p_hit:
                fuel_code = "phev_diesel"

    # гибриды / электро → коробка точно не "manual"/"other"/"robot"
    if fuel_code in (
        "hybrid",
        "electric",
        "phev_petrol",
        "phev_diesel",
        "mhev_petrol",
        "mhev_diesel",
    ):
        if transm_code in ("manual", "robot", "other", ""):
            transm_code = "automatic"

    # если год пустой — пытаемся вытащить из текста
    if not year_val or year_val == 0:
        y_from_txt = parse_year_from_text(title_text) or parse_year_from_text(body_text)
        if y_from_txt:
            year_val = y_from_txt

    return fuel_code, transm_code, year_val


from django.utils import timezone
from django.db import transaction
from app.cars.models import Car, Photo

# =========================
# upsert_car_from_999
# =========================

@transaction.atomic
def upsert_car_from_999(advert_id: str, seen_at: timezone.datetime | None = None) -> Car:
    """
    Импорт / апсерт одной машины с 999.md.

    ВАЖНО:
    - seen_at -> отметка синхронизации (один и тот же timestamp для всей синхры)
      мы пишем её в Car.last_seen_at
    - active всегда True (если объявление найдено на 999 сейчас)
    - sold_at сбрасываем в None (если тачка вдруг вернулась в актив)
    """

    if seen_at is None:
        seen_at = timezone.now()

    # ---------- 1. API ----------
    ad = get_advert(advert_id, lang=LANG)
    feat_resp = _get_features_with_retry(advert_id)
    features = flatten_features(feat_resp)

    def get_text_from_features(key: str) -> str:
        return to_text(find_feature_value(features, FEATURE_MAP[key]))

    # ---------- 2. HTML ----------
    page_data = _scrape_public_html(advert_id)

    def pick_spec(key: str) -> str:
        v_html = page_data.get(key, "")
        if v_html:
            return v_html
        return get_text_from_features(key)

    # ---------- 3. Базовое инфо ----------
    title_text = (page_data.get("title") or ad.get("title") or "").strip()
    body_text = (page_data.get("description") or ad.get("body") or "").strip()

    make = page_data.get("make") or get_text_from_features("make")
    model = page_data.get("model") or get_text_from_features("model")
    generation = get_text_from_features("generation")

    # fallback марка/модель из title
    if title_text:
        dm, mdl, gen = derive_make_model_from_title(title_text)
        if not make:
            make = dm
        if not model:
            model = mdl
        if not generation:
            generation = gen

    # ---------- 4. Хар-ки авто ----------
    registration_country = get_text_from_features("registration_country")
    condition_raw = get_text_from_features("condition")
    availability_raw = get_text_from_features("availability")
    origin_country = get_text_from_features("origin_country")

    year_raw = pick_spec("year")
    year_val = extract_numeric(year_raw)

    seats_val = extract_numeric(pick_spec("seats"))
    body_type_norm = norm_body(pick_spec("body_type"))

    mileage_km_val = extract_numeric(pick_spec("mileage_km")) or 0

    engine_cc_raw = pick_spec("engine_cc")
    engine_cc_val = parse_engine_cc(engine_cc_raw)

    power_raw = pick_spec("power_hp")
    power_hp_val = extract_numeric(power_raw)
    if power_hp_val is None:
        power_hp_val = kw_to_hp_kwstr(power_raw)

    # топливо
    fuel_raw_html = page_data.get("fuel_type")
    fuel_raw_api = get_text_from_features("fuel_type")
    if fuel_raw_html:
        fuel_raw = fuel_raw_html
        fuel_source = "html"
    else:
        fuel_raw = fuel_raw_api
        fuel_source = "api"

    fuel_code = normalize_fuel_code(fuel_raw)
    fuel_label_text = FUEL_LABELS.get(fuel_code, "Другое")

    # кпп
    transmission_raw = (
        page_data.get("transmission")
        or get_text_from_features("transmission")
        or ad.get("transmission")
        or ""
    )
    transm_code = normalize_transmission_code(transmission_raw)
    transm_label_text = TRANSMISSION_LABELS.get(transm_code, "Другое")

    # привод
    drive_norm = norm_drive(pick_spec("drive"))

    # цвет / город
    color_val = pick_spec("color")
    location_city_val = pick_spec("location_city")

    # ---------- 5. доуточнить топливо / кпп / год
    fuel_code, transm_code, year_val = reconcile_logic(
        fuel_code_in=fuel_code,
        transm_code_in=transm_code,
        year_in=year_val,
        title_text=title_text,
        body_text=body_text,
        make=make,
        model=model,
        fuel_source=fuel_source,
    )

    # пересчитать лейблы после уточнения
    fuel_label_text = FUEL_LABELS.get(fuel_code, fuel_label_text)
    transm_label_text = TRANSMISSION_LABELS.get(transm_code, transm_label_text)

    # ---------- 6. Цена ----------
    price_amount_raw = page_data.get("price_amount", "")
    currency_val = (page_data.get("currency") or "").upper()

    price_eur_val: Decimal | None = None
    if price_amount_raw:
        try:
            clean_num = re.sub(r"[^\d.]", "", str(price_amount_raw))
            if clean_num:
                price_eur_val = Decimal(clean_num)
        except Exception:
            price_eur_val = None

    if not price_eur_val:
        api_price_val, api_curr = extract_price_from_api(ad)
        price_eur_val = api_price_val
        if not currency_val:
            currency_val = api_curr

    if not currency_val:
        currency_val = "EUR"

    # ---------- 7. Фото ----------
    images = _extract_images(ad, features, advert_id)
    main_photo_url = page_data.get("main_photo_url") or (images[0] if images else "")

    # ---------- 8. Безопасное обрезание строк
    make = caplen("make", make or "")
    model = caplen("model", model or "")
    generation = caplen("generation", generation or "")

    registration_country = caplen("registration_country", registration_country or "")
    origin_country = caplen("origin_country", origin_country or "")

    body_type_norm = caplen("body_type", body_type_norm or "")
    drive_norm = caplen("drive", drive_norm or "")

    fuel_code = caplen("fuel_type_code", fuel_code or "")
    fuel_label_text = caplen("fuel_type_label", fuel_label_text or "")

    transm_code = caplen("transmission_code", transm_code or "")
    transm_label_text = caplen("transmission_label", transm_label_text or "")

    title_text = caplen("title", title_text or (f"{make} {model}".strip()))
    body_text = body_text or ""
    color_val = caplen("color", color_val or "")
    location_city_val = caplen("location_city", location_city_val or "")
    main_photo_url = caplen("main_photo_url", main_photo_url or "")

    # ---------- 9. Запись в БД ----------
    first_registration_val = None  # пока точной даты нет

    now_ts = timezone.now()

    car, _created = Car.objects.update_or_create(
        external_id=str(advert_id),
        defaults=dict(
            source="999",

            make=make,
            model=model,
            generation=generation,

            year=year_val,
            first_registration=first_registration_val,
            seats=seats_val,
            body_type=body_type_norm,
            mileage_km=mileage_km_val,
            engine_cc=engine_cc_val,
            power_hp=power_hp_val,

            fuel_type_code=fuel_code,
            fuel_type_label=fuel_label_text,
            fuel_type_raw=(fuel_raw or ""),

            transmission_code=transm_code,
            transmission_label=transm_label_text,
            transmission_raw=(transmission_raw or ""),

            drive=drive_norm,

            registration_country=registration_country,
            origin_country=origin_country,
            condition=norm_condition(condition_raw),
            availability=norm_availability(availability_raw),
            location_city=location_city_val,

            price_eur=price_eur_val,
            currency=currency_val,

            title=title_text,
            description=body_text,
            color=color_val,

            # витрина
            main_photo_url=main_photo_url,

            # статусная часть
            status="published",
            active=True,                # <-- объявление считается активным
            last_seen_at=seen_at,       # <-- мы видели это объявление в этом цикле синка
            sold_at=None,               # <-- если вдруг тачка вернулась, снимаем sold_at

            updated_at=now_ts,
        ),
    )

    # ---------- 10. Фото ----------
    Photo.objects.filter(car=car).delete()
    for idx, img in enumerate(images[:30]):
        Photo.objects.create(
            car=car,
            image_url=img,
            sort_order=idx,
            is_primary=(idx == 0),
        )

    if PER_ADVERT_SLEEP > 0:
        time.sleep(PER_ADVERT_SLEEP)

    return car


# =========================
# Массовый импорт (без архивирования)
# =========================

def sync_all_from_999(page_size: int = 25, max_items: Optional[int] = None) -> int:
    """
    Простой импорт без деактивации отсутствующих.
    Оставляем на случай отладки.
    """
    page = 1
    imported = 0
    processed_total = 0

    # один timestamp для всего запуска
    sync_started_at = timezone.now()

    while True:
        data = get_adverts(page=page, page_size=page_size, states=STATES, lang=LANG)
        adverts = data.get("adverts", [])
        if not adverts:
            break

        for a in adverts:
            subcat = ((a.get("categories") or {}).get("subcategory") or {}).get("id")
            if str(subcat) != "659":
                continue

            advert_id = a.get("id")
            if not advert_id:
                continue

            upsert_car_from_999(str(advert_id), seen_at=sync_started_at)
            imported += 1
            processed_total += 1

            if max_items and processed_total >= max_items:
                return imported

        if PER_PAGE_SLEEP > 0:
            time.sleep(PER_PAGE_SLEEP)

        subtotal = data.get("subtotal") or 0
        current_ps = data.get("page_size") or page_size
        if page * current_ps >= subtotal:
            break

        page += 1

    return imported


# =========================
# Массовый импорт с авто-архивацией исчезнувших
# =========================

def sync_all_from_999_with_archive(page_size: int = 25, max_items: Optional[int] = None) -> dict:
    """
    Полная синхронизация стока:
    - обходим активные объявления на 999.md (subcategory 659),
    - каждое апсертим/обновляем:
        * active=True
        * last_seen_at=<один и тот же sync timestamp>
        * sold_at=None
    - собираем set всех external_id, которые встретили
    - после обхода:
        * все машины source='999', которые НЕ попали в set,
          помечаем как неактивные:
              active=False
              status="archived"
              sold_at=now()
          (то есть они ушли с 999.md -> больше не показываем на сайте)

    Возвращаем статистику:
    {
        "imported": <сколько мы сейчас апсертнули/обновили>,
        "archived": <сколько мы деактивировали>,
        "active_seen": <сколько уникальных объявлений реально увидели на 999>
    }
    """

    sync_started_at = timezone.now()
    seen_ids: set[str] = set()

    page = 1
    imported = 0
    processed_total = 0

    while True:
        data = get_adverts(page=page, page_size=page_size, states=STATES, lang=LANG)
        adverts = data.get("adverts", [])
        if not adverts:
            break

        for a in adverts:
            subcat = ((a.get("categories") or {}).get("subcategory") or {}).get("id")
            # берём только легковые: subcategory.id == 659
            if str(subcat) != "659":
                continue

            advert_id = a.get("id")
            if not advert_id:
                continue

            advert_id = str(advert_id)

            # апсерт машины (эта функция сама ставит active=True и last_seen_at=sync_started_at)
            upsert_car_from_999(advert_id, seen_at=sync_started_at)

            imported += 1
            processed_total += 1
            seen_ids.add(advert_id)

            if max_items and processed_total >= max_items:
                break

        if max_items and processed_total >= max_items:
            break

        if PER_PAGE_SLEEP > 0:
            time.sleep(PER_PAGE_SLEEP)

        subtotal = data.get("subtotal") or 0
        current_ps = data.get("page_size") or page_size
        if page * current_ps >= subtotal:
            break

        page += 1

    # ---------- DEACTIVATE / ARCHIVE отсутствующие ----------
    # все объявы source="999", которые НЕ попали в seen_ids при этом прогоне,
    # считаем что они ушли с 999 -> больше не показываем на сайте
    now_ts = timezone.now()
    archived_qs = (
        Car.objects
        .filter(source="999", active=True)
        .exclude(external_id__in=list(seen_ids))
    )

    archived_count = archived_qs.update(
        active=False,
        status="archived",
        sold_at=now_ts,
        updated_at=now_ts,
    )

    return {
        "imported": imported,
        "archived": archived_count,
        "active_seen": len(seen_ids),
    }


