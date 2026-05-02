import { render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { VisitForm } from "./VisitForm";
import { visitItemsService } from "../../services/visit-items.service";

vi.mock("../../services/visit-items.service");

test("deletes an existing consumable through the API when removing it", async () => {
  (visitItemsService.remove as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

  render(
    <VisitForm
      initialItems={[
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
      ]}
      onSubmit={vi.fn()}
    />
  );

  screen.getByLabelText("Remover").click();

  await waitFor(() => {
    expect(visitItemsService.remove).toHaveBeenCalledWith("item-1");
  });
  await waitFor(() => {
    expect(screen.queryByText("Espresso")).not.toBeInTheDocument();
  });
});
