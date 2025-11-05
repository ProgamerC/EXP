from rest_framework import serializers
from app.cars.models import Car, Photo


def body_type_human(code: str) -> str:
    """
    Преобразуем внутренний код кузова в человекочитаемую метку.
    Эти строки идут прямо на фронт.
    """
    mapping = {
        "sedan": "Седан",
        "hatchback": "Хэтчбек",
        "wagon": "Универсал",
        "suv": "Кроссовер",
        "coupe": "Купе",
        "cabrio": "Кабриолет",
        "minivan": "Минивэн",
        "pickup": "Пикап",
        "van": "Фургон",
        "other": "Другое",
        None: "Другое",
        "": "Другое",
    }
    return mapping.get(code, "Другое")


# ADDED: etichete unificate după canonical (RO — poți schimba ulterior pe RU)
FUEL_LABELS_RO = {
    "petrol": "Benzină",
    "diesel": "Motorină",
    "hybrid_petrol": "Hibrid (Benzină)",
    "hybrid_diesel": "Hibrid (Motorină)",
    "phev_petrol": "Plug-in Hybrid (Benzină)",
    "phev_diesel": "Plug-in Hybrid (Motorină)",
    "electric": "Electric",
    "lpg": "GPL",
    "cng": "CNG",
    "hydrogen": "Hidrogen",
}


def fuel_display_from(obj: Car) -> str:
    """
    ADDED: Afișaj coerent pentru combustibil:
    - preferă canonical -> label uman din FUEL_LABELS_RO
    - fallback la fuel_type_label/code/raw dacă lipsesc
    """
    canon = (getattr(obj, "fuel_type_canonical", "") or "").strip()
    if canon and canon in FUEL_LABELS_RO:
        return FUEL_LABELS_RO[canon]
    return (
        (obj.fuel_type_label or "").strip()
        or (obj.fuel_type_code or "").strip()
        or (obj.fuel_type_raw or "").strip()
        or ""
    )


class CarListSerializer(serializers.ModelSerializer):
    """
    Лёгкая версия для списка машин (/api/cars/).
    Тут достаточно одного главного фото и базовых полей.
    """
    main_photo = serializers.SerializerMethodField()
    fuel = serializers.SerializerMethodField()
    transmission = serializers.SerializerMethodField()
    body_type = serializers.SerializerMethodField()       # человекочитаемо для фронта
    body_type_code = serializers.CharField(source="body_type", read_only=True)

    # ADDED:
    fuel_type_canonical = serializers.CharField(read_only=True)
    fuel_display = serializers.SerializerMethodField()

    class Meta:
        model = Car
        fields = [
            "id",
            "external_id",
            "make",
            "model",
            "generation",

            "year",
            "mileage_km",
            "engine_cc",
            "power_hp",

            "price_eur",
            "currency",

            # фронту сразу готовые строки (витрина)
            "fuel",
            "transmission",
            "body_type",

            # коды для фильтров
            "fuel_type_code",
            "fuel_type_label",
            "fuel_type_canonical",   # ADDED
            "fuel_display",          # ADDED
            "transmission_code",
            "transmission_label",
            "body_type_code",

            "drive",
            "location_city",

            "main_photo",
        ]

    def get_main_photo(self, obj: Car) -> str:
        # главное фото для карточки в списке
        return obj.main_photo_url or ""

    def get_fuel(self, obj: Car) -> str:
        # человекочитаемое топливо для карточки (ADJUSTED: preferă afișajul unificat)
        return fuel_display_from(obj)

    def get_fuel_display(self, obj: Car) -> str:
        # ADDED: câmp explicit pentru front (același cu get_fuel)
        return fuel_display_from(obj)

    def get_transmission(self, obj: Car) -> str:
        # человекочитаемая КПП для карточки
        return obj.transmission_label or ""

    def get_body_type(self, obj: Car) -> str:
        # человекочитаемый кузов ("Кроссовер", "Седан", ...)
        return body_type_human(obj.body_type)


class CarDetailSerializer(serializers.ModelSerializer):
    """
    Полная версия для детальной страницы (/api/cars/<id>/).
    ВАЖНО: сюда добавляем ВСЕ фото в правильной структуре,
    потому что фронт CarGallery ждёт массив объектов с image_url, is_primary и т.д.
    """
    photos = serializers.SerializerMethodField()

    fuel = serializers.SerializerMethodField()
    transmission = serializers.SerializerMethodField()

    body_type = serializers.SerializerMethodField()       # человекочитаемо
    body_type_code = serializers.CharField(source="body_type", read_only=True)

    # ADDED:
    fuel_type_canonical = serializers.CharField(read_only=True)
    fuel_display = serializers.SerializerMethodField()

    class Meta:
        model = Car
        fields = [
            "id",
            "external_id",
            "source",
            "status",

            "make",
            "model",
            "generation",

            "year",
            "first_registration",
            "seats",

            # кузов (и человекочит, и код)
            "body_type",        # человекочитаемо: "Кроссовер"
            "body_type_code",   # код: "suv"

            # теххарактеристики
            "mileage_km",
            "engine_cc",
            "power_hp",

            # удобные поля для фронта
            "fuel",
            "transmission",

            # исходные коды топлива/кпп
            "fuel_type_code",
            "fuel_type_label",
            "fuel_type_raw",
            "fuel_type_canonical",   # ADDED
            "fuel_display",          # ADDED
            "transmission_code",
            "transmission_label",
            "transmission_raw",

            "drive",

            "registration_country",
            "origin_country",
            "condition",
            "availability",
            "location_city",

            "price_eur",
            "currency",

            "title",
            "description",
            "color",

            "main_photo_url",
            "photos",           # ← теперь массив объектов с данными о каждой фотке

            "updated_at",
        ]

    def get_photos(self, obj: Car):
        """
        Возвращаем массив объектов, а не просто строки.
        Именно так фронт ждёт, чтобы:
        - показать превьюшки
        - найти cover = первую is_primary
        """
        pics = (
            Photo.objects
            .filter(car=obj)
            .order_by("sort_order", "id")
            .only("id", "image_url", "is_primary", "sort_order")
        )

        result = []
        for p in pics:
            result.append({
                "id": p.id,
                "image_url": p.image_url,
                "is_primary": bool(p.is_primary),
                "sort_order": p.sort_order,
            })
        return result

    def get_fuel(self, obj: Car) -> str:
        # для детальной страницы тоже отдаём унифицированную подпись
        return fuel_display_from(obj)

    def get_fuel_display(self, obj: Car) -> str:
        # ADDED: câmp explicit pentru front
        return fuel_display_from(obj)

    def get_transmission(self, obj: Car) -> str:
        return obj.transmission_label or ""

    def get_body_type(self, obj: Car) -> str:
        return body_type_human(obj.body_type)
