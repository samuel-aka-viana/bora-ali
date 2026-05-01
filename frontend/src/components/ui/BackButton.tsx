import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button } from "./Button";

type Props = {
  fallbackTo?: string;
  label?: string;
};

export function BackButton({ fallbackTo = "/places", label }: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="gap-2 px-3 text-muted hover:text-text"
        onClick={() => {
          if (window.history.state?.idx > 0) {
            navigate(-1);
            return;
          }
          navigate(fallbackTo);
        }}
      >
        <span aria-hidden="true">&larr;</span>
        {label || t("common.back")}
      </Button>
      <Link
        to="/places"
        className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text shadow-sm transition hover:border-muted/50 hover:bg-background"
      >
        <span aria-hidden="true">⌂</span>
        {t("common.home")}
      </Link>
    </div>
  );
}
