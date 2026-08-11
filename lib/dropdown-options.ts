import type { DropdownKind } from "@/types";

const STORAGE_PREFIX = "image-kb-options-";

const DEFAULTS: Record<DropdownKind, string[]> = {
  category: ["Home", "Tool", "Vehicle", "Other"],
  location: [
    "Kitchen",
    "Master Bedroom",
    "Guest Room",
    "Garage",
    "Laundry",
    "Living Room",
    "Bathroom",
    "Office",
    "Outside",
    "Other",
  ],
  itemType: [
    "Appliance",
    "Fixture",
    "Furniture",
    "Electronics",
    "HVAC",
    "Tool",
    "Other",
  ],
};

function storageKey(kind: DropdownKind): string {
  return `${STORAGE_PREFIX}${kind}`;
}

export function getOptions(kind: DropdownKind): string[] {
  if (typeof window === "undefined") return [...DEFAULTS[kind]];

  try {
    const raw = localStorage.getItem(storageKey(kind));
    if (!raw) return [...DEFAULTS[kind]];
    const parsed = JSON.parse(raw) as string[];
    if (!Array.isArray(parsed)) return [...DEFAULTS[kind]];

    const seen = new Set<string>();
    const result: string[] = [];
    for (const v of [...DEFAULTS[kind], ...parsed]) {
      const key = v.trim();
      if (!key) continue;
      const lower = key.toLowerCase();
      if (seen.has(lower)) continue;
      seen.add(lower);
      result.push(key);
    }
    return result;
  } catch {
    return [...DEFAULTS[kind]];
  }
}

export function addOption(kind: DropdownKind, value: string): string[] {
  const trimmed = value.trim();
  if (!trimmed) return getOptions(kind);

  const current = getOptions(kind);
  const exists = current.some(
    (v) => v.toLowerCase() === trimmed.toLowerCase()
  );
  if (exists) return current;

  const next = [...current, trimmed];
  if (typeof window !== "undefined") {
    try {
      const defaults = new Set(DEFAULTS[kind].map((d) => d.toLowerCase()));
      const custom = next.filter((v) => !defaults.has(v.toLowerCase()));
      localStorage.setItem(storageKey(kind), JSON.stringify(custom));
    } catch {
      // ignore
    }
  }
  return next;
}