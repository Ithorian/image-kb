export function recommendFilename(options: {
  originalName: string;
  tags?: string[];
  width?: number;
  height?: number;
  mimeType?: string;
}): string {
  const { originalName, tags = [], width, height, mimeType } = options;

  const lastDot = originalName.lastIndexOf(".");
  const base = lastDot > 0 ? originalName.slice(0, lastDot) : originalName;
  const ext =
    lastDot > 0
      ? originalName.slice(lastDot + 1).toLowerCase()
      : mimeType?.split("/")[1] || "png";

  let clean = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

  if (!clean) clean = "image";

  const usefulTags = tags
    .map((t) =>
      t
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
    )
    .filter(Boolean)
    .slice(0, 2);

  const tagPart = usefulTags.length > 0 ? `-${usefulTags.join("-")}` : "";

  const now = new Date();
  const datePart = `-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;

  let dimPart = "";
  if (width && height) {
    if (width >= 2000 || height >= 2000) dimPart = "-hires";
    else if (width <= 400 && height <= 400) dimPart = "-thumb";
  }

  return `${clean}${tagPart}${datePart}${dimPart}.${ext}`;
}
