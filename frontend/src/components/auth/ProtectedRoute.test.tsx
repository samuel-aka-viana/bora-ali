import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { ACCESS_KEY } from "../../utils/constants";

test("redirects unauthenticated user to /login", () => {
  localStorage.removeItem(ACCESS_KEY);
  render(
    <MemoryRouter initialEntries={["/private"]}>
      <Routes>
        <Route path="/login" element={<div>LOGIN PAGE</div>} />
        <Route
          path="/private"
          element={
            <ProtectedRoute>
              <div>SECRET</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );
  expect(screen.getByText("LOGIN PAGE")).toBeInTheDocument();
});