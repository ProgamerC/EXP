# project/celery_app.py
import os
from celery import Celery

# Гарантируем, что Django настройки подхватятся
os.environ.setdefault("DJANGO_SETTINGS_MODULE", os.getenv("DJANGO_SETTINGS_MODULE", "project.settings"))

app = Celery(os.getenv("CELERY_NAMESPACE", "project"))

# Конфиг через Django settings с префиксом CELERY_ (удобно хранить в .env)
# Например, CELERY_BROKER_URL=redis://redis:6379/0
app.config_from_object("django.conf:settings", namespace="CELERY")

# Брокер/бэкенд по умолчанию из REDIS_URL, если в settings не задано
app.conf.broker_url = app.conf.get("broker_url") or os.getenv("REDIS_URL", "redis://redis:6379/0")
app.conf.result_backend = app.conf.get("result_backend") or os.getenv("REDIS_URL", "redis://redis:6379/0")

# Прочие «здоровые» дефолты
app.conf.timezone = os.getenv("TZ", "Europe/Chisinau")
app.conf.accept_content = ["json"]
app.conf.task_serializer = "json"
app.conf.result_serializer = "json"
app.conf.task_default_queue = os.getenv("CELERY_DEFAULT_QUEUE", "default")

# Автопоиск tasks.py по installed apps
app.autodiscover_tasks()
