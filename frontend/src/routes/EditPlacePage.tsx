import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { placesService } from "../services/places.service";
import type { Place } from "../types/place";
import { PlaceForm } from "../components/places/PlaceForm";
import { LoadingState } from "../components/ui/LoadingState";
import { BackButton } from "../components/ui/BackButton";

export default function EditPlacePage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const nav = useNavigate();
  const [place, setPlace] = useState<Place | null>(null);

  useEffect(() => {
    placesService.get(Number(id)).then((loadedPlace) => setPlace(loadedPlace));
  }, [id]);

  if (!place) return <LoadingState />;

  return (
    <div className="max-w-xl mx-auto p-4">
      <BackButton fallbackTo={`/places/${place.id}`} />
      <h1 className="font-fraunces text-2xl font-bold mb-4 text-text">{t("editPlace.title")}</h1>
      <PlaceForm
        initial={place}
        onSubmit={async (d) => {
          await placesService.update(place.id, d);
          nav(`/places/${place.id}`);
        }}
      />
    </div>
  );
}
