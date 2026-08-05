import type { KnowledgeImage, SortOption } from "@/types";

export function getUniqueTags(images: KnowledgeImage[]): string[] {
  const set = new Set<string>();
  images.forEach((img) => img.tags.forEach((t) => set.add(t)));
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

export function filterAndSortImages(
  images: KnowledgeImage[],
  options: {
    search?: string;
    tags?: string[];
    sort?: SortOption;
  } = {}
): KnowledgeImage[] {
  const { search = "", tags = [], sort = "newest" } = options;

  let result = [...images];

  if (search.trim()) {
    const q = search.toLowerCase().trim();
    result = result.filter(
      (img) =>
        img.originalName.toLowerCase().includes(q) ||
        img.recommendedName.toLowerCase().includes(q) ||
        img.tags.some((t) => t.toLowerCase().includes(q)) ||
        (img.notes && img.notes.toLowerCase().includes(q))
    );
  }

  if (tags.length > 0) {
    result = result.filter((img) =>
      tags.every((t) => img.tags.includes(t))
    );
  }

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
