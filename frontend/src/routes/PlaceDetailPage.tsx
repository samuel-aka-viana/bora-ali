import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { placesService, type PlaceWithVisits } from "../services/places.service";
import { visitsService } from "../services/visits.service";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { LoadingState } from "../components/ui/LoadingState";
import { VisitCard } from "../components/visits/VisitCard";
import { BackButton } from "../components/ui/BackButton";
import { fmtPrice, fmtRating } from "../utils/formatters";

export default function PlaceDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [place, setPlace] = useState<PlaceWithVisits | null>(null);

  useEffect(() => {
    placesService.get(Number(id)).then(setPlace);
  }, [id]);

  if (!place) return <LoadingState />;

  const hasConsumables = place.consumables_count > 0;

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <BackButton />
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="break-words text-2xl font-bold">{place.name}</h1>
            <p className="text-muted">{place.category}</p>
            <div className="mt-1">
              <Badge status={place.status} />
            </div>
          </div>
          <div className="flex w-full gap-2 sm:w-auto sm:flex-shrink-0">
            <Link to={`/places/${place.id}/edit`} className="flex-1 sm:flex-none">
              <Button variant="secondary" size="sm" className="w-full sm:w-auto">
                Edit
              </Button>
            </Link>
            <Button
              variant="danger"
              size="sm"
              className="flex-1 sm:flex-none"
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

      <Card>
        <h2 className="text-lg font-semibold">Consumables summary</h2>
        {hasConsumables ? (
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase text-muted">Items logged</p>
              <p className="text-xl font-semibold">{place.consumables_count}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted">Average item rating</p>
              <p className="text-xl font-semibold">
                {place.average_consumable_rating == null
                  ? "N/A"
                  : fmtRating(place.average_consumable_rating)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted">Total spent</p>
              <p className="text-xl font-semibold">
                {place.total_consumed_amount == null
                  ? "N/A"
                  : fmtPrice(place.total_consumed_amount)}
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted">
            Add a visit with food or drinks consumed to track prices, comments, and average ratings.
          </p>
        )}
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">Visits ({place.visits.length})</h2>
        <Link to={`/places/${place.id}/visits/new`} className="w-full sm:w-auto">
          <Button size="sm" className="w-full sm:w-auto">+ Add visit</Button>
        </Link>
      </div>

      {place.visits.length === 0 ? (
        <p className="text-muted text-sm text-center py-6">No visits yet.</p>
      ) : (
        place.visits.map((v) => (
          <VisitCard
            key={v.id}
            visit={v}
            onEdit={() => nav(`/visits/${v.id}/edit`, { state: { visit: v } })}
            onDelete={async () => {
              await visitsService.remove(v.id);
              setPlace({ ...place, visits: place.visits.filter((x) => x.id !== v.id) });
            }}
          />
        ))
      )}
    </div>
  );
}
