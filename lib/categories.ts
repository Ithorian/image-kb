"use client";

/**
 * Category vocabulary used by the filename builder.
 *
 * The built-in tree below ships with the app. Anything the user types into a
 * dropdown is stored separately in localStorage and merged on top, so their
 * additions survive reloads without ever mutating the defaults.
 */

export type CategoryTree = Record<string, Record<string, string[]>>;

export const DEFAULT_CATEGORY_TREE: CategoryTree = {
  Home: {
    Kitchen: ["Appliance", "Faucet", "Sink", "Dishwasher", "Oven", "Microwave", "Cooktop", "RangeHood"],
    AC: ["FrontAC", "RearAC", "Filter", "Thermostat", "Condenser", "AirHandler"],
    Bathroom: ["Sink", "Faucet", "Shower", "Toilet", "Vanity"],
    Exterior: ["Mailbox", "Garage", "Roof", "Windows", "Door"],
    Other: [],
  },
  Tools: {
    Power: ["CircularSaw", "ImpactDriver", "Drill", "ShopVac", "AirCompressor"],
    Hand: ["Multimeter", "Wrench", "Pliers", "Screwdriver"],
    Other: [],
  },
  Projects: {
    "Monterey-Minerals": ["Cheque", "Statement", "Report", "K1"],
    PromptMystic: ["UI", "Screenshot", "Diagram", "Logo"],
    Other: [],
  },
  Media: {
    General: [],
  },
};

export const DEFAULT_VIEWS = [
  "Front-View",
  "Rear-View",
  "Closeup",
  "Label",
  "SerialNumber",
  "Wide",
  "Before",
  "After",
];

export type CategoryLevel = "top" | "sub" | "item" | "view";

export interface CustomCategories {
  /** Top-level categories added by the user. */
  tops: string[];
  /** Sub-categories keyed by top category. */
  subs: Record<string, string[]>;
  /** Items keyed by `itemKey(top, sub)`. */
  items: Record<string, string[]>;
  /** View / detail suffixes, shared across every category. */
  views: string[];
}

export interface CategorySnapshot {
  tree: CategoryTree;
  views: string[];
  custom: CustomCategories;
}

const STORAGE_KEY = "imagekb:custom-categories:v1";
const MAX_VALUE_LENGTH = 48;

export function itemKey(top: string, sub: string): string {
  return `${top}/${sub}`;
}

/**
 * Values end up as filename segments, so anything that could escape the target
 * directory or break the `A-B-C.jpg` convention is stripped here rather than
 * relied on downstream.
 */
export function normalizeValue(raw: string): string {
  return raw
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[\\/:*?"<>|.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_VALUE_LENGTH);
}

function emptyCustom(): CustomCategories {
  return { tops: [], subs: {}, items: {}, views: [] };
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  for (const entry of value) {
    if (typeof entry !== "string") continue;
    const normalized = normalizeValue(entry);
    if (normalized) seen.add(normalized);
  }
  return [...seen];
}

function toStringArrayMap(value: unknown): Record<string, string[]> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result: Record<string, string[]> = {};
  for (const [key, entries] of Object.entries(value as Record<string, unknown>)) {
    const list = toStringArray(entries);
    if (list.length > 0) result[key] = list;
  }
  return result;
}

function parseCustom(raw: string | null): CustomCategories {
  if (!raw) return emptyCustom();
  try {
    const parsed = JSON.parse(raw) as Partial<CustomCategories>;
    return {
      tops: toStringArray(parsed.tops),
      subs: toStringArrayMap(parsed.subs),
      items: toStringArrayMap(parsed.items),
      views: toStringArray(parsed.views),
    };
  } catch {
    return emptyCustom();
  }
}

function buildSnapshot(custom: CustomCategories): CategorySnapshot {
  const tree: CategoryTree = {};

  for (const [top, subs] of Object.entries(DEFAULT_CATEGORY_TREE)) {
    tree[top] = {};
    for (const [sub, items] of Object.entries(subs)) {
      tree[top][sub] = [...items];
    }
  }

  const ensureTop = (top: string) => (tree[top] ??= {});
  const ensureSub = (top: string, sub: string) => (ensureTop(top)[sub] ??= []);

  for (const top of custom.tops) ensureTop(top);

  for (const [top, subs] of Object.entries(custom.subs)) {
    for (const sub of subs) ensureSub(top, sub);
  }

  for (const [key, items] of Object.entries(custom.items)) {
    const separator = key.indexOf("/");
    if (separator <= 0) continue;
    const top = key.slice(0, separator);
    const sub = key.slice(separator + 1);
    const bucket = ensureSub(top, sub);
    for (const item of items) {
      if (!bucket.includes(item)) bucket.push(item);
    }
  }

  const views = [...DEFAULT_VIEWS];
  for (const view of custom.views) {
    if (!views.includes(view)) views.push(view);
  }

  return { tree, views, custom };
}

// ---------- Store ----------

const listeners = new Set<() => void>();
const serverSnapshot = buildSnapshot(emptyCustom());
let snapshot: CategorySnapshot | null = null;

function currentCustom(): CustomCategories {
  return (snapshot ?? getCategorySnapshot()).custom;
}

function commit(next: CustomCategories) {
  snapshot = buildSnapshot(next);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (err) {
    console.warn("Could not persist custom categories", err);
  }
  listeners.forEach((listener) => listener());
}

export function getCategorySnapshot(): CategorySnapshot {
  if (!snapshot) {
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(STORAGE_KEY);
    } catch (err) {
      console.warn("Could not read custom categories", err);
    }
    snapshot = buildSnapshot(parseCustom(raw));
  }
  return snapshot;
}

export function getServerCategorySnapshot(): CategorySnapshot {
  return serverSnapshot;
}

export function subscribeToCategories(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Returns the normalized value that was stored, or `null` if it was rejected. */
export function addCategoryValue(
  level: CategoryLevel,
  parentKey: string,
  rawValue: string
): string | null {
  const value = normalizeValue(rawValue);
  if (!value) return null;

  const custom = currentCustom();
  const next: CustomCategories = {
    tops: [...custom.tops],
    subs: { ...custom.subs },
    items: { ...custom.items },
    views: [...custom.views],
  };

  if (level === "top") {
    if (!next.tops.includes(value)) next.tops = [...next.tops, value];
  } else if (level === "view") {
    if (!next.views.includes(value)) next.views = [...next.views, value];
  } else {
    const bucketKey = parentKey;
    if (!bucketKey) return null;
    const map = level === "sub" ? next.subs : next.items;
    const existing = map[bucketKey] ?? [];
    if (!existing.includes(value)) map[bucketKey] = [...existing, value];
  }

  commit(next);
  return value;
}

export function removeCategoryValue(
  level: CategoryLevel,
  parentKey: string,
  value: string
): void {
  const custom = currentCustom();
  const next: CustomCategories = {
    tops: custom.tops.filter((v) => level !== "top" || v !== value),
    subs: { ...custom.subs },
    items: { ...custom.items },
    views: custom.views.filter((v) => level !== "view" || v !== value),
  };

  if (level === "sub" || level === "item") {
    const map = level === "sub" ? next.subs : next.items;
    const existing = map[parentKey];
    if (existing) {
      const filtered = existing.filter((v) => v !== value);
      if (filtered.length > 0) map[parentKey] = filtered;
      else delete map[parentKey];
    }
  }

  // Drop children that can no longer be reached from any dropdown
  if (level === "top") {
    delete next.subs[value];
    for (const key of Object.keys(next.items)) {
      if (key.startsWith(`${value}/`)) delete next.items[key];
    }
  } else if (level === "sub") {
    delete next.items[itemKey(parentKey, value)];
  }

  commit(next);
}

export function isCustomValue(
  custom: CustomCategories,
  level: CategoryLevel,
  parentKey: string,
  value: string
): boolean {
  switch (level) {
    case "top":
      return custom.tops.includes(value);
    case "view":
      return custom.views.includes(value);
    case "sub":
      return custom.subs[parentKey]?.includes(value) ?? false;
    case "item":
      return custom.items[parentKey]?.includes(value) ?? false;
  }
}
