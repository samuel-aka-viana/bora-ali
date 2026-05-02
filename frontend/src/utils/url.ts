export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const ALLOWED_IMAGE_ACCEPT = ALLOWED_IMAGE_TYPES.join(",");
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB

export type ImageValidationError = "type" | "size" | null;

/**
 * Valida tipo e tamanho de um arquivo antes do envio (validação de UX).
 * A validação real de segurança ocorre no backend.
 */
export function validateImageFile(file: File): ImageValidationError {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as typeof ALLOWED_IMAGE_TYPES[number])) {
    return "type";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return "size";
  }
  return null;
}

const SAFE_SCHEMES = new Set(["http:", "https:"]);

/**
 * Retorna a URL original se o scheme for http/https.
 * Retorna string vazia para javascript:, data:, file: e qualquer outro scheme perigoso.
 * Usada como camada de defesa no frontend antes de renderizar href vindo da API.
 */
export function sanitizeUrl(url: string | undefined | null): string {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    return SAFE_SCHEMES.has(parsed.protocol) ? url : "";
  } catch {
    return "";
  }
}
