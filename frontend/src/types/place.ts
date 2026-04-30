export type PlaceStatus = "want_to_visit" | "visited" | "favorite" | "would_not_return";

export interface Place {
  public_id: string;
  name: string;
  category: string;
  address: string;
  instagram_url?: string;
  maps_url?: string;
  latitude?: string | null;
  longitude?: string | null;
  status: PlaceStatus;
  notes?: string;
  cover_photo?: string;
  created_at: string;
  updated_at: string;
}

export interface PlaceConsumablesSummary {
  consumables_count: number;
  average_consumable_rating: number | null;
  total_consumed_amount: string | null;
}
