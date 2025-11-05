from django.core.management.base import BaseCommand
from app.cars.models import Car


def looks_automatic(raw: str) -> bool:
    """
    Грубая эвристика: по исходной строке из объявления похоже на автомат?
    """
    if not raw:
        return False
    s = raw.lower()
    keys = [
        "automat", "automată", "automata", "автомат",
        "dsg",
        "cvt", "variator", "вариатор",
        "robot", "робот",
        "tiptronic", "steptronic",
    ]
    return any(k in s for k in keys)


def looks_manual(raw: str) -> bool:
    """
    Похоже на механику?
    """
    if not raw:
        return False
    s = raw.lower()
    keys = [
        "manual", "manuală", "manuala", "мех", "mechanic",
        "schimbător manual", "cutie manuală",
    ]
    return any(k in s for k in keys)


def guess_fuel(raw: str) -> str | None:
    """
    Попробовать угадать тип топлива (наш внутренний код),
    исходя из сырого текста, который пришёл с 999.
    Возвращаем один из наших fuel_type_code:
      petrol / diesel / lpg_propane / cng_methane / hybrid /
      electric / phev_petrol / phev_diesel / mhev_petrol / mhev_diesel
    или None если не можем угадать.
    """
    if not raw:
        return None
    s = raw.lower()

    # plug-in гибриды / phev
    if "plug" in s or "plug-in" in s or "plugin" in s or "phev" in s:
        if "diesel" in s or "diz" in s or "motorin" in s:
            return "phev_diesel"
        return "phev_petrol"

    # мягкий гибрид / mhev
    if "mhev" in s or "mild" in s:
        if "diesel" in s or "diz" in s or "motorin" in s:
            return "mhev_diesel"
        return "mhev_petrol"

    # просто гибрид
    if "hybrid" in s or "hibrid" in s or "гибрид" in s or "hev" in s:
        return "hybrid"

    # чисто электрическая
    if (
        "elect" in s
        or s.strip() in ("ev", "full electric", "electric")
        or "100% electric" in s
    ):
        return "electric"

    # дизель
    if "diesel" in s or "diz" in s or "motorin" in s:
        return "diesel"

    # бензин
    if "benzin" in s or "benzina" in s or "gasoline" in s or "petrol" in s:
        return "petrol"

    # газ
    if "lpg" in s or "gaz" in s or "gas / benz" in s or "gas/benz" in s:
        # различить метан / пропан
        if "metan" in s or "cng" in s or "methane" in s:
            return "cng_methane"
        return "lpg_propane"

    return None


def is_hybridish(code: str) -> bool:
    """
    Группа топлив, которые по жизни не бывают на чистой механике:
    гибриды, плагин-гибриды, мягкие гибриды, чистый электромобиль.
    """
    return code in (
        "electric",
        "hybrid",
        "phev_petrol",
        "phev_diesel",
        "mhev_petrol",
        "mhev_diesel",
    )


class Command(BaseCommand):
    help = "Показать подозрительные машины, где КПП/топливо могут быть записаны неверно"

    def handle(self, *args, **options):
        bad_rows = []

        # обойдём все машины
        for car in Car.objects.all().order_by("id"):
            # что лежит у нас сейчас
            trans_code = (car.transmission_code or "").strip()
            trans_label = (car.transmission_label or "").strip()
            trans_raw = (car.transmission_raw or "").strip()

            fuel_code = (car.fuel_type_code or "").strip()
            fuel_label = (car.fuel_type_label or "").strip()
            fuel_raw = (car.fuel_type_raw or "").strip()

            # ---------- Проверка КПП ----------
            raw_says_auto = looks_automatic(trans_raw)
            raw_says_manual = looks_manual(trans_raw)

            trans_suspect = False
            trans_reason_parts = []

            # raw явно говорит "автомат", а у нас не automatic
            if raw_says_auto and trans_code != "automatic":
                trans_suspect = True
                trans_reason_parts.append(
                    "RAW намекает на автомат, но в БД не automatic"
                )

            # raw явно говорит "механика", а у нас automatic
            if raw_says_manual and trans_code == "automatic":
                trans_suspect = True
                trans_reason_parts.append(
                    "RAW намекает на механику, но в БД automatic"
                )

            # у нас 'other' (или пусто), но из raw можно что-то понять
            if (trans_code in ("other", "")) and (raw_says_auto or raw_says_manual):
                trans_suspect = True
                trans_reason_parts.append(
                    "В БД 'other', но RAW даёт тип КПП"
                )

            # гибрид/электро не должен быть manual/other
            if is_hybridish(fuel_code) and trans_code in ("manual", "other"):
                trans_suspect = True
                trans_reason_parts.append(
                    "Гибрид/электро не должен быть manual/other"
                )

            # ---------- Проверка топлива ----------
            fuel_guess = guess_fuel(fuel_raw)

            fuel_suspect = False
            fuel_reason_parts = []

            # raw говорит одно, в БД совсем другое
            if fuel_guess and fuel_guess != fuel_code:
                fuel_suspect = True
                fuel_reason_parts.append(
                    f"RAW топливо похоже на {fuel_guess}, но в БД {fuel_code or 'пусто'}"
                )

            # у нас топлива нет, но raw есть
            if not fuel_code and fuel_raw:
                fuel_suspect = True
                fuel_reason_parts.append(
                    "В БД пусто fuel_type_code, но fuel_raw заполнен"
                )

            # если обе проверки чистые — пропускаем эту машину
            if not trans_suspect and not fuel_suspect:
                continue

            bad_rows.append({
                "id": car.id,
                "external_id": car.external_id,
                "title": car.title,
                "make": car.make,
                "model": car.model,
                "year_display": (
                    car.year if car.year else (car.first_registration.year if car.first_registration else None)
                ),

                "transmission_code": trans_code,
                "transmission_label": trans_label,
                "transmission_raw": trans_raw,
                "trans_reason": " / ".join(trans_reason_parts) if trans_reason_parts else "",

                "fuel_type_code": fuel_code,
                "fuel_type_label": fuel_label,
                "fuel_type_raw": fuel_raw,
                "fuel_guess": fuel_guess or "",
                "fuel_reason": " / ".join(fuel_reason_parts) if fuel_reason_parts else "",
            })

        if not bad_rows:
            self.stdout.write("✅ Подозрительных записей не найдено.")
            return

        self.stdout.write("⚠ Найдены подозрительные записи:\n")
        for row in bad_rows:
            self.stdout.write(
                (
                    "ID {id} | external {external_id} | {make} {model} ({year_display})\n"
                    "  КПП: code='{transmission_code}' label='{transmission_label}' raw='{transmission_raw}'\n"
                    "       -> {trans_reason}\n"
                    "  Топливо: code='{fuel_type_code}' label='{fuel_type_label}' raw='{fuel_type_raw}' guess='{fuel_guess}'\n"
                    "       -> {fuel_reason}\n"
                    "  Заголовок: {title}\n"
                    "────────────────────────────────────────────────────"
                ).format(**row)
            )
