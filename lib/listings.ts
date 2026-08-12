import fs from "fs";
import path from "path";

export interface ListingMeta {
  title: string;
  slug: string;
  itemId?: string;
  itemName?: string;
  category?: string;
  location?: string;
  type?: string;
}

export interface Listing extends ListingMeta {
  body: string;
}

const LISTINGS_DIR = path.join(process.cwd(), "content", "listings");

/** Minimal YAML-like front matter: `key: value` lines only. */
function parseFrontMatter(raw: string): { meta: Record<string, string>; body: string } {
  const normalized = raw.replace(/^\uFEFF/, "");
  const match = normalized.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    return { meta: {}, body: normalized.trim() };
  }
  const meta: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (m) {
      meta[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  }
  return { meta, body: match[2].trim() };
}

function toListing(slugFromFile: string, raw: string): Listing {
  const { meta, body } = parseFrontMatter(raw);
  const slug = meta.slug || slugFromFile;
  return {
    title: meta.title || slug,
    slug,
    itemId: meta.itemId || undefined,
    itemName: meta.itemName || undefined,
    category: meta.category || undefined,
    location: meta.location || undefined,
    type: meta.type || undefined,
    body,
  };
}

export function getAllListings(): Listing[] {
  if (!fs.existsSync(LISTINGS_DIR)) return [];
  return fs
    .readdirSync(LISTINGS_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const slug = f.replace(/\.md$/, "");
      const raw = fs.readFileSync(path.join(LISTINGS_DIR, f), "utf8");
      return toListing(slug, raw);
    })
    .sort((a, b) => a.title.localeCompare(b.title));
}

export function getListingBySlug(slug: string): Listing | null {
  const file = path.join(LISTINGS_DIR, `${slug}.md`);
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, "utf8");
  return toListing(slug, raw);
}