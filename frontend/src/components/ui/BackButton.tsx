import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "./Button";

type Props = {
  fallbackTo?: string;
  label?: string;
};

export function BackButton({ fallbackTo = "/places", label }: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      className="mb-4 gap-2 px-3 text-muted hover:text-text"
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
  );
}
