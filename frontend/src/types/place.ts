export type PlaceStatus = "want_to_visit" | "visited" | "favorite" | "would_not_return";

export interface Place {
  id: number;
  name: string;
  category: string;
  address: string;
  instagram_url?: string;
  maps_url?: string;
  status: PlaceStatus;
  notes?: string;
  cover_photo_path?: string;
  created_at: string;
  updated_at: string;
}
