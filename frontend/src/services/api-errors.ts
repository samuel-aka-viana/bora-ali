import axios from "axios";

export type ApiErrorState = {
  code?: string;
  message: string;
  fieldErrors: Record<string, string>;
};

function normalizeFieldErrors(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).map(([field, fieldValue]) => {
      if (Array.isArray(fieldValue)) {
        return [field, String(fieldValue[0] ?? "")];
      }
      return [field, String(fieldValue ?? "")];
    }),
  );
}

export function getApiErrorState(error: unknown, fallbackMessage: string): ApiErrorState {
  if (!axios.isAxiosError(error)) {
    return { message: fallbackMessage, fieldErrors: {} };
  }

  const data = error.response?.data;
  if (!data || typeof data !== "object") {
    return { message: fallbackMessage, fieldErrors: {} };
  }

  const semanticMessage =
    typeof data.message === "string"
      ? data.message
      : typeof data.detail === "string"
        ? data.detail
        : fallbackMessage;

  const fieldErrors = normalizeFieldErrors(
    "field_errors" in data ? data.field_errors : data,
  );

  return {
    code: typeof data.code === "string" ? data.code : undefined,
    message: semanticMessage,
    fieldErrors,
  };
}
