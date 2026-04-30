import type { ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { ACCESS_KEY } from "../../utils/constants";

export function ProtectedRoute({ children }: { children: ReactElement }) {
  return localStorage.getItem(ACCESS_KEY) ? children : <Navigate to="/login" replace />;
}