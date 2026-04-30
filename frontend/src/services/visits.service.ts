import { api } from "./api";
import { toFormData, hasFile, stripStringImages } from "./form-data";
import type { Visit } from "../types/visit";

type VisitPayload = Partial<Omit<Visit, "photo">> & { photo?: string | File };

function toPayload(data: VisitPayload) {
  const d = stripStringImages(data as Record<string, unknown>);
  return hasFile(d) ? toFormData(d) : d;
}

export const visitsService = {
  create: (placeId: number, data: VisitPayload) =>
    api.post<Visit>(`/places/${placeId}/visits/`, toPayload(data)).then((r) => r.data),

  update: (id: number, data: VisitPayload) =>
    api.patch<Visit>(`/visits/${id}/`, toPayload(data)).then((r) => r.data),

  remove: (id: number) => api.delete(`/visits/${id}/`),
};
