import { getDataHash } from "./firestore";

export async function fetchWithCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  hydrator?: (data: any) => T
): Promise<T> {
  // 1. Fetch the current global hash from the server
  let remoteHash: string | null = null;
  try {
    remoteHash = await getDataHash();
  } catch (e) {
    console.error("Failed to fetch global hash, bypassing cache", e);
    return fetcher();
  }

  if (!remoteHash) {
    // If no hash exists on server, just fetch fresh
    return fetcher();
  }

  // 2. Check local storage for the specific key
  const cachedString = localStorage.getItem(key);
  
  if (cachedString) {
    try {
      const cachedEntry = JSON.parse(cachedString);
      // 3. Compare stored version with remote version
      if (cachedEntry.version === remoteHash && cachedEntry.data) {
        // Cache Hit
        // console.log(`[Cache] Hit for ${key}`);
        return hydrator ? hydrator(cachedEntry.data) : cachedEntry.data;
      }
    } catch (e) {
      console.warn(`[Cache] Parse error for ${key}`, e);
    }
  }

  // 4. Cache Miss or Stale - Fetch Fresh
  // console.log(`[Cache] Miss/Stale for ${key} (Remote: ${remoteHash})`);
  const data = await fetcher();

  // 5. Store with new version
  try {
    localStorage.setItem(key, JSON.stringify({
      version: remoteHash,
      data: data
    }));
  } catch (e) {
    console.warn(`[Cache] Write failed for ${key}`, e);
  }

  return data;
}
