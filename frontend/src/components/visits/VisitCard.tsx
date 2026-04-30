import type { Visit } from "../../types/visit";
import { Card } from "../ui/Card";
import { fmtDate, fmtRating, fmtPrice } from "../../utils/formatters";

export function VisitCard({ visit }: { visit: Visit }) {
  return (
    <Card>
      <div className="flex justify-between items-start">
        <p className="font-semibold">{fmtDate(visit.visited_at)}</p>
        {visit.would_return && (
          <span className="text-xs text-success font-medium">Would return ✓</span>
        )}
      </div>
      <div className="text-sm text-muted mt-1 space-x-3">
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
            <li key={it.id} className="text-sm flex justify-between">
              <span>
                {it.name}{" "}
                <span className="text-muted text-xs">({it.type})</span>
              </span>
              <span className="text-muted">
                {fmtRating(it.rating)} · {fmtPrice(it.price)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
