import type { KnowledgeImage, SortOption } from "@/types";

export function filterAndSortImages(
  images: KnowledgeImage[],
  options: {
    search?: string;
    selectedTags?: string[];
    sort?: SortOption;
  }
): KnowledgeImage[] {
  const { search = "", selectedTags = [], sort = "newest" } = options;
  const q = search.trim().toLowerCase();

  let result = images.filter((img) => {
    if (selectedTags.length > 0) {
      const hasAll = selectedTags.every((t) =>
        img.tags.some((it) => it.toLowerCase() === t.toLowerCase())
      );
      if (!hasAll) return false;
    }

    if (q) {
      const haystack = [
        img.recommendedName,
        img.originalName,
        img.notes ?? "",
        img.itemName ?? "",
        img.role ?? "",
        img.category ?? "",
        img.location ?? "",
        img.itemType ?? "",
        ...img.tags,
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    return true;
  });

  result = [...result];
  switch (sort) {
    case "newest":
      result.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      break;
    case "oldest":
      result.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      break;
    case "name":
      result.sort((a, b) =>
        a.recommendedName.localeCompare(b.recommendedName)
      );
      break;
    case "size":
      result.sort((a, b) => b.size - a.size);
      break;
  }

  return result;
}

export function getUniqueTags(images: KnowledgeImage[]): string[] {
  const set = new Set<string>();
  images.forEach((img) => img.tags.forEach((t) => set.add(t)));
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

export function getCoverImages(images: KnowledgeImage[]): KnowledgeImage[] {
  const groups = new Map<string, KnowledgeImage[]>();
  const standalone: KnowledgeImage[] = [];

  for (const img of images) {
    if (!img.itemId) {
      standalone.push(img);
      continue;
    }
    const list = groups.get(img.itemId) ?? [];
    list.push(img);
    groups.set(img.itemId, list);
  }

  const covers: KnowledgeImage[] = [];

  for (const group of groups.values()) {
    const sorted = [...group].sort(
      (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
    );
    const cover = sorted.find((g) => g.isCover) ?? sorted[0];
    covers.push(cover);
  }

  return filterAndSortImages([...covers, ...standalone], { sort: "newest" });
}

export function getRelatedImages(
  images: KnowledgeImage[],
  itemId: string | undefined
): KnowledgeImage[] {
  if (!itemId) return [];
  return images
    .filter((img) => img.itemId === itemId)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}