import { api } from "./api";
import { toFormData, hasFile, stripStringImages } from "./form-data";
import type { VisitItem } from "../types/visit-item";

type VisitItemPayload = Partial<Omit<VisitItem, "photo">> & { photo?: string | File };

function toPayload(data: VisitItemPayload) {
  const d = stripStringImages(data as Record<string, unknown>);
  return hasFile(d) ? toFormData(d) : d;
}

export const visitItemsService = {
  create: (visitId: number, data: VisitItemPayload) =>
    api.post<VisitItem>(`/visits/${visitId}/items/`, toPayload(data)).then((r) => r.data),

  update: (id: number, data: VisitItemPayload) =>
    api.patch<VisitItem>(`/visit-items/${id}/`, toPayload(data)).then((r) => r.data),

  remove: (id: number) => api.delete(`/visit-items/${id}/`),
};
