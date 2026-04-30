import os
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")
AWS_S3_PUBLIC_URL = os.getenv("AWS_S3_PUBLIC_URL", "")
AWS_S3_PUBLIC_ENDPOINT = os.getenv("AWS_S3_PUBLIC_ENDPOINT", "")
AWS_S3_URL_EXPIRES_IN = int(os.getenv("AWS_S3_URL_EXPIRES_IN", "3600"))
AWS_STORAGE_BUCKET_NAME = os.getenv("AWS_STORAGE_BUCKET_NAME", "bora-ali")
AWS_S3_REGION_NAME = os.getenv("AWS_S3_REGION_NAME", "us-east-1")
AWS_S3_ENDPOINT_URL = os.getenv("AWS_S3_ENDPOINT_URL", "http://localhost:8081")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID", "")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY", "")

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "dev-secret")
DEBUG = os.getenv("DJANGO_DEBUG", "True") == "True"
ALLOWED_HOSTS = os.getenv("DJANGO_ALLOWED_HOSTS", "*").split(",")
USE_VERSITYGW = os.getenv("USE_VERSITYGW", "False") == "True"

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "django_filters",
    "corsheaders",
    "drf_spectacular",
    "accounts",
    "places",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.locale.LocaleMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("POSTGRES_DB"),
        "USER": os.getenv("POSTGRES_USER"),
        "PASSWORD": os.getenv("POSTGRES_PASSWORD"),
        "HOST": os.getenv("POSTGRES_HOST", "localhost"),
        "PORT": os.getenv("POSTGRES_PORT", "5432"),
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"
    },
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "pt-br"
TIME_ZONE = "America/Sao_Paulo"
USE_I18N = True
USE_TZ = True

LANGUAGES = [
    ("pt-br", "Português (Brasil)"),
    ("en", "English"),
]

LOCALE_PATHS = [BASE_DIR / "locale"]

STATIC_URL = "static/"
MEDIA_URL = "/media/"
MEDIA_ROOT = os.path.join(BASE_DIR, "media")

# VersityGW Object Storage Configuration
if USE_VERSITYGW:
    # Use VersityGW (S3-compatible) for file storage
    STORAGES = {
        "default": {
            "BACKEND": "storages.backends.s3boto3.S3Boto3Storage",
            "OPTIONS": {
                "bucket_name": os.getenv("AWS_STORAGE_BUCKET_NAME", "bora-ali"),
                "region_name": os.getenv("AWS_S3_REGION_NAME", "us-east-1"),
                "endpoint_url": os.getenv(
                    "AWS_S3_ENDPOINT_URL", "http://localhost:8081"
                ),
                "use_ssl": os.getenv("AWS_S3_USE_SSL", "False") == "True",
                "addressing_style": "path",
                "signature_version": "s3v4",
                "default_acl": None,
            },
        },
        "staticfiles": {
            "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
        },
    }
    public_media_base = os.getenv("AWS_S3_PUBLIC_URL", "").rstrip("/")
    if public_media_base:
        MEDIA_URL = f"{public_media_base}/"
    else:
        MEDIA_URL = f"{os.getenv('AWS_S3_ENDPOINT_URL', 'http://localhost:8080')}/{os.getenv('AWS_STORAGE_BUCKET_NAME', 'bora-ali')}/"
else:
    # Use local filesystem for development
    STORAGES = {
        "default": {
            "BACKEND": "django.core.files.storage.FileSystemStorage",
        },
        "staticfiles": {
            "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
        },
    }

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "accounts.authentication.SingleSessionJWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "EXCEPTION_HANDLER": "core.exception_handler.semantic_exception_handler",
    "DEFAULT_THROTTLE_CLASSES": (
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
        "rest_framework.throttling.ScopedRateThrottle",
    ),
    "DEFAULT_THROTTLE_RATES": {
        "anon": "100/hour",
        "user": "1000/hour",
        "auth": "10/minute",
    },
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

SPECTACULAR_SETTINGS = {
    "TITLE": "Bora Ali API",
    "VERSION": "0.1.0",
    "SERVE_INCLUDE_SCHEMA": False,
}

CORS_ALLOWED_ORIGINS = os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:5173").split(
    ","
)
CSRF_TRUSTED_ORIGINS = os.getenv(
    "CSRF_TRUSTED_ORIGINS",
    "http://localhost:5173,http://localhost:8080",
).split(",")

# Limite de tamanho de upload: protege contra request bodies gigantes.
# Arquivos maiores que 10 MB são rejeitados antes de chegar nos serializers.
DATA_UPLOAD_MAX_MEMORY_SIZE = 15 * 1024 * 1024  # 15 MB (inclui fields não-arquivo)
FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10 MB (spool em memória)

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
        },
    },
    "loggers": {
        # Loga queries SQL apenas em modo DEBUG — jamais em produção
        "django.db.backends": {
            "handlers": ["console"],
            "level": "DEBUG" if DEBUG else "WARNING",
            "propagate": False,
        },
        # Nunca loga headers de Authorization, cookies ou tokens
        "django.security": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
    },
}
