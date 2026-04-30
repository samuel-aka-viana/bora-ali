import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { authService } from "../services/auth.service";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { ErrorMessage } from "../components/ui/ErrorMessage";
import { LanguageToggle } from "../components/ui/LanguageToggle";
import { getApiErrorState } from "../services/api-errors";

export default function RegisterPage() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const [f, setF] = useState({ username: "", email: "", password: "", confirm_password: "" });
  const [err, setErr] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const upd = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF({ ...f, [k]: e.target.value });

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
            await authService.register(f);
            nav("/login");
          } catch (error) {
            const apiError = getApiErrorState(error, t("auth.register.error"));
            setErr(apiError.message);
            setFieldErrors(apiError.fieldErrors);
          }
        }}
        className="space-y-4"
      >
        <h1 className="font-fraunces text-3xl font-bold text-center text-text">
          {t("auth.register.title")}
        </h1>
        <Input label={t("auth.register.username")} value={f.username} onChange={upd("username")} error={fieldErrors.username} />
        <Input label={t("auth.register.email")} type="email" value={f.email} onChange={upd("email")} error={fieldErrors.email} />
        <Input label={t("auth.register.password")} type="password" value={f.password} onChange={upd("password")} error={fieldErrors.password} />
        <Input
          label={t("auth.register.confirmPassword")}
          type="password"
          value={f.confirm_password}
          onChange={upd("confirm_password")}
          error={fieldErrors.confirm_password}
        />
        {err && <ErrorMessage message={err} />}
        <Button type="submit" className="w-full">
          {t("auth.register.submit")}
        </Button>
        <p className="text-center text-sm text-muted">
          {t("auth.register.hasAccount")}{" "}
          <Link to="/login" className="text-primary font-medium">
            {t("auth.register.signIn")}
          </Link>
        </p>
      </form>
    </div>
  );
}
