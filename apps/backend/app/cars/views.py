# apps/backend/app/cars/views.py
from decimal import Decimal, InvalidOperation

from django.db.models import Q, Min, Max
from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination

from app.cars.models import Car
from app.cars.serializers import (
    CarListSerializer,
    CarDetailSerializer,
    body_type_human,
)


class CarsPagination(PageNumberPagination):
    """
    Кастомная пагинация, чтобы фронт знал сколько всего страниц.

    Формат ответа:
    {
        "page": 1,
        "page_size": 12,
        "total_pages": 5,
        "count": 60,
        "next": "...",
        "previous": null,
        "results": [ {...}, {...} ]
    }
    """
    page_size = 12
    page_size_query_param = "page_size"
    max_page_size = 60

    def get_paginated_response(self, data):
        page_size = self.get_page_size(self.request) or self.page.paginator.per_page
        total_pages = (
            self.page.paginator.count // page_size
            + (1 if self.page.paginator.count % page_size else 0)
        )
        return Response({
            "page": self.page.number,
            "page_size": page_size,
            "total_pages": total_pages,
            "count": self.page.paginator.count,
            "next": self.get_next_link(),
            "previous": self.get_previous_link(),
            "results": data,
        })


def _to_int(val):
    if val is None:
        return None
    try:
        return int(str(val).strip())
    except Exception:
        return None


def _to_decimal(val):
    if val is None:
        return None
    try:
        # поддержим "12,5" -> "12.5"
        return Decimal(str(val).replace(",", ".").strip())
    except (InvalidOperation, ValueError):
        return None


class CarListView(generics.ListAPIView):
    """
    GET /api/cars/

    Поддерживаемые query params:
      q, make, fuel_type_code, transmission_code, body_type_code,
      year_min, year_max,
      price_min, price_max,
      mileage_max,
      ordering=price|-price|year|-year|mileage|-mileage|updated|-updated,
      page=1, page_size=12
    """
    serializer_class = CarListSerializer
    pagination_class = CarsPagination  # <-- ПАГИНАЦИЯ ВКЛЮЧЕНА

    def get_queryset(self):
        # ВАЖНО: показываем только опубликованные и активные
        qs = Car.objects.filter(status="published", active=True)
        params = self.request.query_params

        # поиск
        q_text = (params.get("q") or "").strip()
        if q_text:
            qs = qs.filter(
                Q(make__icontains=q_text) |
                Q(model__icontains=q_text) |
                Q(title__icontains=q_text)
            )

        # марка
        make = (params.get("make") or "").strip()
        if make:
            qs = qs.filter(make=make)

        # топливо
        fuel_code = (params.get("fuel_type_code") or "").strip()
        if fuel_code:
            qs = qs.filter(fuel_type_code=fuel_code)

        # коробка
        transm_code = (params.get("transmission_code") or "").strip()
        if transm_code:
            qs = qs.filter(transmission_code=transm_code)

        # кузов
        body_code = (params.get("body_type_code") or "").strip()
        if body_code:
            qs = qs.filter(body_type=body_code)

        # год
        year_min = _to_int(params.get("year_min"))
        if year_min is not None:
            qs = qs.filter(year__gte=year_min)

        year_max = _to_int(params.get("year_max"))
        if year_max is not None:
            qs = qs.filter(year__lte=year_max)

        # цена
        price_min = _to_decimal(params.get("price_min"))
        if price_min is not None:
            qs = qs.filter(price_eur__gte=price_min)

        price_max = _to_decimal(params.get("price_max"))
        if price_max is not None:
            qs = qs.filter(price_eur__lte=price_max)

        # пробег
        mileage_max = _to_int(params.get("mileage_max"))
        if mileage_max is not None:
            qs = qs.filter(mileage_km__lte=mileage_max)

        # сортировка
        ordering_param = (params.get("ordering") or "").strip()
        allowed = {
            "price": "price_eur",
            "-price": "-price_eur",
            "year": "year",
            "-year": "-year",
            "mileage": "mileage_km",
            "-mileage": "-mileage_km",
            "updated": "updated_at",
            "-updated": "-updated_at",
        }
        if ordering_param in allowed:
            qs = qs.order_by(allowed[ordering_param])
        else:
            qs = qs.order_by("-updated_at")

        return qs


class CarDetailView(generics.RetrieveAPIView):
    """
    GET /api/cars/<id>/
    Не показываем архивные карточки.
    """
    queryset = Car.objects.filter(status="published", active=True).prefetch_related("photos")
    serializer_class = CarDetailSerializer
    lookup_field = "id"


class FiltersView(APIView):
    """
    GET /api/filters/
    """
    def get(self, request, *args, **kwargs):
        # фильтры считаем только по опубликованным и активным
        qs = Car.objects.filter(status="published", active=True)

        # марки
        makes_qs = (
            qs.exclude(make__isnull=True)
              .exclude(make__exact="")
              .values_list("make", flat=True)
              .distinct()
        )
        makes = sorted(makes_qs)

        # топливо
        fuels_raw = (
            qs.exclude(fuel_type_code__isnull=True)
              .exclude(fuel_type_code__exact="")
              .values("fuel_type_code", "fuel_type_label")
              .distinct()
        )
        fuels = [
            {
                "code": f["fuel_type_code"],
                "label": f["fuel_type_label"] or f["fuel_type_code"],
            }
            for f in fuels_raw
        ]
        fuels = sorted(fuels, key=lambda x: x["label"].lower())

        # коробки
        tr_raw = (
            qs.exclude(transmission_code__isnull=True)
              .exclude(transmission_code__exact="")
              .values("transmission_code", "transmission_label")
              .distinct()
        )
        transmissions = [
            {
                "code": t["transmission_code"],
                "label": t["transmission_label"] or t["transmission_code"],
            }
            for t in tr_raw
        ]
        transmissions = sorted(transmissions, key=lambda x: x["label"].lower())

        # кузова
        body_raw = (
            qs.exclude(body_type__isnull=True)
              .exclude(body_type__exact="")
              .values_list("body_type", flat=True)
              .distinct()
        )
        body_types = [{"code": code, "label": body_type_human(code)} for code in body_raw]
        body_types = sorted(body_types, key=lambda x: x["label"].lower())

        # агрегации для слайдеров
        agg = qs.aggregate(
            year_min=Min("year"),
            year_max=Max("year"),
            price_min=Min("price_eur"),
            price_max=Max("price_eur"),
            mileage_min=Min("mileage_km"),
            mileage_max=Max("mileage_km"),
        )

        def num_or_none(v):
            if v is None:
                return None
            try:
                return float(v)
            except Exception:
                return v

        years = {
            "min": agg["year_min"],
            "max": agg["year_max"],
        }

        price_eur = {
            "min": num_or_none(agg["price_min"]),
            "max": num_or_none(agg["price_max"]),
        }

        mileage_km = {
            "min": 0 if agg["mileage_min"] is not None else None,
            "max": agg["mileage_max"],
        }

        data = {
            "makes": makes,
            "fuels": fuels,
            "transmissions": transmissions,
            "body_types": body_types,
            "years": years,
            "price_eur": price_eur,
            "mileage_km": mileage_km,
        }

        return Response(data)
