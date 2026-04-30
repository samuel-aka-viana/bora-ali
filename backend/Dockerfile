FROM python:3.12-alpine AS builder

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

RUN apk add --no-cache build-base libffi-dev musl-dev postgresql-dev

COPY requirements.txt .
RUN python -m venv /venv && \
    /venv/bin/pip install --upgrade pip && \
    /venv/bin/pip install gunicorn && \
    /venv/bin/pip install -r requirements.txt

COPY . .


FROM python:3.12-alpine AS runtime

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/venv/bin:$PATH" \
    DJANGO_SETTINGS_MODULE=config.settings

RUN apk add --no-cache postgresql-libs

COPY --from=builder /venv /venv
COPY --from=builder /app /app

RUN addgroup -S app && adduser -S app -G app && chown -R app:app /app
USER app

EXPOSE 8000

CMD ["gunicorn", "config.wsgi:application", "-b", "0.0.0.0:8000", "--workers", "2", "--threads", "4"]
