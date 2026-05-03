import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/useAuth";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { PasswordInput } from "../components/ui/PasswordInput";
import { ErrorMessage } from "../components/ui/ErrorMessage";
import { LanguageToggle } from "../components/ui/LanguageToggle";
import { GoogleSignInButton } from "../components/auth/GoogleSignInButton";
import { getApiErrorState } from "../services/api-errors";
import { SESSION_INVALIDATED_KEY } from "../utils/constants";

export default function LoginPage() {
  const { t } = useTranslation();
  const { login, googleLogin } = useAuth();
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showSessionMessage] = useState(() => {
    if (localStorage.getItem(SESSION_INVALIDATED_KEY)) {
      localStorage.removeItem(SESSION_INVALIDATED_KEY);
      return true;
    }
    return false;
  });

  return (
    <div className="max-w-sm mx-auto p-6 mt-16 space-y-4">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!username.trim() || !password.trim()) {
            setErr(t("auth.login.emptyFields"));
            return;
          }
          try {
            setErr("");
            setFieldErrors({});
            setSubmitting(true);
            await login(username, password);
            nav("/places");
          } catch (error) {
            const apiError = getApiErrorState(error, t("auth.login.error"));
            setErr(apiError.message);
            setFieldErrors(apiError.fieldErrors);
          } finally {
            setSubmitting(false);
          }
        }}
        className="space-y-4"
      >
        <h1 className="font-fraunces text-3xl font-bold text-center text-text">
          {t("auth.login.title")}
        </h1>
        <p className="text-center -mt-2 text-sm text-text/75">{t("auth.login.subtitle")}</p>
        {showSessionMessage && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {t("auth.login.sessionExpired")}
          </div>
        )}
        <Input
          label={t("auth.login.username")}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          error={fieldErrors.username}
        />
        <PasswordInput
          label={t("auth.login.password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
        />
        {err && <ErrorMessage message={err} />}
        <Button type="submit" className="w-full" loading={submitting}>
          {t("auth.login.submit")}
        </Button>
        <GoogleSignInButton
          onSuccess={async (idToken) => {
            try {
              setErr("");
              setFieldErrors({});
              await googleLogin(idToken);
              nav("/places");
            } catch (error) {
              const apiError = getApiErrorState(error, t("auth.login.error"));
              setErr(apiError.message);
              setFieldErrors(apiError.fieldErrors);
            }
          }}
        />
        <p className="text-center text-sm text-text/75">
          {t("auth.login.noAccount")}{" "}
          <Link to="/register" className="font-semibold text-primary">
            {t("auth.login.register")}
          </Link>
        </p>
        <div className="flex justify-center pt-1">
          <LanguageToggle />
        </div>
      </form>
    </div>
  );
}
