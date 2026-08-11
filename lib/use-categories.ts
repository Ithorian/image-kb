"use client";

import { useSyncExternalStore } from "react";

import {
  getCategorySnapshot,
  getServerCategorySnapshot,
  subscribeToCategories,
  type CategorySnapshot,
} from "@/lib/categories";

/**
 * Subscribes to the shared category vocabulary. Every dropdown using this hook
 * sees additions immediately, and the server snapshot keeps hydration stable.
 */
export function useCategories(): CategorySnapshot {
  return useSyncExternalStore(
    subscribeToCategories,
    getCategorySnapshot,
    getServerCategorySnapshot
  );
}
