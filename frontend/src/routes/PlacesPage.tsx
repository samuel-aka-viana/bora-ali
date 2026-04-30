import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { placesService, type Page } from "../services/places.service";
import type { Place, PlaceStatus } from "../types/place";
import { PLACE_STATUSES } from "../utils/constants";
import { PlaceCard } from "../components/places/PlaceCard";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { EmptyState } from "../components/ui/EmptyState";
import { LoadingState } from "../components/ui/LoadingState";
import { ErrorMessage } from "../components/ui/ErrorMessage";
import { useAuth } from "../contexts/useAuth";

export default function PlacesPage() {
  const { logout } = useAuth();
  const [data, setData] = useState<Page<Place> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<PlaceStatus | "">("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    placesService
      .list({ page, search: search || undefined, status: (status as PlaceStatus) || undefined })
      .then(setData)
      .catch(() => setError("Failed to load places"))
      .finally(() => setLoading(false));
  }, [search, status, page]);

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Bora Ali</h1>
        <div className="flex w-full gap-2 sm:w-auto">
          <Link to="/places/new" className="flex-1 sm:flex-none">
            <Button size="sm" className="w-full sm:w-auto">+ New place</Button>
          </Link>
          <Button size="sm" variant="secondary" className="flex-1 sm:flex-none" onClick={logout}>
            Logout
          </Button>
        </div>
      </div>

      <Input
        placeholder="Search places..."
        value={search}
        onChange={(e) => {
          setPage(1);
          setSearch(e.target.value);
        }}
      />

      <div className="flex gap-2 flex-wrap">
        <Button
          size="sm"
          variant={status === "" ? "primary" : "secondary"}
          onClick={() => { setPage(1); setStatus(""); }}
        >
          All
        </Button>
        {PLACE_STATUSES.map((s) => (
          <Button
            key={s.value}
            size="sm"
            variant={status === s.value ? "primary" : "secondary"}
            onClick={() => { setPage(1); setStatus(s.value); }}
          >
            {s.label}
          </Button>
        ))}
      </div>

      {loading && <LoadingState />}
      {!loading && error && <ErrorMessage message={error} />}
      {!loading && !error && data?.count === 0 && (
        <EmptyState title="No places yet" description="Add your first place to get started." />
      )}
      {!loading && !error && data?.results.map((p) => <PlaceCard key={p.id} place={p} />)}

      {data && (data.next || data.previous) && (
        <div className="flex items-center justify-between gap-3">
          <Button variant="secondary" disabled={!data.previous} onClick={() => setPage((n) => n - 1)}>
            Previous
          </Button>
          <span className="text-muted text-sm text-center">Page {page}</span>
          <Button variant="secondary" disabled={!data.next} onClick={() => setPage((n) => n + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
