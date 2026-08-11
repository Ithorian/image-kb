/**
 * Generates a clean, useful recommended filename for an image
 * based on classification fields, tags, dimensions and date.
 */
export function recommendFilename(options: {
  originalName: string;
  tags?: string[];
  width?: number;
  height?: number;
  mimeType?: string;
  itemName?: string;
  category?: string;
  location?: string;
  itemType?: string;
  role?: string;
}): string {
  const {
    originalName,
    tags = [],
    width,
    height,
    mimeType,
    itemName,
    category,
    location,
    itemType,
    role,
  } = options;

  const lastDot = originalName.lastIndexOf(".");
  const ext =
    lastDot > 0
      ? originalName.slice(lastDot + 1).toLowerCase()
      : mimeType?.split("/")[1]?.replace("jpeg", "jpg") || "jpg";

  const sanitize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40);

  const parts: string[] = [];
  if (itemName?.trim()) {
    parts.push(sanitize(itemName));
  } else {
    if (category?.trim()) parts.push(sanitize(category));
    if (location?.trim()) parts.push(sanitize(location));
    if (itemType?.trim()) parts.push(sanitize(itemType));
  }

  if (role?.trim()) {
    parts.push(sanitize(role));
  }

  if (parts.length === 0) {
    const base = lastDot > 0 ? originalName.slice(0, lastDot) : originalName;
    const clean = sanitize(base) || "image";
    parts.push(clean);
    const usefulTags = tags.map(sanitize).filter(Boolean).slice(0, 2);
    parts.push(...usefulTags);
  }

  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;

  let dimPart = "";
  if (width && height) {
    if (width >= 2000 || height >= 2000) dimPart = "-hires";
    else if (width <= 400 && height <= 400) dimPart = "-thumb";
  }

  const body = parts.filter(Boolean).join("-") || "image";
  return `${body}-${datePart}${dimPart}.${ext}`;
}