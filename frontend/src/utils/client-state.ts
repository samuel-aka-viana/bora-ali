export async function clearClientState(): Promise<void> {
  localStorage.clear();
  sessionStorage.clear();

  if (typeof caches === "undefined") return;

  const cacheKeys = await caches.keys();
  await Promise.all(cacheKeys.map((key) => caches.delete(key)));
}
