from django.db import models
from django.utils import timezone


# ---- справочники кодов топлива, которые тянем как есть из 999.md ----
FUEL_TYPE_CODE_CHOICES = [
    ("petrol", "Бензин"),
    ("diesel", "Дизель"),
    ("lpg_propane", "Газ / Бензин (пропан)"),
    ("cng_methane", "Газ / Бензин (метан)"),
    ("hybrid", "Гибрид"),
    ("electric", "Электричество"),
    ("phev_petrol", "Плагин-гибрид (бензин)"),
    ("phev_diesel", "Плагин-гибрид (дизель)"),
    ("mhev_petrol", "Мягкий-гибрид (бензин)"),
    ("mhev_diesel", "Мягкий-гибрид (дизель)"),
    ("other", "Другое"),
]

# ---- канонические значения для единого фронта/фильтров
FUEL_TYPE_CANON_CHOICES = [
    ("petrol", "petrol"),
    ("diesel", "diesel"),
    ("hybrid_petrol", "hybrid_petrol"),
    ("hybrid_diesel", "hybrid_diesel"),
    ("phev_petrol", "phev_petrol"),
    ("phev_diesel", "phev_diesel"),
    ("electric", "electric"),
    ("lpg", "lpg"),
    ("cng", "cng"),
    ("hydrogen", "hydrogen"),
]

# ---- справочник КПП ----
TRANSMISSION_CODE_CHOICES = [
    ("automatic", "Автомат"),
    ("manual", "Механика"),
    ("robot", "Робот"),
    ("cvt", "Вариатор"),
    ("other", "Другое"),
]


# ==== удобный QuerySet ====
class CarQuerySet(models.QuerySet):
    def published(self):
        # считаем опубликованным: статус published И active=True
        return self.filter(status=Car.Status.PUBLISHED, active=True)

    def archived(self):
        return self.filter(status=Car.Status.ARCHIVED)

    # просто активные (независимо от статусного поля)
    def active(self):
        return self.filter(active=True)


class Car(models.Model):
    # ==== статус с choices ====
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        PUBLISHED = "published", "Published"
        ARCHIVED = "archived", "Archived"

    #
    # Источник и идентификаторы
    #
    source = models.CharField(
        max_length=32,
        default="999",
        db_index=True,
        verbose_name="Источник",
    )

    external_id = models.CharField(
        max_length=64,
        unique=True,
        db_index=True,
        verbose_name="ID на стороне источника",
    )

    status = models.CharField(
        max_length=32,
        choices=Status.choices,
        default=Status.PUBLISHED,
        db_index=True,
        verbose_name="Статус",
    )

    # ⚡ активно ли объявление у нас на сайте сейчас
    # ВАЖНО: сохраняем совместимость со старой колонкой is_active
    active = models.BooleanField(
        default=True,
        db_index=True,
        db_column="active",
        verbose_name="Активно на витрине?",
        help_text="False = больше не показываем на сайте (снято с 999.md)",
    )

    # ⚡ когда в последний раз мы видели это объявление на стороне 999.md
    last_seen_at = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True,
        verbose_name="Последний раз замечено в источнике",
    )

    # ⚡ когда оно пропало с 999 (косвенно момент 'продано/снято')
    sold_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Примерная дата продажи/снятия с продажи",
    )

    #
    # Медиа
    #
    main_photo_url = models.TextField(
        blank=True,
        default="",
        help_text="URL первой (основной) фотографии объявления с 999.md",
        verbose_name="Главное фото (URL)",
    )

    #
    # Основные данные об авто
    #
    make = models.CharField(
        max_length=128,
        blank=True,
        default="",
        db_index=True,
        verbose_name="Марка",
    )
    model = models.CharField(
        max_length=128,
        blank=True,
        default="",
        db_index=True,
        verbose_name="Модель",
    )
    generation = models.CharField(
        max_length=128,
        blank=True,
        default="",
        verbose_name="Поколение / серия",
    )

    year = models.IntegerField(
        null=True,
        blank=True,
        verbose_name="Год выпуска (числом)",
    )

    # оставляем тип DATE — у нас в БД это поле уже есть и к нему привыкли
    first_registration = models.DateField(
        null=True,
        blank=True,
        verbose_name="Первая регистрация (дата)",
    )

    seats = models.IntegerField(
        null=True,
        blank=True,
        verbose_name="Кол-во мест",
    )

    body_type = models.CharField(
        max_length=64,
        blank=True,
        default="",
        verbose_name="Тип кузова (норм.)",
    )

    mileage_km = models.IntegerField(
        default=0,
        verbose_name="Пробег, км",
    )

    engine_cc = models.IntegerField(
        null=True,
        blank=True,
        verbose_name="Объём двигателя, см³",
    )

    power_hp = models.IntegerField(
        null=True,
        blank=True,
        verbose_name="Мощность, л.с.",
    )

    #
    # Топливо
    #
    fuel_type_code = models.CharField(
        max_length=32,
        blank=True,
        default="",
        choices=FUEL_TYPE_CODE_CHOICES,
        db_index=True,
        verbose_name="Тип топлива (код)",
    )
    fuel_type_label = models.CharField(
        max_length=255,
        blank=True,
        default="",
        verbose_name="Тип топлива (лейбл для фронта)",
    )
    fuel_type_raw = models.TextField(
        blank=True,
        default="",
        verbose_name="Топливо (сырой текст из 999)",
    )

    # единый канонический ключ топлива
    fuel_type_canonical = models.CharField(
        max_length=32,
        blank=True,
        default="",
        choices=FUEL_TYPE_CANON_CHOICES,
        db_index=True,
        verbose_name="Тип топлива (канон.)",
        help_text="Единый нормализованный код топлива для фронта/фильтров",
    )

    #
    # КПП
    #
    transmission_code = models.CharField(
        max_length=32,
        blank=True,
        default="",
        choices=TRANSMISSION_CODE_CHOICES,
        db_index=True,
        verbose_name="КПП (код)",
    )
    transmission_label = models.CharField(
        max_length=255,
        blank=True,
        default="",
        verbose_name="КПП (лейбл для фронта)",
    )
    transmission_raw = models.TextField(
        blank=True,
        default="",
        verbose_name="КПП (сырой текст из 999)",
    )

    #
    # Привод, страны, состояние, доступность
    #
    drive = models.CharField(
        max_length=32,
        blank=True,
        default="",
        verbose_name="Привод (норм.)",
    )

    registration_country = models.CharField(
        max_length=128,
        blank=True,
        default="",
        verbose_name="Страна регистрации",
    )
    origin_country = models.CharField(
        max_length=128,
        blank=True,
        default="",
        verbose_name="Страна происхождения",
    )
    condition = models.CharField(
        max_length=64,
        blank=True,
        default="",
        verbose_name="Состояние (норм.)",
    )
    availability = models.CharField(
        max_length=64,
        blank=True,
        default="",
        verbose_name="Доступность / наличие",
    )
    location_city = models.CharField(
        max_length=128,
        blank=True,
        default="",
        verbose_name="Город / Локация",
    )

    #
    # Цена
    #
    price_eur = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        verbose_name="Цена в EUR",
    )
    currency = models.CharField(
        max_length=8,
        default="EUR",
        verbose_name="Валюта",
    )

    #
    # Витрина / описание
    #
    title = models.CharField(
        max_length=255,
        blank=True,
        default="",
        verbose_name="Заголовок",
    )
    description = models.TextField(
        blank=True,
        default="",
        verbose_name="Описание",
    )
    color = models.CharField(
        max_length=64,
        blank=True,
        default="",
        verbose_name="Цвет",
    )

    vin_hash = models.CharField(
        max_length=64,
        blank=True,
        default="",
        verbose_name="VIN (усечённый/хеш)",
    )

    #
    # Таймстемпы
    #
    created_at = models.DateTimeField(
        default=timezone.now,
        verbose_name="Создано",
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Обновлено",
    )

    # ==== менеджер ====
    objects = CarQuerySet.as_manager()

    class Meta:
        verbose_name = "Авто"
        verbose_name_plural = "Авто"
        ordering = ["-updated_at", "-created_at"]

    def __str__(self):
        base = f"{self.make} {self.model}".strip()
        return base or f"Car {self.id}"

    # ==== логика публикации/архивации ====
    def publish(self):
        self.status = self.Status.PUBLISHED
        self.active = True
        self.sold_at = None
        self.save(update_fields=["status", "active", "sold_at", "updated_at"])

    def archive(self):
        self.status = self.Status.ARCHIVED
        self.active = False
        if not self.sold_at:
            self.sold_at = timezone.now()
        self.save(update_fields=["status", "active", "sold_at", "updated_at"])

    def unarchive(self):
        """Возвращает лот из архива, когда он снова увиден на 999.md."""
        self.status = self.Status.PUBLISHED
        self.active = True
        self.sold_at = None
        self.save(update_fields=["status", "active", "sold_at", "updated_at"])

    # ==== канон топлива ====
    def _compute_fuel_canonical(self) -> str:
        """
        Пытаемся нормализовать топливо:
        1) сначала пробуем локальную функцию normalize_fuel (если есть),
        2) иначе — эвристики по сырым/лейбл/код полям.
        """
        try:
            from app.cars.utils.fuel import normalize_fuel  # локальный импорт
        except Exception:
            normalize_fuel = None

        raw = (self.fuel_type_raw or "").strip()
        label = (self.fuel_type_label or "").strip()
        code = (self.fuel_type_code or "").strip()

        if normalize_fuel:
            for s in (raw, label, code):
                if s:
                    canon = normalize_fuel(s)
                    if canon:
                        return canon

        s = (raw or label or code).lower()
        if not s:
            return ""
        if "plug" in s and "hybrid" in s:
            return "phev_diesel" if "diesel" in s else "phev_petrol"
        if "hybrid" in s:
            return "hybrid_diesel" if "diesel" in s else "hybrid_petrol"
        if "diesel" in s:
            return "diesel"
        if any(x in s for x in ("benz", "petrol", "gasolin")):
            return "petrol"
        if "electric" in s or s == "ev":
            return "electric"
        if "lpg" in s:
            return "lpg"
        if "cng" in s:
            return "cng"
        if "hydrogen" in s or "h2" in s:
            return "hydrogen"
        return ""

    # ==== единый save без дублей ====
    def save(self, *args, **kwargs):
        try:
            if not self.fuel_type_canonical:
                self.fuel_type_canonical = self._compute_fuel_canonical() or ""
        except Exception:
            # не роняем сохранение, если нет utils.fuel
            pass
        super().save(*args, **kwargs)

    @property
    def main_photo(self) -> str:
        """
        Удобно для карточек списка:
        1) если main_photo_url уже сохранён при импорте — берём его;
        2) иначе fallback — первая Photo из related.
        """
        if self.main_photo_url:
            return self.main_photo_url
        p = self.photos.order_by("sort_order").first()
        return p.image_url if p and p.image_url else ""

    @property
    def year_display(self) -> int | None:
        """
        Что показывать фронту как 'Год':
        - сначала self.year (целое число),
        - если его нет, берём год из даты первой регистрации.
        """
        if self.year:
            return self.year
        if self.first_registration:
            return self.first_registration.year
        return None


class Photo(models.Model):
    car = models.ForeignKey(
        Car,
        on_delete=models.CASCADE,
        related_name="photos",
        verbose_name="Машина",
    )

    is_primary = models.BooleanField(
        default=False,
        verbose_name="Главное фото?",
    )

    sort_order = models.IntegerField(
        default=0,
        verbose_name="Порядок сортировки",
    )

    image_url = models.TextField(
        blank=True,
        default="",
        verbose_name="Ссылка на картинку (999)",
    )

    # опционально локальный файл (если когда-то начнём скачивать)
    image_file = models.ImageField(
        upload_to="cars/",
        blank=True,
        null=True,
        verbose_name="Локальный файл",
    )

    created_at = models.DateTimeField(
        default=timezone.now,
        verbose_name="Создано",
    )

    class Meta:
        verbose_name = "Фото"
        verbose_name_plural = "Фото"
        ordering = ["car_id", "sort_order", "id"]

    def __str__(self):
        return f"Photo {self.id} / car {self.car_id}"
