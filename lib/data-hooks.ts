import { useState, useEffect, useRef } from "react";
import { getDataHash } from "./firestore";

const GLOBAL_HASH_KEY = "examstar_global_hash";

interface CacheEntry<T> {
  version: string;
  data: T;
}

export function useDataWithCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  dependencies: any[] = [],
  hydrator?: (data: any) => T,
  enabled: boolean = true
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      // 1. Try Local Load (Stale-While-Revalidate)
      let localData: T | null = null;
      let localHash: string | null = null;
      
      try {
        const localHashStored = localStorage.getItem(GLOBAL_HASH_KEY);
        const cachedItem = localStorage.getItem(key);
        
        if (cachedItem && localHashStored) {
          const entry = JSON.parse(cachedItem) as CacheEntry<T>;
          // We check if the entry version matches the *stored* global hash
          // This ensures consistency within the local cache state
          if (entry.version === localHashStored) {
             localData = hydrator ? hydrator(entry.data) : entry.data;
             localHash = localHashStored;
             if (isMounted.current) {
               setData(localData);
               // If we have local data, we are technically "not loading" anymore from a UX perspective
               // But we keep loading=true if we want to show a spinner for the background refresh?
               // Usually for SWR, we set loading=false immediately if we have data.
               // Let's set loading=false to make it "superfast"
               setLoading(false); 
             }
          }
        }
      } catch (err) {
        console.warn("[Cache] Local read failed", err);
      }

      // 2. Network Check (Background validation)
      try {
        const remoteHash = await getDataHash();
        
        // If hash changed OR we had no local data
        if (remoteHash && remoteHash !== localHash) {
           // Fetch Fresh
           const freshData = await fetcher();
           
           if (isMounted.current) {
             setData(freshData);
             setLoading(false); // Ensure loading is off
           }

           // Update Cache
           try {
             localStorage.setItem(GLOBAL_HASH_KEY, remoteHash);
             localStorage.setItem(key, JSON.stringify({
               version: remoteHash,
               data: freshData
             }));
           } catch (e) {
             console.warn("[Cache] Write failed", e);
           }
        } else if (!localData) {
            // No hash on server? Or just no local data but hash matches?
            // If !localData, we MUST fetch.
            const freshData = await fetcher();
            if (isMounted.current) {
                setData(freshData);
                setLoading(false);
            }
            // If we have a remote hash, store it
            if (remoteHash) {
                localStorage.setItem(GLOBAL_HASH_KEY, remoteHash);
                localStorage.setItem(key, JSON.stringify({
                    version: remoteHash,
                    data: freshData
                }));
            }
        } else {
            // Local data matches remote hash. We are good.
            // Ensure loading is false (already done above, but just in case)
            if (isMounted.current) setLoading(false);
        }

      } catch (err) {
        console.error("[Cache] Network/Fetch failed", err);
        if (isMounted.current) {
            setError(err);
            setLoading(false);
        }
      }
    };

    loadData();
  }, [key, enabled, ...dependencies]);

  const refresh = async () => {
      setLoading(true);
      try {
          const freshData = await fetcher();
          if (isMounted.current) {
              setData(freshData);
              setLoading(false);
          }
          // Update Cache
          const remoteHash = await getDataHash();
          if (remoteHash) {
             localStorage.setItem(GLOBAL_HASH_KEY, remoteHash);
             localStorage.setItem(key, JSON.stringify({
               version: remoteHash,
               data: freshData
             }));
          }
      } catch (err) {
          console.error("Refresh failed", err);
          setLoading(false);
      }
  };

  return { data, loading, error, refresh, setData };
}
