from django.urls import path
from app.cars.views import CarListView, CarDetailView, FiltersView

urlpatterns = [
    path('cars/', CarListView.as_view(), name='cars-list'),
    path('cars/<int:id>/', CarDetailView.as_view(), name='cars-detail'),
    path('filters/', FiltersView.as_view(), name='cars-filters'),
]
