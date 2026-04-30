import type { PlaceStatus } from "../../types/place";
import { useTranslation } from "react-i18next";

const map: Record<PlaceStatus, string> = {
  want_to_visit: "bg-amber-50 text-amber-700 border border-amber-200",
  visited: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  favorite: "bg-red-50 text-primary border border-red-200",
  would_not_return: "bg-zinc-100 text-zinc-500 border border-zinc-200",
};

const icons: Record<PlaceStatus, string> = {
  want_to_visit: "👁",
  visited: "✓",
  favorite: "★",
  would_not_return: "✗",
};

export function Badge({ status }: { status: PlaceStatus }) {
  const { t } = useTranslation();

  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap px-2 py-0.5 rounded-full text-xs font-medium ${map[status]}`}
    >
      <span>{icons[status]}</span>
      {t(`status.${status}`)}
    </span>
  );
}
