import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { placesService, type PlaceWithVisits } from "../services/places.service";
import { visitsService } from "../services/visits.service";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { LoadingState } from "../components/ui/LoadingState";
import { VisitCard } from "../components/visits/VisitCard";
import { BackButton } from "../components/ui/BackButton";
import { MapModal } from "../components/ui/MapModal";
import { fmtPrice, fmtRating } from "../utils/formatters";

export default function PlaceDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const nav = useNavigate();
  const [place, setPlace] = useState<PlaceWithVisits | null>(null);
  const [mapOpen, setMapOpen] = useState(false);

  useEffect(() => {
    placesService.get(id!).then(setPlace);
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
            <Link to={`/places/${place.public_id}/edit`} className="flex-1 sm:flex-none">
              <Button variant="secondary" size="sm" className="w-full sm:w-auto">
                {t("placeDetail.edit")}
              </Button>
            </Link>
            <Button
              variant="danger"
              size="sm"
              className="flex-1 sm:flex-none"
              onClick={async () => {
                await placesService.remove(place.public_id);
                nav("/places");
              }}
            >
              {t("placeDetail.delete")}
            </Button>
          </div>
        </div>
        {place.address && <p className="mt-2 text-muted text-sm">{place.address}</p>}
        {place.instagram_url && (
          <a href={place.instagram_url} className="text-primary text-sm block mt-1" target="_blank" rel="noreferrer">
            {t("placeDetail.instagram")}
          </a>
        )}
        {place.latitude && place.longitude && (
          <button
            type="button"
            onClick={() => setMapOpen(true)}
            className="flex items-center gap-1 text-primary text-sm mt-1 transition hover:underline"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current stroke-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            {t("placeDetail.maps")}
          </button>
        )}
        {place.maps_url && !place.latitude && (
          <a href={place.maps_url} className="text-primary text-sm block mt-1" target="_blank" rel="noreferrer">
            {t("placeDetail.maps")}
          </a>
        )}
        {place.notes && <p className="mt-2 text-sm">{place.notes}</p>}
      </Card>

      <Card>
        <h2 className="text-lg font-semibold">{t("placeDetail.consumables.title")}</h2>
        {hasConsumables ? (
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase text-muted">{t("placeDetail.consumables.items")}</p>
              <p className="text-xl font-semibold">{place.consumables_count}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted">{t("placeDetail.consumables.avgRating")}</p>
              <p className="text-xl font-semibold">
                {place.average_consumable_rating == null
                  ? t("common.na")
                  : fmtRating(place.average_consumable_rating)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted">{t("placeDetail.consumables.totalSpent")}</p>
              <p className="text-xl font-semibold">
                {place.total_consumed_amount == null
                  ? t("common.na")
                  : fmtPrice(place.total_consumed_amount)}
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted">{t("placeDetail.consumables.empty")}</p>
        )}
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">
          {t("placeDetail.visits.title", { count: place.visits.length })}
        </h2>
        <Link to={`/places/${place.public_id}/visits/new`} className="w-full sm:w-auto">
          <Button size="sm" className="w-full sm:w-auto">{t("placeDetail.visits.add")}</Button>
        </Link>
      </div>

      {place.visits.length === 0 ? (
        <p className="text-muted text-sm text-center py-6">{t("placeDetail.visits.empty")}</p>
      ) : (
        place.visits.map((v) => (
          <VisitCard
            key={v.public_id}
            visit={v}
            onEdit={() => nav(`/visits/${v.public_id}/edit`, { state: { visit: v } })}
            onDelete={async () => {
              await visitsService.remove(v.public_id);
              setPlace({ ...place, visits: place.visits.filter((x) => x.public_id !== v.public_id) });
            }}
          />
        ))
      )}

      {place.latitude && place.longitude && (
        <MapModal
          open={mapOpen}
          onClose={() => setMapOpen(false)}
          name={place.name}
          latitude={place.latitude}
          longitude={place.longitude}
          mapsUrl={place.maps_url}
        />
      )}
    </div>
  );
}
