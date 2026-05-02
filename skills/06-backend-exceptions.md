# Backend: Exceções Semânticas

## Regra

Nunca lançar exceções DRF cruas. Todas as exceções passam por `core/exceptions.py`.

## core/exceptions.py

```python
from rest_framework.exceptions import APIException
from rest_framework import status

class SemanticAPIException(APIException):
    def __init__(self, code: str, detail: str, status_code=status.HTTP_400_BAD_REQUEST):
        self.status_code = status_code
        self.detail = {"code": code, "detail": detail}

# Exemplos de uso:
class AuthenticationFailed(SemanticAPIException):
    def __init__(self):
        super().__init__("authentication_failed", "Credenciais inválidas.", status.HTTP_401_UNAUTHORIZED)

class SessionExpired(SemanticAPIException):
    def __init__(self):
        super().__init__("session_expired", "Sessão expirada.", status.HTTP_401_UNAUTHORIZED)

class SessionInvalidated(SemanticAPIException):
    def __init__(self):
        super().__init__("session_invalidated", "Sessão encerrada em outro dispositivo.", status.HTTP_401_UNAUTHORIZED)

class PermissionDenied(SemanticAPIException):
    def __init__(self):
        super().__init__("permission_denied", "Sem permissão.", status.HTTP_403_FORBIDDEN)
```

## core/exception_handler.py

```python
from rest_framework.views import exception_handler
from rest_framework.response import Response

def semantic_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is not None and isinstance(response.data, dict):
        # já tem code+detail → passa direto
        if "code" in response.data:
            return response
        # transforma erros de validação em fieldErrors
        return response
    return response
```

## Frontend — consumo

```typescript
// services/api-errors.ts
export function getApiErrorState(error: unknown, fallback: string) {
  const data = (error as AxiosError)?.response?.data as Record<string, unknown>;
  const message = (data?.detail as string) ?? fallback;
  const fieldErrors: Record<string, string> = {};
  for (const [key, val] of Object.entries(data ?? {})) {
    if (key !== "detail" && key !== "code" && Array.isArray(val)) {
      fieldErrors[key] = (val as string[])[0];
    }
  }
  return { message, fieldErrors };
}
```

Usar em todo `catch` de formulário:

```typescript
} catch (error) {
  const { message, fieldErrors } = getApiErrorState(error, t("form.saveError"));
  setSubmitError(message);
  setFieldErrors(fieldErrors);
}
```
