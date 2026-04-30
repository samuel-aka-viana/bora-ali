import type { PlaceStatus } from "../../types/place";

const map: Record<PlaceStatus, string> = {
  want_to_visit: "bg-yellow-100 text-yellow-700",
  visited: "bg-green-100 text-green-700",
  favorite: "bg-red-100 text-primary",
  would_not_return: "bg-red-100 text-danger",
};

const labels: Record<PlaceStatus, string> = {
  want_to_visit: "Want to visit",
  visited: "Visited",
  favorite: "Favorite",
  would_not_return: "Would not return",
};

export function Badge({ status }: { status: PlaceStatus }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap px-2 py-0.5 rounded-full text-xs font-medium ${map[status]}`}>
      {labels[status]}
    </span>
  );
}
