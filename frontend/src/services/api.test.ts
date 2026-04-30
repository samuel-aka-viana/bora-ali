import { api } from "./api";
import { ACCESS_KEY } from "../utils/constants";

test("adds Authorization header when token exists in localStorage", async () => {
  localStorage.setItem(ACCESS_KEY, "test-token-abc");

  const handlers = (api.interceptors.request as any).handlers;
  const lastHandler = handlers[handlers.length - 1];
  const cfg = await lastHandler.fulfilled({ headers: {} as any });

  expect(cfg.headers.Authorization).toBe("Bearer test-token-abc");
  localStorage.removeItem(ACCESS_KEY);
});
