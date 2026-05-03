import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { PublicRoute } from "./components/auth/PublicRoute";
import { ProtectedLayout } from "./components/layout/ProtectedLayout";
import { GlobalLoadingBar } from "./components/ui/GlobalLoadingBar";
import { ACCESS_KEY } from "./utils/constants";
const LoginPage = lazy(() => import("./routes/LoginPage"));
const RegisterPage = lazy(() => import("./routes/RegisterPage"));
const PlacesPage = lazy(() => import("./routes/PlacesPage"));
const NewPlacePage = lazy(() => import("./routes/NewPlacePage"));
const EditPlacePage = lazy(() => import("./routes/EditPlacePage"));
const PlaceDetailPage = lazy(() => import("./routes/PlaceDetailPage"));
const NewVisitPage = lazy(() => import("./routes/NewVisitPage"));
const EditVisitPage = lazy(() => import("./routes/EditVisitPage"));
const AccountPage = lazy(() => import("./routes/AccountPage"));

export default function App() {
  return (
    <AuthProvider>
      <GlobalLoadingBar />
      <BrowserRouter>
        <Suspense fallback={null}>
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
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
