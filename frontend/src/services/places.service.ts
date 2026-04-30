import { api } from "./api";
import type { Place, PlaceStatus } from "../types/place";

export interface Page<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const placesService = {
  list: (params: { page?: number; status?: PlaceStatus; search?: string } = {}) =>
    api.get<Page<Place>>("/places/", { params }).then((r) => r.data),

  get: (id: number) => api.get<Place & { visits: any[] }>(`/places/${id}/`).then((r) => r.data),

  create: (data: Partial<Place>) => api.post<Place>("/places/", data).then((r) => r.data),

  update: (id: number, data: Partial<Place>) =>
    api.patch<Place>(`/places/${id}/`, data).then((r) => r.data),

  remove: (id: number) => api.delete(`/places/${id}/`),
};
