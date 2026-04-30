import { Link } from "react-router-dom";
import type { Place } from "../../types/place";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";

export function PlaceCard({ place }: { place: Place }) {
  return (
    <Link to={`/places/${place.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{place.name}</h3>
            <p className="text-muted text-sm">{place.category}</p>
            {place.address && <p className="text-muted text-xs mt-0.5 truncate">{place.address}</p>}
          </div>
          <Badge status={place.status} />
        </div>
      </Card>
    </Link>
  );
}
