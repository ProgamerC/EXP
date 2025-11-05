# app/cars/utils/fuel.py
import re

CANON = {
    "petrol": "petrol",
    "gasoline": "petrol",
    "benzin": "petrol",
    "benzina": "petrol",
    "gas": "petrol",  # atenție: nu LPG
    "diesel": "diesel",
    "electric": "electric",
    "ev": "electric",
    "lpg": "lpg",
    "cng": "cng",
    "hybrid": "hybrid_petrol",         # fallback
    "hybrid petrol": "hybrid_petrol",
    "petrol hybrid": "hybrid_petrol",
    "mhev": "hybrid_petrol",
    "phev": "phev_petrol",
    "plug-in hybrid": "phev_petrol",
    "plugin hybrid": "phev_petrol",
    "hybrid diesel": "hybrid_diesel",
    "diesel hybrid": "hybrid_diesel",
    "phev diesel": "phev_diesel",
    "plug-in hybrid diesel": "phev_diesel",
    "hydrogen": "hydrogen",
}

CHOICES = (
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
)

def normalize_fuel(raw: str) -> str:
    if not raw:
        return ""
    s = raw.strip().lower()
    s = re.sub(r"[_\-]+", " ", s)
    s = re.sub(r"\s+", " ", s)

    # detect patterns
    if "plug" in s and "hybrid" in s:
        if "diesel" in s:
            return "phev_diesel"
        return "phev_petrol"

    if "hybrid" in s:
        if "diesel" in s:
            return "hybrid_diesel"
        return "hybrid_petrol"

    # direct hits
    for k, v in CANON.items():
        if k in s:
            return v

    # diesel/petrol simple
    if "diesel" in s:
        return "diesel"
    if any(x in s for x in ("benz", "petrol", "gasoline")):
        return "petrol"

    if "electric" in s or s in ("ev",):
        return "electric"
    if "lpg" in s:
        return "lpg"
    if "cng" in s:
        return "cng"
    if "hydrogen" in s or "h2" in s:
        return "hydrogen"

    return ""
