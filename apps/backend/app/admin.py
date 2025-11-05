from django.contrib import admin
from .models import Car, Photo


class PhotoInline(admin.TabularInline):
    model = Photo
    extra = 0
    fields = ("image_file", "image_url", "is_primary", "sort_order")
    ordering = ("sort_order", "id")


@admin.register(Car)
class CarAdmin(admin.ModelAdmin):
    list_display = (
        "id", "make", "model", "generation", "year",
        "body_type", "mileage_km", "price_eur", "availability",
        "status", "source", "external_id", "created_at",
    )
    list_filter = (
        "status", "source", "availability", "condition", "fuel_type",
        "transmission", "drive", "body_type", "registration_country", "origin_country",
        "year",
    )
    search_fields = ("make", "model", "generation", "title", "description", "vin_hash", "external_id")
    inlines = [PhotoInline]

    fieldsets = (
        ("Основной раздел", {
            "fields": (
                ("make", "model", "generation"),
                ("registration_country", "first_registration"),
                ("condition", "availability", "origin_country"),
            )
        }),
        ("Свойства", {
            "fields": (
                ("year", "seats", "body_type"),
                ("mileage_km",),
                ("engine_cc", "power_hp"),
                ("fuel_type", "transmission", "drive"),
                ("price_eur", "currency"),
            )
        }),
        ("Карточка/описание", {
            "fields": (
                "title",
                ("color", "location_city"),
                "description",
            )
        }),
        ("Служебные", {
            "fields": (
                ("status", "source", "external_id"),
                "vin_hash",
            )
        }),
    )
    save_as = True


@admin.register(Photo)
class PhotoAdmin(admin.ModelAdmin):
    list_display = ("id", "car", "is_primary", "sort_order")
    list_filter = ("is_primary",)
    ordering = ("car", "sort_order", "id")
    fields = ("car", "image_file", "image_url", "is_primary", "sort_order")
