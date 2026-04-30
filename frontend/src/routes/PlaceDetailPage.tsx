import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { placesService } from "../services/places.service";
import type { Place } from "../types/place";
import type { Visit } from "../types/visit";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { LoadingState } from "../components/ui/LoadingState";
import { VisitCard } from "../components/visits/VisitCard";

type PlaceWithVisits = Place & { visits: Visit[] };

export default function PlaceDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [place, setPlace] = useState<PlaceWithVisits | null>(null);

  useEffect(() => {
    placesService.get(Number(id)).then(setPlace as any);
  }, [id]);

  if (!place) return <LoadingState />;

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <Card>
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold">{place.name}</h1>
            <p className="text-muted">{place.category}</p>
            <div className="mt-1">
              <Badge status={place.status} />
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Link to={`/places/${place.id}/edit`}>
              <Button variant="secondary" size="sm">
                Edit
              </Button>
            </Link>
            <Button
              variant="danger"
              size="sm"
              onClick={async () => {
                await placesService.remove(place.id);
                nav("/places");
              }}
            >
              Delete
            </Button>
          </div>
        </div>
        {place.address && <p className="mt-2 text-muted text-sm">{place.address}</p>}
        {place.instagram_url && (
          <a href={place.instagram_url} className="text-primary text-sm block mt-1" target="_blank" rel="noreferrer">
            Instagram
          </a>
        )}
        {place.maps_url && (
          <a href={place.maps_url} className="text-primary text-sm block mt-1" target="_blank" rel="noreferrer">
            Maps
          </a>
        )}
        {place.notes && <p className="mt-2 text-sm">{place.notes}</p>}
      </Card>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Visits ({place.visits.length})</h2>
        <Link to={`/places/${place.id}/visits/new`}>
          <Button size="sm">+ Add visit</Button>
        </Link>
      </div>

      {place.visits.length === 0 ? (
        <p className="text-muted text-sm text-center py-6">No visits yet.</p>
      ) : (
        place.visits.map((v) => <VisitCard key={v.id} visit={v} />)
      )}
    </div>
  );
}
