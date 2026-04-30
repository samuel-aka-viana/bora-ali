import { api } from "./api";
import type { VisitItem } from "../types/visit-item";

export const visitItemsService = {
  create: (visitId: number, data: Partial<VisitItem>) =>
    api.post<VisitItem>(`/visits/${visitId}/items/`, data).then((r) => r.data),

  update: (id: number, data: Partial<VisitItem>) =>
    api.patch<VisitItem>(`/visit-items/${id}/`, data).then((r) => r.data),

  remove: (id: number) => api.delete(`/visit-items/${id}/`),
};
