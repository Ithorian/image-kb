"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { Annotation, AnnotationTool, KnowledgeImage } from "@/types";
import { drawAnnotation, createAnnotationId, exportAnnotatedImage } from "@/lib/annotation-utils";
import { AnnotationToolbar } from "./AnnotationToolbar";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface AnnotationCanvasProps {
  image: KnowledgeImage;
  annotations: Annotation[];
  onAnnotationsChange: (annotations: Annotation[]) => void;
  isEditable?: boolean;
  className?: string;
}

export function AnnotationCanvas({
  image,
  annotations,
  onAnnotationsChange,
  isEditable = true,
  className = "",
}: AnnotationCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<AnnotationTool>("freehand");
  const [color, setColor] = useState("#ef4444");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<number[]>([]);
  const [history, setHistory] = useState<Annotation[][]>([annotations]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [textInput, setTextInput] = useState<{ x: number; y: number } | null>(null);
  const [textValue, setTextValue] = useState("");
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [displaySize, setDisplaySize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    setHistory([annotations]);
    setHistoryIndex(0);
  }, [image.id]);

  const pushHistory = useCallback(
    (newAnns: Annotation[]) => {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newAnns);
      if (newHistory.length > 30) newHistory.shift();
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      onAnnotationsChange(newAnns);
    },
    [history, historyIndex, onAnnotationsChange]
  );

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      onAnnotationsChange(history[newIndex]);
    }
  }, [history, historyIndex, onAnnotationsChange]);

  const clearAll = useCallback(() => {
    pushHistory([]);
  }, [pushHistory]);

  const handleExport = useCallback(async () => {
    try {
      toast.loading("Exporting annotated image...");
      const dataUrl = await exportAnnotatedImage(
        image.dataUrl,
        annotations,
        image.width,
        image.height,
        "image/png"
      );
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${image.recommendedName.replace(/\.[^.]+$/, "")}-annotated.png`;
      link.click();
      toast.dismiss();
      toast.success("Annotated image downloaded");
    } catch (err) {
      toast.dismiss();
      toast.error("Failed to export image");
      console.error(err);
    }
  }, [image, annotations]);

  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;
      const container = containerRef.current;
      const maxW = container.clientWidth;
      const maxH = container.clientHeight || 600;
      const imgAspect = image.width / image.height || 1;
      const contAspect = maxW / maxH;

      let w: number, h: number;
      if (imgAspect > contAspect) {
        w = maxW;
        h = maxW / imgAspect;
      } else {
        h = maxH;
        w = maxH * imgAspect;
      }
      setDisplaySize({ w, h });
      setOffset({ x: (maxW - w) / 2, y: (maxH - h) / 2 });
    };

    updateSize();
    const ro = new ResizeObserver(updateSize);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [image.width, image.height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || displaySize.w === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = displaySize.w * dpr;
    canvas.height = displaySize.h * dpr;
    canvas.style.width = `${displaySize.w}px`;
    canvas.style.height = `${displaySize.h}px`;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, displaySize.w, displaySize.h);

    const img = new Image();
    img.src = image.dataUrl;

    const drawAll = () => {
      ctx.drawImage(img, 0, 0, displaySize.w, displaySize.h);
      annotations.forEach((ann) => drawAnnotation(ctx, ann, displaySize.w, displaySize.h));
      if (
        isDrawing &&
        currentPoints.length >= 2 &&
        tool !== "select" &&
        tool !== "text"
      ) {
        const temp: Annotation = {
          id: "temp",
          type: tool === "eraser" ? "freehand" : (tool as Annotation["type"]),
          points: currentPoints,
          color: tool === "eraser" ? "#ffffff" : color,
          strokeWidth: tool === "eraser" ? strokeWidth * 3 : strokeWidth,
        };
        drawAnnotation(ctx, temp, displaySize.w, displaySize.h);
      }
    };

    if (img.complete) {
      drawAll();
    } else {
      img.onload = drawAll;
    }
  }, [image.dataUrl, annotations, displaySize, isDrawing, currentPoints, tool, color, strokeWidth]);

  const getNormalizedPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;
    if ("touches" in e) {
      clientX = e.touches[0]?.clientX ?? 0;
      clientY = e.touches[0]?.clientY ?? 0;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;
    return { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) };
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isEditable) return;
    e.preventDefault();
    const pos = getNormalizedPos(e);

    if (tool === "text") {
      setTextInput({ x: pos.x, y: pos.y });
      setTextValue("");
      return;
    }

    if (tool === "select") return;

    setIsDrawing(true);
    if (tool === "freehand" || tool === "eraser") {
      setCurrentPoints([pos.x, pos.y]);
    } else {
      setCurrentPoints([pos.x, pos.y, pos.x, pos.y]);
    }
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !isEditable) return;
    e.preventDefault();
    const pos = getNormalizedPos(e);

    if (tool === "freehand" || tool === "eraser") {
      setCurrentPoints((prev) => [...prev, pos.x, pos.y]);
    } else {
      setCurrentPoints((prev) => [prev[0], prev[1], pos.x, pos.y]);
    }
  };

  const handlePointerUp = () => {
    if (!isDrawing || !isEditable) return;
    setIsDrawing(false);

    if (currentPoints.length < 4 && tool !== "freehand" && tool !== "eraser") {
      setCurrentPoints([]);
      return;
    }

    let newAnn: Annotation | null = null;

    if (tool === "freehand") {
      if (currentPoints.length >= 4) {
        newAnn = {
          id: createAnnotationId(),
          type: "freehand",
          points: currentPoints,
          color,
          strokeWidth,
        };
      }
    } else if (tool === "eraser") {
      if (currentPoints.length >= 4) {
        newAnn = {
          id: createAnnotationId(),
          type: "freehand",
          points: currentPoints,
          color: "#ffffff",
          strokeWidth: strokeWidth * 4,
        };
      }
    } else if (tool === "rect") {
      const [x1, y1, x2, y2] = currentPoints;
      newAnn = {
        id: createAnnotationId(),
        type: "rect",
        points: [Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1)],
        color,
        strokeWidth,
      };
    } else if (tool === "circle") {
      const [x1, y1, x2, y2] = currentPoints;
      const cx = (x1 + x2) / 2;
      const cy = (y1 + y2) / 2;
      const rx = Math.abs(x2 - x1) / 2;
      const ry = Math.abs(y2 - y1) / 2;
      newAnn = {
        id: createAnnotationId(),
        type: "circle",
        points: [cx, cy, rx, ry],
        color,
        strokeWidth,
      };
    } else if (tool === "arrow") {
      newAnn = {
        id: createAnnotationId(),
        type: "arrow",
        points: currentPoints,
        color,
        strokeWidth,
      };
    }

    if (newAnn) {
      pushHistory([...annotations, newAnn]);
    }
    setCurrentPoints([]);
  };

  const handleTextSubmit = () => {
    if (!textInput || !textValue.trim()) {
      setTextInput(null);
      return;
    }
    const newAnn: Annotation = {
      id: createAnnotationId(),
      type: "text",
      points: [textInput.x, textInput.y],
      color,
      strokeWidth,
      text: textValue.trim(),
      fontSize: 18,
    };
    pushHistory([...annotations, newAnn]);
    setTextInput(null);
    setTextValue("");
  };

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {isEditable && (
        <AnnotationToolbar
          tool={tool}
          onToolChange={setTool}
          color={color}
          onColorChange={setColor}
          strokeWidth={strokeWidth}
          onStrokeWidthChange={setStrokeWidth}
          onUndo={undo}
          canUndo={historyIndex > 0}
          onClear={clearAll}
          annotationCount={annotations.length}
          onExport={handleExport}
        />
      )}

      <div
        ref={containerRef}
        className="relative w-full bg-muted/40 rounded-lg overflow-hidden border border-border"
        style={{ minHeight: 320, height: "min(60vh, 620px)" }}
      >
        <canvas
          ref={canvasRef}
          className="absolute touch-none"
          style={{
            left: offset.x,
            top: offset.y,
            cursor: tool === "text" ? "text" : tool === "select" ? "default" : "crosshair",
          }}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
        />

        {textInput && (
          <div
            className="absolute z-20 bg-background border border-border rounded-md shadow-lg p-2 flex gap-2 items-center"
            style={{
              left: `${Math.min(textInput.x * 100, 70)}%`,
              top: `${Math.max(textInput.y * 100 - 8, 5)}%`,
            }}
          >
            <input
              autoFocus
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleTextSubmit();
                if (e.key === "Escape") setTextInput(null);
              }}
              placeholder="Type annotation..."
              className="px-2 py-1 text-sm bg-transparent border-none outline-none min-w-[160px] text-foreground"
            />
            <Button size="sm" onClick={handleTextSubmit} className="h-7 text-xs">
              Add
            </Button>
          </div>
        )}
      </div>

      {isEditable && (
        <p className="text-xs text-muted-foreground text-center">
          {tool === "text"
            ? "Click on the image to place a text label"
            : tool === "select"
            ? "Select tool (view only for now)"
            : `Current tool: ${tool} • ${annotations.length} annotation${annotations.length !== 1 ? "s" : ""} • Drag to draw`}
        </p>
      )}
    </div>
  );
}