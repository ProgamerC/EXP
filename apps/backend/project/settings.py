# apps/backend/project/settings.py

import os
from pathlib import Path
from dotenv import load_dotenv
import dj_database_url
CELERY_BROKER_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
CELERY_RESULT_BACKEND = CELERY_BROKER_URL
CELERY_TIMEZONE = os.getenv("TZ", "Europe/Chisinau")
CELERY_BROKER_CONNECTION_RETRY_ON_STARTUP = True

# === helpers pentru citirea corectă a variabilelor din .env ===
def env_csv(name, default=""):
    return [x.strip() for x in os.getenv(name, default).split(",") if x.strip()]

def env_bool(name, default=False):
    v = os.getenv(name)
    if v is None:
        return default
    return str(v).lower() in ("1", "true", "yes", "on")

def env_tuple2(name, default=None):
    v = os.getenv(name)
    if not v:
        return default
    parts = [p.strip() for p in v.split(",", 1)]
    return tuple(parts) if len(parts) == 2 else default


load_dotenv()
BASE_DIR = Path(__file__).resolve().parent.parent

# --- Security / Debug ---
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "dev-secret")
DEBUG = env_bool("DJANGO_DEBUG", False)
ALLOWED_HOSTS = env_csv("ALLOWED_HOSTS", "localhost,127.0.0.1")

# --- Apps ---
INSTALLED_APPS = [
    "django.contrib.admin","django.contrib.auth","django.contrib.contenttypes",
    "django_celery_beat",
    "django.contrib.sessions","django.contrib.messages","django.contrib.staticfiles",
    "rest_framework","corsheaders","app.cars","app.leads",
]

# --- Middleware ---
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "project.urls"
TEMPLATES = [{
    "BACKEND": "django.template.backends.django.DjangoTemplates",
    "DIRS": [], "APP_DIRS": True,
    "OPTIONS": {"context_processors": [
        "django.template.context_processors.debug",
        "django.template.context_processors.request",
        "django.contrib.auth.context_processors.auth",
        "django.contrib.messages.context_processors.messages",
    ]},
}]
WSGI_APPLICATION = "project.wsgi.application"

# --- Database ---
DATABASES = {
    "default": dj_database_url.parse(
        os.getenv("DATABASE_URL", "postgresql://postgres:postgres@db:5432/expertauto")
    )
}

# --- Auth validators ---
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# --- Locale ---
LANGUAGE_CODE = "ru"
TIME_ZONE = "Europe/Chisinau"
USE_I18N = True
USE_TZ = True

# --- Static & Media ---
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "static"
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"
MEDIA_URL = "/media/"
MEDIA_ROOT = os.getenv("MEDIA_ROOT", BASE_DIR / "media")



# --- CORS / CSRF din .env (liste reale) ---
# CSRF_TRUSTED_ORIGINS trebuie să conțină ORIGINI CU SCHEMĂ (ex: https://eauto.md)
CSRF_TRUSTED_ORIGINS = env_csv("CSRF_TRUSTED_ORIGINS", "")
CORS_ALLOWED_ORIGINS  = env_csv("CORS_ALLOWED_ORIGINS", "http://localhost:3000")

# --- Proxy SSL (Caddy) & cookie flags ---
SECURE_PROXY_SSL_HEADER = env_tuple2("SECURE_PROXY_SSL_HEADER", None)  # ex: ('HTTP_X_FORWARDED_PROTO','https')
USE_X_FORWARDED_HOST    = env_bool("USE_X_FORWARDED_HOST", False)
CSRF_COOKIE_SECURE      = env_bool("CSRF_COOKIE_SECURE", False)
SESSION_COOKIE_SECURE   = env_bool("SESSION_COOKIE_SECURE", False)

# --- DRF ---
REST_FRAMEWORK = {
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 12,
}

# --- Celery / Redis ---
CELERY_BROKER_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
CELERY_RESULT_BACKEND = os.getenv("REDIS_URL", "redis://redis:6379/0")

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
CELERY_BEAT_SCHEDULER = "django_celery_beat.schedulers:DatabaseScheduler"
CELERY_TIMEZONE = "Europe/Chisinau"
