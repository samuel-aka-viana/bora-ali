import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

type Props = {
  onSuccess: (idToken: string) => void | Promise<void>;
};

const GOOGLE_SCRIPT_ID = "google-gis-client";

export function GoogleSignInButton({ onSuccess }: Props) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const onSuccessRef = useRef(onSuccess);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const clientId = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID;

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  useEffect(() => {
    if (!clientId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const initializeGoogle = () => {
      if (cancelled) return;

      const google = window.google;
      if (!google?.accounts?.id || !containerRef.current) {
        setLoading(false);
        setError(t("auth.login.googleError"));
        return;
      }

      containerRef.current.innerHTML = "";
      google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response.credential) {
            void onSuccessRef.current(response.credential);
          }
        },
      });
      google.accounts.id.renderButton(containerRef.current, {
        theme: "filled_blue",
        size: "large",
        shape: "pill",
        text: "continue_with",
        logo_alignment: "left",
        width: "100%",
      });
      setLoading(false);
    };

    if (window.google?.accounts?.id) {
      initializeGoogle();
      return () => {
        cancelled = true;
      };
    }

    let script = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null;
    const handleLoad = () => initializeGoogle();
    const handleError = () => {
      if (cancelled) return;
      setLoading(false);
      setError(t("auth.login.googleError"));
    };

    if (!script) {
      script = document.createElement("script");
      script.id = GOOGLE_SCRIPT_ID;
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }

    script.addEventListener("load", handleLoad);
    script.addEventListener("error", handleError);

    return () => {
      cancelled = true;
      script?.removeEventListener("load", handleLoad);
      script?.removeEventListener("error", handleError);
    };
  }, [clientId, t]);

  if (!clientId) {
    return null;
  }

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-surface/70 p-3 shadow-sm">
      <p className="text-sm font-medium text-text">{t("auth.login.google")}</p>
      {loading && <p className="text-sm text-text/75">{t("auth.login.googleLoading")}</p>}
      <div ref={containerRef} />
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
