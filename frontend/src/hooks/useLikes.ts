import { useState, useEffect, useCallback } from 'react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

export function useLikes() {
  const [likedHashes, setLikedHashes] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/whales/liked`)
      .then((r) => r.json())
      .then((hashes: string[]) => setLikedHashes(new Set(hashes)))
      .catch(() => {});
  }, []);

  const toggleLike = useCallback(async (hash: string) => {
    const isLiked = likedHashes.has(hash);

    // Optimistic update
    setLikedHashes((prev) => {
      const next = new Set(prev);
      if (isLiked) next.delete(hash);
      else next.add(hash);
      return next;
    });

    try {
      await fetch(`${BACKEND_URL}/api/whales/${hash}/like`, {
        method: isLiked ? 'DELETE' : 'POST',
      });
    } catch {
      // Revert on error
      setLikedHashes((prev) => {
        const next = new Set(prev);
        if (isLiked) next.add(hash);
        else next.delete(hash);
        return next;
      });
    }
  }, [likedHashes]);

  return { likedHashes, toggleLike };
}
