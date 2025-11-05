from django.core.management.base import BaseCommand, CommandParser
from django.utils import timezone

from app.cars.services.import_999 import (
    sync_all_from_999,
    sync_all_from_999_with_archive,
    upsert_car_from_999,
)


class Command(BaseCommand):
    help = (
        "Импорт / обновление объявлений из 999.md в локальную БД (cars).\n"
        "Без флага --with-archive: просто апсерты/обновления.\n"
        "С флагом --with-archive: плюс деактивация машин, "
        "которых больше нет на 999.md."
    )

    def add_arguments(self, parser: CommandParser) -> None:
        # импорт одного конкретного объявления по ID
        parser.add_argument(
            "--advert-id",
            dest="advert_id",
            default=None,
            help=(
                "ID объявления 999.md (строка/число). "
                "Если указать, импортнём только его и не будем лезть по страницам."
            ),
        )

        # массовый импорт
        parser.add_argument(
            "--page-size",
            dest="page_size",
            type=int,
            default=25,
            help="Сколько объявлений тянуть за один запрос страницы (по умолчанию 25).",
        )
        parser.add_argument(
            "--max-items",
            dest="max_items",
            type=int,
            default=None,
            help="Ограничить общее число импортированных объявлений.",
        )

        # режим с авто-архивацией отсутствующих
        parser.add_argument(
            "--with-archive",
            dest="with_archive",
            action="store_true",
            help=(
                "Если указать этот флаг: после импорта пометим как inactive/archived "
                "те машины source='999', которых больше нет на 999.md."
            ),
        )

    def handle(self, *args, **options):
        advert_id = options["advert_id"]
        page_size = options["page_size"]
        max_items = options["max_items"]
        with_archive = options["with_archive"]

        # Если хотим притянуть одно конкретное объявление:
        if advert_id:
            # даём стабильный timestamp для этого апдейта,
            # чтобы last_seen_at не прыгал в разных полях внутри одной машины
            sync_started_at = timezone.now()

            car = upsert_car_from_999(str(advert_id), seen_at=sync_started_at)

            self.stdout.write(
                self.style.SUCCESS(
                    f"[OK] Объявление {advert_id} импортировано/обновлено как Car id={car.id} "
                    f"(active={car.active}, status={car.status})"
                )
            )
            return

        # Массовый режим
        if with_archive:
            stats = sync_all_from_999_with_archive(
                page_size=page_size,
                max_items=max_items,
            )
            # stats = {"imported": X, "archived": Y, "active_seen": Z}
            self.stdout.write(
                self.style.SUCCESS(
                    "[OK] Полная синхронизация с архивированием:\n"
                    f"  Импортировано/обновлено: {stats.get('imported')}\n"
                    f"  Активных объявлений замечено сейчас на 999.md: {stats.get('active_seen')}\n"
                    f"  Помечено как archived (снято с витрины): {stats.get('archived')}"
                )
            )
        else:
            imported_count = sync_all_from_999(
                page_size=page_size,
                max_items=max_items,
            )
            self.stdout.write(
                self.style.SUCCESS(
                    f"[OK] Импортировано/обновлено {imported_count} объявлений из 999.md "
                    "(без архивации отсутствующих)"
                )
            )
