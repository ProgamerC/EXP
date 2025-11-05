from rest_framework import generics
from app.leads.models import Lead
from app.leads.serializers import LeadSerializer


class LeadCreateView(generics.CreateAPIView):
    """
    POST /api/leads/
    payload JSON:
    {
        "car": 123,       // id машины из /api/cars/
        "name": "Иван",
        "phone": "+37360000000"
    }
    """
    queryset = Lead.objects.all()
    serializer_class = LeadSerializer
