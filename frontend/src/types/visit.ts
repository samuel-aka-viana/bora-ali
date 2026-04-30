import type { VisitItem } from "./visit-item";

export interface Visit {
  id: number;
  place: number;
  visited_at: string;
  environment_rating: number;
  service_rating: number;
  overall_rating: number;
  would_return: boolean;
  general_notes?: string;
  photo_path?: string;
  items: VisitItem[];
  created_at: string;
  updated_at: string;
}
