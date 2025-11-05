# app/cars/views_filter_options.py (nou, mic)
from rest_framework.decorators import api_view
from rest_framework.response import Response

FUEL_OPTIONS = [
    {"value": "petrol", "label": "Benzină"},
    {"value": "diesel", "label": "Motorină"},
    {"value": "hybrid_petrol", "label": "Hibrid (Benzină)"},
    {"value": "hybrid_diesel", "label": "Hibrid (Motorină)"},
    {"value": "phev_petrol", "label": "Plug-in Hybrid (Benzină)"},
    {"value": "phev_diesel", "label": "Plug-in Hybrid (Motorină)"},
    {"value": "electric", "label": "Electric"},
    {"value": "lpg", "label": "GPL"},
    {"value": "cng", "label": "CNG"},
    {"value": "hydrogen", "label": "Hidrogen"},
]

@api_view(["GET"])
def filter_options(request):
    return Response({"fuel": FUEL_OPTIONS})
