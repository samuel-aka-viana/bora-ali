import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { placesService } from "../services/places.service";
import type { Place } from "../types/place";
import { PlaceForm } from "../components/places/PlaceForm";
import { LoadingState } from "../components/ui/LoadingState";

export default function EditPlacePage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [place, setPlace] = useState<Place | null>(null);

  useEffect(() => {
    placesService.get(Number(id)).then(setPlace as any);
  }, [id]);

  if (!place) return <LoadingState />;

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Edit place</h1>
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
