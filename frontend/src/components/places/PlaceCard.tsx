import { Link } from "react-router-dom";
import type { Place } from "../../types/place";
import { Badge } from "../ui/Badge";

export function PlaceCard({ place }: { place: Place }) {
  return (
    <Link to={`/places/${place.id}`}>
      <div className="bg-surface rounded-2xl shadow-sm border border-border hover:shadow-md transition-shadow cursor-pointer overflow-hidden">
        {place.cover_photo && (
          <img
            src={place.cover_photo}
            alt={place.name}
            className="w-full h-28 object-cover"
          />
        )}
        <div className="flex justify-between items-start gap-3 p-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{place.name}</h3>
            <p className="text-muted text-sm">{place.category}</p>
            {place.address && <p className="text-muted text-xs mt-0.5 truncate">{place.address}</p>}
          </div>
          <Badge status={place.status} />
        </div>
      </div>
    </Link>
  );
}
