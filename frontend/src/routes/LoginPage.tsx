import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/useAuth";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { ErrorMessage } from "../components/ui/ErrorMessage";
import { LanguageToggle } from "../components/ui/LanguageToggle";
import { getApiErrorState } from "../services/api-errors";
import { SESSION_INVALIDATED_KEY } from "../utils/constants";

export default function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [sessionMsg, setSessionMsg] = useState("");

  useEffect(() => {
    if (localStorage.getItem(SESSION_INVALIDATED_KEY)) {
      localStorage.removeItem(SESSION_INVALIDATED_KEY);
      setSessionMsg(t("auth.login.sessionExpired"));
    }
  }, [t]);

  return (
    <div className="max-w-sm mx-auto p-6 mt-16 space-y-4">
      <div className="flex justify-end">
        <LanguageToggle />
      </div>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            setErr("");
            setFieldErrors({});
            await login(username, password);
            nav("/places");
          } catch (error) {
            const apiError = getApiErrorState(error, t("auth.login.error"));
            setErr(apiError.message);
            setFieldErrors(apiError.fieldErrors);
          }
        }}
        className="space-y-4"
      >
        <h1 className="font-fraunces text-3xl font-bold text-center text-text">
          {t("auth.login.title")}
        </h1>
        <p className="text-center text-sm text-muted -mt-2">{t("auth.login.subtitle")}</p>
        {sessionMsg && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {sessionMsg}
          </div>
        )}
        <Input
          label={t("auth.login.username")}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          error={fieldErrors.username}
        />
        <Input
          label={t("auth.login.password")}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
        />
        {err && <ErrorMessage message={err} />}
        <Button type="submit" className="w-full">
          {t("auth.login.submit")}
        </Button>
        <p className="text-center text-sm text-muted">
          {t("auth.login.noAccount")}{" "}
          <Link to="/register" className="text-primary font-medium">
            {t("auth.login.register")}
          </Link>
        </p>
      </form>
    </div>
  );
}
