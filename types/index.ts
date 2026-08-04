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
}

export type SortOption = "newest" | "oldest" | "name" | "size";
