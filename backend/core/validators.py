import io
import logging

from PIL import Image
from rest_framework import serializers

logger = logging.getLogger(__name__)

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_PILLOW_FORMATS = {"JPEG", "PNG", "WEBP"}
MAX_IMAGE_BYTES = 10 * 1024 * 1024  # 10 MB
MAX_IMAGE_PIXELS = 40_000_000  # 40 MP — proteção contra image bomb


def validate_image_upload(file):
    """Valida imagem enviada: tamanho, tipo e conteúdo real via Pillow."""
    if file is None:
        return file

    # Tamanho declarado pelo Django no InMemoryUploadedFile/TemporaryUploadedFile
    size = getattr(file, "size", None)
    if size is None:
        try:
            file.seek(0, 2)
            size = file.tell()
            file.seek(0)
        except Exception:
            pass

    if size is not None and size > MAX_IMAGE_BYTES:
        raise serializers.ValidationError(
            "Imagem muito grande. Tamanho máximo permitido: 10 MB."
        )

    # Tipo declarado pelo browser — rejeitamos SVG/HTML antes de ler o conteúdo
    content_type = getattr(file, "content_type", None)
    if content_type and content_type not in ALLOWED_CONTENT_TYPES:
        raise serializers.ValidationError(
            "Formato não permitido. Envie JPEG, PNG ou WEBP."
        )

    # Lê os bytes para inspecionar conteúdo real
    try:
        file.seek(0)
        raw = file.read()
        file.seek(0)
    except Exception:
        raise serializers.ValidationError("Não foi possível ler o arquivo.")

    # Rejeita SVG por magic bytes (independente do content-type declarado)
    sniff = raw[:1024].lower()
    if b"<svg" in sniff or b"<!doctype svg" in sniff:
        raise serializers.ValidationError("SVG não é permitido.")

    # Valida via Pillow: formato real, dimensões e integridade
    try:
        img = Image.open(io.BytesIO(raw))

        if img.format not in ALLOWED_PILLOW_FORMATS:
            raise serializers.ValidationError(
                "Formato não permitido. Envie JPEG, PNG ou WEBP."
            )

        if img.width * img.height > MAX_IMAGE_PIXELS:
            raise serializers.ValidationError(
                "Imagem com dimensões muito grandes. Reduza a resolução."
            )

        # Força decode completo para detectar arquivos corrompidos/truncados
        img.load()

    except serializers.ValidationError:
        raise
    except Exception:
        logger.warning("Arquivo de imagem inválido rejeitado: %s", getattr(file, "name", "unknown"))
        raise serializers.ValidationError("Arquivo de imagem inválido ou corrompido.")

    file.seek(0)
    return file


ALLOWED_URL_SCHEMES = {"http", "https"}


def validate_safe_url(value: str) -> str:
    """Rejeita schemes perigosos como javascript:, data:, file:."""
    if not value:
        return value
    from urllib.parse import urlparse
    scheme = urlparse(value).scheme.lower()
    if scheme and scheme not in ALLOWED_URL_SCHEMES:
        raise serializers.ValidationError(
            "URL inválida. Apenas http e https são permitidos."
        )
    return value
