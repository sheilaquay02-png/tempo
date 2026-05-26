"use client";

import { useMemo } from "react";

export function useTempoUserKey(userId) {
  return useMemo(() => {
    if (userId) return userId;
    if (typeof localStorage !== "undefined") {
      let key = localStorage.getItem("tempo_anon_key");
      if (!key) {
        key = `anon_${Math.random().toString(36).slice(2, 10)}`;
        localStorage.setItem("tempo_anon_key", key);
      }
      return key;
    }
    return "anon";
  }, [userId]);
}
