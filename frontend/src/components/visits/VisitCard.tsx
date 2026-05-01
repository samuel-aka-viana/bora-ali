import type { Visit } from "../../types/visit";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { fmtDate, fmtRating, fmtPrice } from "../../utils/formatters";
import { AuthImage } from "../ui/AuthImage";
import { visitsService } from "../../services/visits.service";

type Props = {
  visit: Visit;
  onEdit?: () => void;
  onDelete?: () => void;
};

export function VisitCard({ visit, onEdit, onDelete }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState<Visit | null>(
    visit.items !== undefined ? visit : null
  );
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!open || details?.items !== undefined) {
      return;
    }

    let cancelled = false;
    setLoadingDetails(true);
    setLoadError("");

    visitsService
      .get(visit.public_id)
      .then((loaded) => {
        if (!cancelled) {
          setDetails(loaded);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError(t("visitCard.loadError"));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingDetails(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [details, open, t, visit.public_id]);

  const visibleItems = details?.items ?? visit.items ?? [];

  return (
    <Card>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-semibold">{fmtDate(visit.visited_at)}</p>
          {visit.would_return && (
            <span className="text-xs text-success font-medium">{t("visitCard.wouldReturn")} ✓</span>
          )}
        </div>
        {(onEdit || onDelete) && (
          <div className="flex gap-2 shrink-0">
            {onEdit && <Button size="sm" variant="secondary" onClick={onEdit}>{t("visitCard.edit")}</Button>}
            {onDelete && <Button size="sm" variant="danger" onClick={onDelete}>{t("visitCard.delete")}</Button>}
          </div>
        )}
      </div>
      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted">
        <span>{t("visitCard.overall")}: {fmtRating(visit.overall_rating)}</span>
        <span>{t("visitCard.environment")}: {fmtRating(visit.environment_rating)}</span>
        <span>{t("visitCard.service")}: {fmtRating(visit.service_rating)}</span>
      </div>
      {visit.general_notes && (
        <p className="mt-2 text-sm text-muted">{visit.general_notes}</p>
      )}
      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? t("visitCard.hideDetails") : t("visitCard.details")}
        </Button>
        {loadingDetails && <span className="text-xs text-muted">{t("common.loading")}</span>}
      </div>
      {loadError && <p className="mt-2 text-sm text-danger">{loadError}</p>}
      {open && visibleItems.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3 sm:grid-cols-3">
          {visibleItems.map((it) => (
            <div key={it.public_id} className="overflow-hidden rounded-xl border border-border bg-surface text-sm">
              {it.photo ? (
                <AuthImage
                  src={it.photo}
                  alt={it.name}
                  className="h-24 w-full object-cover"
                />
              ) : (
                <div className="flex h-24 w-full items-center justify-center bg-muted/10 text-xs text-muted">
                  {t("visitCard.noPhoto")}
                </div>
              )}
              <div className="space-y-0.5 p-2">
                <p className="truncate font-medium">{it.name}</p>
                <p className="text-xs text-muted">{t(`itemType.${it.type}`)}</p>
                <p className="text-xs text-muted">{fmtRating(it.rating)} · {fmtPrice(it.price)}</p>
                {it.notes && <p className="truncate text-xs text-muted">{it.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
      {open && !loadingDetails && !loadError && visibleItems.length === 0 && (
        <p className="mt-2 text-sm text-muted">{t("visitCard.empty")}</p>
      )}
    </Card>
  );
}
