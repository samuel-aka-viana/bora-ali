import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { PublicRoute } from "./components/auth/PublicRoute";
import { ProtectedLayout } from "./components/layout/ProtectedLayout";
import { ACCESS_KEY } from "./utils/constants";
import LoginPage from "./routes/LoginPage";
import RegisterPage from "./routes/RegisterPage";
import PlacesPage from "./routes/PlacesPage";
import NewPlacePage from "./routes/NewPlacePage";
import EditPlacePage from "./routes/EditPlacePage";
import PlaceDetailPage from "./routes/PlaceDetailPage";
import NewVisitPage from "./routes/NewVisitPage";
import EditVisitPage from "./routes/EditVisitPage";
import AccountPage from "./routes/AccountPage";

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
                <ProtectedLayout>
                  <PlacesPage />
                </ProtectedLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <ProtectedLayout>
                  <AccountPage />
                </ProtectedLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/places/new"
            element={
              <ProtectedRoute>
                <ProtectedLayout>
                  <NewPlacePage />
                </ProtectedLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/places/:id"
            element={
              <ProtectedRoute>
                <ProtectedLayout>
                  <PlaceDetailPage />
                </ProtectedLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/places/:id/edit"
            element={
              <ProtectedRoute>
                <ProtectedLayout>
                  <EditPlacePage />
                </ProtectedLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/places/:id/visits/new"
            element={
              <ProtectedRoute>
                <ProtectedLayout>
                  <NewVisitPage />
                </ProtectedLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/visits/:id/edit"
            element={
              <ProtectedRoute>
                <ProtectedLayout>
                  <EditVisitPage />
                </ProtectedLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
