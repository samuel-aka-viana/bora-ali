import axios from "axios";
import { ACCESS_KEY, REFRESH_KEY, SESSION_INVALIDATED_KEY } from "../utils/constants";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing: Promise<string> | null = null;

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem(REFRESH_KEY);

      if (!refresh) {
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        refreshing =
          refreshing ??
          api.post("/auth/refresh/", { refresh }).then((r) => {
            localStorage.setItem(ACCESS_KEY, r.data.access);
            if (r.data.refresh) localStorage.setItem(REFRESH_KEY, r.data.refresh);
            refreshing = null;
            return r.data.access as string;
          });

        const access = await refreshing;
        original.headers.Authorization = `Bearer ${access}`;
        return api(original);
      } catch (e) {
        refreshing = null;
        const isSessionExpired = isSessionInvalidated(e);
        localStorage.clear();
        if (isSessionExpired) localStorage.setItem(SESSION_INVALIDATED_KEY, "1");
        window.location.href = "/login";
        return Promise.reject(e);
      }
    }

    return Promise.reject(error);
  },
);

function isSessionInvalidated(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;
  const code = error.response?.data?.code;
  return code === "session_expired" || code === "session_invalidated" || code === "session_not_found";
}
