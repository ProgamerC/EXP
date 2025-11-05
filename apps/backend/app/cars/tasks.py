from celery import shared_task
from django.core.management import call_command

@shared_task(name="app.cars.tasks.import_999_task")
def import_999_task(page_size=40, max_items=100, with_archive=True, verbosity=1):
    """
    Обёртка над manage.py import_999, чтобы гонять импорт из Celery.
    """
    args = [
        "import_999",
        f"--page-size={page_size}",
        f"--max-items={max_items}",
    ]
    if with_archive:
        args.append("--with-archive")
    if verbosity and int(verbosity) > 1:
        args.append(f"--verbosity={int(verbosity)}")

    call_command(*args)
    return {"ok": True, "page_size": page_size, "max_items": max_items, "with_archive": with_archive}
