import json
from typing import Any, Dict, Tuple, Optional

from django.core.management.base import BaseCommand, CommandError
from app.cars.models import Car
from app.cars.serializers import CarSerializer
from app.cars.services.import_999 import (
    get_advert,
    _get_features_with_retry,
    flatten_features,
    find_feature_value,
    FEATURE_MAP,
    to_text,
    _extract_specs_from_html,
    extract_numeric,
    kw_to_hp_kwstr,
    norm_fuel,
    _pick_transmission_raw,
    norm_transmission,
    parse_year_from_text,
)

def _json(obj: Any) -> str:
    return json.dumps(obj, ensure_ascii=False, indent=2)

class Command(BaseCommand):
    help = "Показать детальный разбор конкретной машины: БД vs данные 999.md"

    def add_arguments(self, parser):
        parser.add_argument(
            "--id",
            type=int,
            help="internal Car.id",
        )
        parser.add_argument(
            "--external",
            type=str,
            help="external_id (999.md id)",
        )

    def handle(self, *args, **options):
        internal_id = options.get("id")
        external_id = options.get("external")

        car_obj: Optional[Car] = None
        if internal_id:
            try:
                car_obj = Car.objects.get(id=internal_id)
            except Car.DoesNotExist:
                raise CommandError(f"Car id={internal_id} not found")
            advert_id = car_obj.external_id
        elif external_id:
            try:
                car_obj = Car.objects.get(external_id=external_id)
            except Car.DoesNotExist:
                car_obj = None
            advert_id = external_id
        else:
            raise CommandError("Укажи --id или --external")

        # 0. что в БД
        if car_obj:
            db_info = {
                "db.id": car_obj.id,
                "db.external_id": car_obj.external_id,
                "db.make": car_obj.make,
                "db.model": car_obj.model,
                "db.fuel_type": car_obj.fuel_type,
                "db.transmission": car_obj.transmission,
                "db.year": car_obj.year,
            }
        else:
            db_info = {"note": "в БД такой машины нет"}

        print("\n========== [Шаг 0] Текущее состояние в БД ==========")
        print(_json(db_info))

        # 1. advert от 999
        ad = get_advert(advert_id)
        ad_info = {
            "ad.id": str(ad.get("id")),
            "ad.title": ad.get("title"),
            "ad.transmission": ad.get("transmission"),
            "ad.fuel_type?": ad.get("fuel_type"),
            "ad.price": ad.get("price"),
        }
        print("\n========== [Шаг 1] API 999: advert ==========")
        print(_json(ad_info))

        # 2. features от 999 (API)
        feat_resp = _get_features_with_retry(advert_id)
        features_list = flatten_features(feat_resp)

        def _get_txt_api(key: str) -> str:
            return to_text(find_feature_value(features_list, FEATURE_MAP[key]))

        features_simple = {
            "make": _get_txt_api("make"),
            "model": _get_txt_api("model"),
            "generation": _get_txt_api("generation"),
            "fuel_type": _get_txt_api("fuel_type"),
            "transmission": _get_txt_api("transmission"),
            "drive": _get_txt_api("drive"),
            "year": _get_txt_api("year"),
            "body_type": _get_txt_api("body_type"),
            "power_hp": _get_txt_api("power_hp"),
            "engine_cc": _get_txt_api("engine_cc"),
            "mileage_km": _get_txt_api("mileage_km"),
        }
        print("\n========== [Шаг 2] API 999: features (плоские) ==========")
        print(_json(features_simple))

        # 3. HTML разбор
        html_specs = _extract_specs_from_html(advert_id)

        html_dbg = dict(html_specs)
        if "_fulltext" in html_dbg and len(html_dbg["_fulltext"]) > 300:
            html_dbg["_fulltext"] = html_dbg["_fulltext"][:300] + "…"

        print("\n========== [Шаг 3] HTML-страница объявления (вытяжка спецификаций) ==========")
        print(_json(html_dbg))

        # 4. нормализация как в импортёре
        fuel_raw = features_simple["fuel_type"] or html_specs.get("fuel_type", "") or (ad.get("fuel_type") or "")
        fuel_norm = norm_fuel(fuel_raw)

        src_trans_raw, transmission_raw = _pick_transmission_raw(
            ad,
            {"transmission": features_simple["transmission"]},
            html_specs,
        )
        transmission_norm = norm_transmission(transmission_raw)

        year_val = extract_numeric(features_simple["year"]) or extract_numeric(html_specs.get("year"))
        if not year_val:
            title_api = ad.get("title") or ""
            body_text = ad.get("body") or ""
            year_val = parse_year_from_text(title_api) or parse_year_from_text(body_text)

        calc_info = {
            "fuel_type_raw": fuel_raw,
            "fuel_type_norm": fuel_norm,
            "transmission_raw_source": src_trans_raw,
            "transmission_raw": transmission_raw,
            "transmission_norm": transmission_norm,
            "calc_year": year_val,
        }
        print("\n========== [Шаг 4] Сбор сырых значений и нормализация ==========")
        print(_json(calc_info))

        # 5. что реально уйдёт на фронт
        if car_obj:
            ser = CarSerializer(car_obj).data
        else:
            ser = {"note": "car not in DB, serializer skip"}

        out = {
            "frontend.fuel_type": ser.get("fuel_type"),
            "frontend.fuel_type_label": ser.get("fuel_type_label"),
            "frontend.transmission": ser.get("transmission"),
            "frontend.transmission_label": ser.get("transmission_label"),
        }

        print("\n========== [Шаг 5] Что сейчас отдаём на фронт ==========")
        print(_json(out))

        print("\nГотово. Если fuel_type_norm != frontend.fuel_type или КПП не совпадает — значит импорт нужно чинить дальше.")
