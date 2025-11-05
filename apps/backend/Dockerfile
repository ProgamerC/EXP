# ==== БАЗОВЫЙ ОБРАЗ ====
FROM python:3.12-slim AS base

# Не создаём .pyc и сразу выводим логи
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    POETRY_VIRTUALENVS_CREATE=false

# Системные пакеты (Pillow, psycopg и пр.)
# Если используешь psycopg2-binary — можно убрать build-essential и libpq-dev.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    libjpeg62-turbo-dev \
    zlib1g-dev \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ==== ДЕПЕНДЕНСИ ====
# Копируем только файлы зависимостей для кеширования слоёв
COPY requirements.txt /app/requirements.txt
# Если у тебя есть разные файлы (base/prod), добавь COPY requirements*.txt ...
# COPY requirements*.txt /app/

RUN python -m pip install --upgrade pip \
 && pip install -r /app/requirements.txt

# ==== КОД ПРОЕКТА ====
# Теперь копируем весь бэкенд-код
COPY . /app

# Непривилегированный пользователь
RUN adduser --disabled-password --gecos "" appuser \
 && mkdir -p /app/media /app/static /app/logs \
 && chown -R appuser:appuser /app
USER appuser

# Порт приложения
EXPOSE 8000

# По умолчанию запускаем Gunicorn (compose может переопределить командой)
# Если WSGI-модуль отличается — задай переменную WSGI_MODULE в .env
ENV WSGI_MODULE=config.wsgi
CMD sh -c "gunicorn ${WSGI_MODULE}:application --bind 0.0.0.0:8000 --workers 3 --timeout 60"
