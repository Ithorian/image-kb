export type AnnotationTool = "select" | "freehand" | "rect" | "arrow" | "text" | "eraser" | "circle";

export interface Annotation {
  id: string;
  type: "freehand" | "rect" | "arrow" | "text" | "circle";
  /** Normalized coordinates 0–1 relative to original image dimensions */
  points: number[];
  color: string;
  strokeWidth: number;
  text?: string;
  fontSize?: number;
}

export interface KnowledgeImage {
  id: string;
  originalName: string;
  recommendedName: string;
  dataUrl: string;
  mimeType: string;
  size: number;
  width: number;
  height: number;
  tags: string[];
  annotations: Annotation[];
  notes?: string;
  createdAt: string;
  updatedAt: string;

  // Multi-image item grouping (shared across photos of the same real-world thing)
  itemId?: string;          // UUID shared by all photos of the same item
  itemName?: string;        // e.g. "A/C Unit – Master Bedroom"
  role?: string;            // e.g. "Front View", "Side View", "Manufacturer Placard"
  isCover?: boolean;        // true = representative image shown in main gallery
  sortOrder?: number;       // order within the item group
}

export type SortOption = "newest" | "oldest" | "name" | "size";
