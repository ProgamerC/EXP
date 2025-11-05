from django.core.management.base import BaseCommand
from app.cars.services.import_999 import sync_all_from_999_with_archive


class Command(BaseCommand):
    help = "Импорт/обновление объявлений с 999.md и авто-архивация исчезнувших объявлений"

    def add_arguments(self, parser):
        parser.add_argument(
            "--page-size",
            type=int,
            default=25,
            help="Сколько объявлений брать за страницу с 999 (дефолт 25)",
        )
        parser.add_argument(
            "--max-items",
            type=int,
            default=None,
            help="Ограничить общее количество импортируемых объявлений (для теста)",
        )

    def handle(self, *args, **options):
        stats = sync_all_from_999_with_archive(
            page_size=options["page_size"],
            max_items=options["max_items"],
        )
        self.stdout.write(
            self.style.SUCCESS(
                f"Импортировано/обновлено {stats['imported']} активных объявлений, "
                f"активных на 999 сейчас {stats['active_seen']}, "
                f"заархивировано {stats['archived']}."
            )
        )
