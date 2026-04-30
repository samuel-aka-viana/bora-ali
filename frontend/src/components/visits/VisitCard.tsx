import type { Visit } from "../../types/visit";
import { Card } from "../ui/Card";
import { fmtDate, fmtRating, fmtPrice } from "../../utils/formatters";

export function VisitCard({ visit }: { visit: Visit }) {
  return (
    <Card>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <p className="font-semibold">{fmtDate(visit.visited_at)}</p>
        {visit.would_return && (
          <span className="text-xs text-success font-medium">Would return ✓</span>
        )}
      </div>
      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted">
        <span>Overall: {fmtRating(visit.overall_rating)}</span>
        <span>Env: {fmtRating(visit.environment_rating)}</span>
        <span>Service: {fmtRating(visit.service_rating)}</span>
      </div>
      {visit.general_notes && (
        <p className="mt-2 text-sm text-muted">{visit.general_notes}</p>
      )}
      {visit.items.length > 0 && (
        <ul className="mt-3 space-y-1 border-t border-border pt-2">
          {visit.items.map((it) => (
            <li key={it.id} className="flex flex-col gap-0.5 text-sm sm:flex-row sm:justify-between sm:gap-3">
              <span className="min-w-0 break-words">
                {it.name}{" "}
                <span className="text-muted text-xs">({it.type})</span>
                {it.notes && (
                  <span className="mt-0.5 block text-xs text-muted">{it.notes}</span>
                )}
              </span>
              <span className="shrink-0 text-muted">
                {fmtRating(it.rating)} · {fmtPrice(it.price)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
