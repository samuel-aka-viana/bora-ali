import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import PlacesPage from "./PlacesPage";
import { placesService } from "../services/places.service";
import { AuthProvider } from "../contexts/AuthContext";

vi.mock("../services/places.service");

const emptyPage = { count: 0, results: [], next: null, previous: null };

test("shows empty state when no places", async () => {
  (placesService.list as ReturnType<typeof vi.fn>).mockResolvedValue(emptyPage);
  render(
    <MemoryRouter>
      <AuthProvider>
        <PlacesPage />
      </AuthProvider>
    </MemoryRouter>
  );
  await waitFor(() => expect(screen.getByText(/no places yet/i)).toBeInTheDocument());
});

test("renders list of places", async () => {
  (placesService.list as ReturnType<typeof vi.fn>).mockResolvedValue({
    count: 1,
    next: null,
    previous: null,
    results: [
      {
        id: 1,
        name: "Padaria Bom Pão",
        category: "bakery",
        address: "",
        status: "visited",
        created_at: "",
        updated_at: "",
      },
    ],
  });
  render(
    <MemoryRouter>
      <AuthProvider>
        <PlacesPage />
      </AuthProvider>
    </MemoryRouter>
  );
  await waitFor(() => expect(screen.getByText("Padaria Bom Pão")).toBeInTheDocument());
});
