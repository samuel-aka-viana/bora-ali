import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { PublicRoute } from "./components/auth/PublicRoute";
import { ACCESS_KEY } from "./utils/constants";
import LoginPage from "./routes/LoginPage";
import RegisterPage from "./routes/RegisterPage";
import PlacesPage from "./routes/PlacesPage";
import NewPlacePage from "./routes/NewPlacePage";
import EditPlacePage from "./routes/EditPlacePage";
import PlaceDetailPage from "./routes/PlaceDetailPage";
import NewVisitPage from "./routes/NewVisitPage";
import EditVisitPage from "./routes/EditVisitPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <Navigate to={localStorage.getItem(ACCESS_KEY) ? "/places" : "/login"} replace />
            }
          />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />
          <Route
            path="/places"
            element={
              <ProtectedRoute>
                <PlacesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/places/new"
            element={
              <ProtectedRoute>
                <NewPlacePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/places/:id"
            element={
              <ProtectedRoute>
                <PlaceDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/places/:id/edit"
            element={
              <ProtectedRoute>
                <EditPlacePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/places/:id/visits/new"
            element={
              <ProtectedRoute>
                <NewVisitPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/visits/:id/edit"
            element={
              <ProtectedRoute>
                <EditVisitPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
