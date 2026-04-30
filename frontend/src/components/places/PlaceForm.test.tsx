import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { PlaceForm } from "./PlaceForm";

test("requires name before submitting", async () => {
  const onSubmit = vi.fn();
  render(<PlaceForm onSubmit={onSubmit} />);

  fireEvent.click(screen.getByText("Save"));

  await waitFor(() => {
    expect(screen.getByText(/name is required/i)).toBeInTheDocument();
  });
  expect(onSubmit).not.toHaveBeenCalled();
});
