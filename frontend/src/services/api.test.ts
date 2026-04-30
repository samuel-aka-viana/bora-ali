import type { InternalAxiosRequestConfig } from "axios";
import { api } from "./api";
import { ACCESS_KEY } from "../utils/constants";

type RequestHandler = {
  fulfilled: (
    value: InternalAxiosRequestConfig,
  ) => InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig>;
};

test("adds Authorization header when token exists in localStorage", async () => {
  localStorage.setItem(ACCESS_KEY, "test-token-abc");

  const { handlers } = api.interceptors.request as unknown as { handlers: RequestHandler[] };
  const lastHandler = handlers[handlers.length - 1];
  const cfg = await lastHandler.fulfilled({ headers: {} } as InternalAxiosRequestConfig);

  expect(cfg.headers.Authorization).toBe("Bearer test-token-abc");
  localStorage.removeItem(ACCESS_KEY);
});
