import "@testing-library/jest-dom";
import { beforeEach } from "vitest";
import i18n, { LANGUAGE_STORAGE_KEY } from "../i18n";

beforeEach(async () => {
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
  await i18n.changeLanguage("en");
});
