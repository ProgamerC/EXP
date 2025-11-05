# app/cars/fuel.py

from typing import Dict

# ЕДИНАЯ таблица кодов топлива (10 типов 999.md) + "other"
# Храним КОДЫ в БД, метками управляем здесь/на фронте.
FUEL_CODES = [
    "petrol",          # Бензин
    "diesel",          # Дизель
    "lpg_propane",     # Газ / Бензин (пропан)
    "cng_methane",     # Газ / Бензин (метан)
    "hybrid",          # Гибрид
    "electric",        # Электричество
    "phev_petrol",     # Плагин-гибрид (бензин)
    "phev_diesel",     # Плагин-гибрид (дизель)
    "mhev_petrol",     # Мягкий-гибрид (бензин)
    "mhev_diesel",     # Мягкий-гибрид (дизель)
    "other",           # Другое (страховочная категория)
]

# Метки по умолчанию (RU). При желании можно локализовать по LANG.
FUEL_LABELS_RU: Dict[str, str] = {
    "petrol": "Бензин",
    "diesel": "Дизель",
    "lpg_propane": "Газ/Бензин (пропан)",
    "cng_methane": "Газ/Бензин (метан)",
    "hybrid": "Гибрид",
    "electric": "Электро",
    "phev_petrol": "Плагин-гибрид (бензин)",
    "phev_diesel": "Плагин-гибрид (дизель)",
    "mhev_petrol": "Мягкий гибрид (бензин)",
    "mhev_diesel": "Мягкий гибрид (дизель)",
    "other": "Другое",
}

def fuel_label(code: str) -> str:
    return FUEL_LABELS_RU.get((code or "").strip().lower(), "Другое")
