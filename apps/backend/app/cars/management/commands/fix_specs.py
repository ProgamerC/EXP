from django.core.management.base import BaseCommand
from app.cars.models import Car
import re, datetime

def parse_year_from_text(s: str) -> int | None:
    if not s:
        return None
    m = re.search(r'(19[6-9]\d|20[0-4]\d)', s)
    if not m:
        return None
    try:
        y = int(m.group(1))
        this_year = datetime.datetime.now().year
        if 1960 <= y <= this_year + 1:
            return y
    except Exception:
        pass
    return None

def is_hybrid_by_model(make: str, model: str, text: str = "") -> bool:
    mk = (make or "").strip().lower()
    md = (model or "").strip().lower()
    t  = (text or "").lower()
    if any(k in t for k in ["phev", "plug-in", "plugin", "plug in"]): return True
    if mk == "toyota" and (md in {"c-hr","chr","prius"} or any(k in t for k in ["hybrid","гибрид","hibrid"])): return True
    if mk == "mitsubishi" and "outlander" in md and any(k in t for k in ["phev","plug"]): return True
    if mk == "kia" and "niro" in md: return True
    if mk == "hyundai" and "ioniq" in md: return True
    if mk == "bmw" and re.search(r"\b\d{2,3}[eE]\b|\b(40e|45e)\b", md + " " + t): return True
    return False

class Command(BaseCommand):
    help = "Normalize fuel/transmission/year for existing cars from 999 (no network calls)."

    def add_arguments(self, parser):
        parser.add_argument("--ids", type=str, help="Comma-separated DB IDs; if omitted, fixes all with source='999'.")

    def handle(self, *args, **opts):
        if opts.get("ids"):
            ids = [int(x.strip()) for x in opts["ids"].split(",") if x.strip().isdigit()]
            qs = Car.objects.filter(id__in=ids)
        else:
            qs = Car.objects.filter(source="999")

        fixed = 0
        for c in qs:
            orig = (c.fuel_type, c.transmission, c.year)
            t = (f"{c.title or ''} {c.description or ''}").lower()

            # fuel_type из модели/текста, если 'other'/пусто
            if (not c.fuel_type) or (c.fuel_type == "other"):
                if is_hybrid_by_model(c.make, c.model, t):
                    c.fuel_type = "hybrid"
                elif "elect" in t:
                    c.fuel_type = "electric"

            # EV/Hybrid → автомат, если было manual/robot/пусто
            if c.fuel_type in ("electric", "hybrid") and c.transmission in ("manual", "robot", None, ""):
                c.transmission = "automatic"

            # Год: если 0/None, берём из текста
            if not c.year or c.year == 0:
                y = parse_year_from_text(c.title or "") or parse_year_from_text(c.description or "")
                c.year = y or None

            if (c.fuel_type, c.transmission, c.year) != orig:
                c.save(update_fields=["fuel_type", "transmission", "year"])
                fixed += 1

        self.stdout.write(self.style.SUCCESS(f"Fixed {fixed} cars."))
