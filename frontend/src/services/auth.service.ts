import { api } from "./api";
import { ACCESS_KEY, REFRESH_KEY } from "../utils/constants";
import type { User } from "../types/user";

export const authService = {
  async register(data: {
    username: string;
    email: string;
    password: string;
    confirm_password: string;
  }) {
    return api.post("/auth/register/", data);
  },
  async login(username: string, password: string) {
    const { data } = await api.post("/auth/login/", { username, password });
    localStorage.setItem(ACCESS_KEY, data.access);
    localStorage.setItem(REFRESH_KEY, data.refresh);
    return data;
  },
  async logout() {
    const refresh = localStorage.getItem(REFRESH_KEY);
    try {
      await api.post("/auth/logout/", { refresh });
    } catch {}
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
  async me(): Promise<User> {
    const { data } = await api.get<User>("/auth/me/");
    return data;
  },
};
