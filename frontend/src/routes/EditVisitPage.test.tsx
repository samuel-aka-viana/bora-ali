import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi } from "vitest";
import EditVisitPage from "./EditVisitPage";
import { visitsService } from "../services/visits.service";

vi.mock("../services/visits.service");
vi.mock("../components/visits/VisitForm", () => ({
  VisitForm: ({ initialItems }: { initialItems: unknown[] }) => (
    <div data-testid="visit-form" data-items={initialItems.length} />
  ),
}));

test("loads visit detail when edit state is missing", async () => {
  (visitsService.get as ReturnType<typeof vi.fn>).mockResolvedValue({
    public_id: "visit-1",
    place: 1,
    visited_at: "2026-05-01T12:00:00Z",
    environment_rating: 8,
    service_rating: 9,
    overall_rating: 9,
    would_return: true,
    items: [
      {
        public_id: "item-1",
        visit: 1,
        name: "Espresso",
        type: "coffee",
        rating: 9,
        price: "5.00",
        would_order_again: true,
        created_at: "",
        updated_at: "",
      },
    ],
    created_at: "",
    updated_at: "",
  });

  render(
    <MemoryRouter initialEntries={["/visits/visit-1/edit"]}>
      <Routes>
        <Route path="/visits/:id/edit" element={<EditVisitPage />} />
      </Routes>
    </MemoryRouter>
  );

  await waitFor(() => expect(visitsService.get).toHaveBeenCalledWith("visit-1"));
  await waitFor(() => expect(screen.getByTestId("visit-form")).toHaveAttribute("data-items", "1"));
});
