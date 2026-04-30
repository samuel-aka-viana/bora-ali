import { Navigate } from "react-router-dom";
import { ACCESS_KEY } from "../../utils/constants";

export function PublicRoute({ children }: { children: JSX.Element }) {
  return localStorage.getItem(ACCESS_KEY) ? <Navigate to="/places" replace /> : children;
}