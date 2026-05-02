import type { ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { ACCESS_KEY } from "../../utils/constants";

export function PublicRoute({ children }: { children: ReactElement }) {
  return localStorage.getItem(ACCESS_KEY) ? <Navigate to="/places" replace /> : children;
}