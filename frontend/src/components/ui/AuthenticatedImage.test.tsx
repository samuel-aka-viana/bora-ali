import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { api } from "../../services/api";
import { AuthenticatedImage } from "./AuthenticatedImage";

afterEach(() => {
  vi.restoreAllMocks();
});

test("loads api media with the axios client", async () => {
  const createObjectUrl = vi
    .spyOn(URL, "createObjectURL")
    .mockReturnValue("blob:photo");
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
  const apiGet = vi.spyOn(api, "get").mockResolvedValue({
    data: new Blob(["image-bytes"], { type: "image/jpeg" }),
  });

  render(
    <AuthenticatedImage
      src="/api/media/users/2/places/covers/photo"
      alt="Cafe"
    />,
  );

  await waitFor(() => {
    expect(apiGet).toHaveBeenCalledWith("/media/users/2/places/covers/photo", {
      responseType: "blob",
    });
  });
  expect(createObjectUrl).toHaveBeenCalled();
  expect(screen.getByAltText("Cafe")).toHaveAttribute("src", "blob:photo");
});

test("keeps non-api media as a regular image source", () => {
  const apiGet = vi.spyOn(api, "get");

  render(<AuthenticatedImage src="blob:local-preview" alt="Preview" />);

  expect(apiGet).not.toHaveBeenCalled();
  expect(screen.getByAltText("Preview")).toHaveAttribute(
    "src",
    "blob:local-preview",
  );
});
