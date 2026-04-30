export const PLACE_STATUSES = [
  { value: "want_to_visit", label: "Want to visit" },
  { value: "visited", label: "Visited" },
  { value: "favorite", label: "Favorite" },
  { value: "would_not_return", label: "Would not return" },
] as const;

export const VISIT_ITEM_TYPES = [
  { value: "sweet", label: "Sweet" },
  { value: "savory", label: "Savory" },
  { value: "drink", label: "Drink" },
  { value: "coffee", label: "Coffee" },
  { value: "juice", label: "Juice" },
  { value: "dessert", label: "Dessert" },
  { value: "other", label: "Other" },
] as const;

export const ACCESS_KEY = "boraali_access";
export const REFRESH_KEY = "boraali_refresh";
