import { useNavigate } from "react-router-dom";
import { placesService } from "../services/places.service";
import { PlaceForm } from "../components/places/PlaceForm";

export default function NewPlacePage() {
  const nav = useNavigate();
  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">New place</h1>
      <PlaceForm
        onSubmit={async (d) => {
          const p = await placesService.create(d);
          nav(`/places/${p.id}`);
        }}
      />
    </div>
  );
}
