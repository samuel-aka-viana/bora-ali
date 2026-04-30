import { api } from "./api";
import type { Visit } from "../types/visit";

export const visitsService = {
  create: (placeId: number, data: Partial<Visit>) =>
    api.post<Visit>(`/places/${placeId}/visits/`, data).then((r) => r.data),

  update: (id: number, data: Partial<Visit>) =>
    api.patch<Visit>(`/visits/${id}/`, data).then((r) => r.data),

  remove: (id: number) => api.delete(`/visits/${id}/`),
};
