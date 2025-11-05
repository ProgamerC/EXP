from django.contrib import admin
from .models import Car, Photo


@admin.register(Car)
class CarAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "make",
        "model",
        "generation",
        "year_display",
        "price_eur",
        "currency",
        "fuel_type_label",
        "transmission_label",
        "mileage_km",
        "status",
        "updated_at",
    )
    list_filter = (
        "status",
        "fuel_type_code",
        "transmission_code",
    )
    search_fields = (
        "id",
        "external_id",
        "make",
        "model",
        "generation",
        "title",
        "description",
    )
    readonly_fields = (
        "created_at",
        "updated_at",
        "main_photo_url",
        "year_display",
    )

    fieldsets = (
        ("Идентификация", {
            "fields": (
                "source",
                "external_id",
                "status",
                "created_at",
                "updated_at",
            )
        }),
        ("Основное", {
            "fields": (
                "make",
                "model",
                "generation",
                "year",
                "first_registration",
                "year_display",
                "seats",
                "body_type",
                "mileage_km",
                "engine_cc",
                "power_hp",
                "drive",
                "vin_hash",
                "color",
            )
        }),
        ("Топливо / КПП", {
            "fields": (
                "fuel_type_code",
                "fuel_type_label",
                "fuel_type_raw",
                "transmission_code",
                "transmission_label",
                "transmission_raw",
            )
        }),
        ("Происхождение / Гео", {
            "fields": (
                "registration_country",
                "origin_country",
                "location_city",
                "condition",
                "availability",
            )
        }),
        ("Цена", {
            "fields": (
                "price_eur",
                "currency",
            )
        }),
        ("Публичная карточка", {
            "fields": (
                "title",
                "description",
                "main_photo_url",
            )
        }),
    )


@admin.register(Photo)
class PhotoAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "car",
        "is_primary",
        "sort_order",
        "image_url",
        "created_at",
    )
    list_filter = (
        "is_primary",
    )
    search_fields = (
        "car__id",
        "car__external_id",
        "image_url",
    )
    readonly_fields = (
        "created_at",
    )
