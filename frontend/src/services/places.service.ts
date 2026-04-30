import { api } from "./api";
import { toFormData, hasFile, stripStringImages } from "./form-data";
import type { Place, PlaceStatus } from "../types/place";
import type { Visit } from "../types/visit";

export interface Page<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export type PlaceWithVisits = Place & { visits: Visit[] } & {
  consumables_count: number;
  average_consumable_rating: number | null;
  total_consumed_amount: string | null;
};

type PlacePayload = Partial<Omit<Place, "cover_photo">> & { cover_photo?: string | File };

function toPayload(data: PlacePayload) {
  const d = stripStringImages(data as Record<string, unknown>);
  return hasFile(d) ? toFormData(d) : d;
}

export const placesService = {
  list: (params: { page?: number; status?: PlaceStatus; search?: string } = {}) =>
    api.get<Page<Place>>("/places/", { params }).then((r) => r.data),

  get: (id: number) => api.get<PlaceWithVisits>(`/places/${id}/`).then((r) => r.data),

  create: (data: PlacePayload) =>
    api.post<Place>("/places/", toPayload(data)).then((r) => r.data),

  update: (id: number, data: PlacePayload) =>
    api.patch<Place>(`/places/${id}/`, toPayload(data)).then((r) => r.data),

  remove: (id: number) => api.delete(`/places/${id}/`),
};
