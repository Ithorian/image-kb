"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import type { KnowledgeImage } from "@/types";
import { toast } from "sonner";

interface SortableFilmStripProps {
  images: KnowledgeImage[];
  selectedId: string;
  /** When true, thumbs are draggable and order persists on drop */
  sortable: boolean;
  onSelect: (img: KnowledgeImage) => void;
  /** Persist new sortOrder for each image that changed */
  onReorder: (ordered: KnowledgeImage[]) => void | Promise<void>;
}

function SortableThumb({
  img,
  selected,
  sortable,
  onSelect,
}: {
  img: KnowledgeImage;
  selected: boolean;
  sortable: boolean;
  onSelect: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: img.id, disabled: !sortable });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.85 : 1,
  };

  return (
    <button
      ref={setNodeRef}
      type="button"
      style={style}
      onClick={onSelect}
      className={cn(
        "relative shrink-0 w-20 h-16 rounded-md overflow-hidden border-2 transition-all touch-none",
        selected
          ? "border-primary ring-2 ring-primary/30"
          : "border-transparent hover:border-muted-foreground/40",
        sortable && "cursor-grab active:cursor-grabbing",
        isDragging && "shadow-lg ring-2 ring-primary/50"
      )}
      {...(sortable ? { ...attributes, ...listeners } : {})}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={img.dataUrl}
        alt={img.role || img.recommendedName}
        className="w-full h-full object-cover pointer-events-none"
        draggable={false}
      />
      {img.isCover && (
        <span className="absolute top-0.5 left-0.5 bg-amber-500 text-black text-[8px] font-medium px-1 rounded">
          Cover
        </span>
      )}
      {img.role && (
        <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[9px] text-white text-center truncate px-0.5 pointer-events-none">
          {img.role}
        </span>
      )}
    </button>
  );
}

export function SortableFilmStrip({
  images,
  selectedId,
  sortable,
  onSelect,
  onReorder,
}: SortableFilmStripProps) {
  const [items, setItems] = useState(images);

  useEffect(() => {
    setItems(images);
  }, [images]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = arrayMove(items, oldIndex, newIndex).map((img, index) => ({
      ...img,
      sortOrder: index,
      updatedAt: new Date().toISOString(),
    }));

    setItems(reordered);
    try {
      await onReorder(reordered);
      toast.success("Photo order updated");
    } catch (e) {
      console.error(e);
      setItems(images);
      toast.error("Failed to save order");
    }
  };

  if (!sortable) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-1">
        {items.map((img) => (
          <button
            key={img.id}
            type="button"
            onClick={() => onSelect(img)}
            className={cn(
              "relative shrink-0 w-20 h-16 rounded-md overflow-hidden border-2 transition-all",
              img.id === selectedId
                ? "border-primary ring-2 ring-primary/30"
                : "border-transparent hover:border-muted-foreground/40"
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.dataUrl}
              alt={img.role || img.recommendedName}
              className="w-full h-full object-cover"
            />
            {img.isCover && (
              <span className="absolute top-0.5 left-0.5 bg-amber-500 text-black text-[8px] font-medium px-1 rounded">
                Cover
              </span>
            )}
            {img.role && (
              <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[9px] text-white text-center truncate px-0.5">
                {img.role}
              </span>
            )}
          </button>
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((i) => i.id)}
        strategy={horizontalListSortingStrategy}
      >
        <div className="flex gap-2 overflow-x-auto pb-1">
          {items.map((img) => (
            <SortableThumb
              key={img.id}
              img={img}
              selected={img.id === selectedId}
              sortable={sortable}
              onSelect={() => onSelect(img)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}