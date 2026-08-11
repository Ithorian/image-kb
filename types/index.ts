export type AnnotationTool =
  | "select"
  | "freehand"
  | "rect"
  | "arrow"
  | "text"
  | "eraser"
  | "circle";

export interface Annotation {
  id: string;
  type: "freehand" | "rect" | "arrow" | "text" | "circle";
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

  itemId?: string;
  itemName?: string;
  role?: string;
  isCover?: boolean;
  sortOrder?: number;

  category?: string;
  location?: string;
  itemType?: string;
}

export type SortOption = "newest" | "oldest" | "name" | "size";

export type DropdownKind = "category" | "location" | "itemType";