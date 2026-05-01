import type { Visit } from "../../types/visit";
import { useTranslation } from "react-i18next";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { fmtDate, fmtRating, fmtPrice } from "../../utils/formatters";
import { AuthImage } from "../ui/AuthImage";

type Props = {
  visit: Visit;
  onEdit?: () => void;
  onDelete?: () => void;
};

export function VisitCard({ visit, onEdit, onDelete }: Props) {
  const { t } = useTranslation();

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
      {visit.items.length > 0 && (
        <div className="mt-3 border-t border-border pt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {visit.items.map((it) => (
            <div key={it.public_id} className="bg-surface rounded-xl border border-border overflow-hidden text-sm">
              {it.photo ? (
                <AuthImage
                  src={it.photo}
                  alt={it.name}
                  className="w-full h-24 object-cover"
                />
              ) : (
                <div className="w-full h-24 bg-muted/10 flex items-center justify-center text-muted text-xs">
                  {t("visitCard.noPhoto")}
                </div>
              )}
              <div className="p-2 space-y-0.5">
                <p className="font-medium truncate">{it.name}</p>
                <p className="text-xs text-muted">{t(`itemType.${it.type}`)}</p>
                <p className="text-xs text-muted">{fmtRating(it.rating)} · {fmtPrice(it.price)}</p>
                {it.notes && <p className="text-xs text-muted truncate">{it.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
