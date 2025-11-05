from django.urls import path
from app.cars.views import CarListView, CarDetailView, FiltersView

# если лиды не используем сейчас — не импортируем

urlpatterns = [
    # список + фильтры + сортировка
    path("cars/", CarListView.as_view(), name="cars-list"),

    # детальная карточка авто
    path("cars/<int:id>/", CarDetailView.as_view(), name="cars-detail"),

    # справочник значений для фильтров
    path("filters/", FiltersView.as_view(), name="cars-filters"),
   
]
