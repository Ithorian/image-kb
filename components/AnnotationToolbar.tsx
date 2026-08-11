"use client";

import React from "react";
import { AnnotationTool } from "@/types";
import {
  Pencil,
  Square,
  Circle,
  ArrowRight,
  Type,
  Eraser,
  MousePointer2,
  Undo2,
  Trash2,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AnnotationToolbarProps {
  tool: AnnotationTool;
  onToolChange: (tool: AnnotationTool) => void;
  color: string;
  onColorChange: (color: string) => void;
  strokeWidth: number;
  onStrokeWidthChange: (width: number) => void;
  onUndo: () => void;
  canUndo: boolean;
  onClear: () => void;
  annotationCount: number;
  onExport?: () => void;
}

const TOOLS: { id: AnnotationTool; icon: React.ReactNode; label: string }[] = [
  { id: "select", icon: <MousePointer2 className="h-4 w-4" />, label: "Select" },
  { id: "freehand", icon: <Pencil className="h-4 w-4" />, label: "Pen" },
  { id: "rect", icon: <Square className="h-4 w-4" />, label: "Rectangle" },
  { id: "circle", icon: <Circle className="h-4 w-4" />, label: "Circle" },
  { id: "arrow", icon: <ArrowRight className="h-4 w-4" />, label: "Arrow" },
  { id: "text", icon: <Type className="h-4 w-4" />, label: "Text" },
  { id: "eraser", icon: <Eraser className="h-4 w-4" />, label: "Eraser" },
];

const PRESET_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#ffffff",
  "#000000",
];

export function AnnotationToolbar({
  tool,
  onToolChange,
  color,
  onColorChange,
  strokeWidth,
  onStrokeWidthChange,
  onUndo,
  canUndo,
  onClear,
  annotationCount,
  onExport,
}: AnnotationToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 p-2 bg-background border border-border rounded-lg shadow-sm">
      <div className="flex items-center gap-1 border-r border-border pr-2">
        {TOOLS.map((t) => (
          <Button
            key={t.id}
            variant={tool === t.id ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => onToolChange(t.id)}
            title={t.label}
          >
            {t.icon}
          </Button>
        ))}
      </div>

      <div className="flex items-center gap-1 border-r border-border pr-2">
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => onColorChange(c)}
            className={cn(
              "h-6 w-6 rounded-full border-2 transition-transform hover:scale-110",
              color === c ? "border-primary scale-110" : "border-transparent"
            )}
            style={{ backgroundColor: c }}
            title={c}
          />
        ))}
        <input
          type="color"
          value={color}
          onChange={(e) => onColorChange(e.target.value)}
          className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent"
          title="Custom color"
        />
      </div>

      <div className="flex items-center gap-2 border-r border-border pr-2">
        <span className="text-xs text-muted-foreground">Size</span>
        <input
          type="range"
          min={1}
          max={20}
          value={strokeWidth}
          onChange={(e) => onStrokeWidthChange(Number(e.target.value))}
          className="w-20 h-1.5 accent-primary"
        />
        <span className="text-xs w-4">{strokeWidth}</span>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo"
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={onClear}
          disabled={annotationCount === 0}
          title="Clear all annotations"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        {onExport && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onExport}
            title="Download annotated image"
          >
            <Download className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}