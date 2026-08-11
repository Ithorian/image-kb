"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  allTags?: string[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  maxTags?: number;
}

export function TagInput({
  tags,
  onChange,
  allTags = [],
  placeholder = "Type a tag and press Enter",
  className,
  disabled = false,
  maxTags = 20,
}: TagInputProps) {
  const [inputValue, setInputValue] = React.useState("");
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const normalizedInput = inputValue.trim().toLowerCase();

  const suggestions = React.useMemo(() => {
    if (!normalizedInput) return [];
    return allTags
      .filter(
        (t) =>
          t.toLowerCase().includes(normalizedInput) &&
          !tags.some((existing) => existing.toLowerCase() === t.toLowerCase())
      )
      .slice(0, 8);
  }, [allTags, normalizedInput, tags]);

  const addTag = (raw: string) => {
    const tag = raw.trim().replace(/,/g, "");
    if (!tag) return;
    if (tags.length >= maxTags) return;
    if (tags.some((t) => t.toLowerCase() === tag.toLowerCase())) {
      setInputValue("");
      return;
    }
    onChange([...tags, tag]);
    setInputValue("");
    setShowSuggestions(false);
  };

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      removeTag(tags.length - 1);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      if (inputValue.trim()) {
        addTag(inputValue);
      }
      setShowSuggestions(false);
    }, 150);
  };

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className={cn("space-y-1.5", className)} ref={containerRef}>
      <div className="flex flex-wrap items-center gap-1.5 min-h-9 rounded-md border border-input bg-background px-2 py-1.5">
        {tags.map((tag, i) => (
          <Badge
            key={`${tag}-${i}`}
            variant="secondary"
            className="gap-1 pr-1 text-xs font-medium"
          >
            {tag}
            {!disabled && (
              <button
                type="button"
                onClick={() => removeTag(i)}
                className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
                aria-label={`Remove ${tag}`}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : "Add another…"}
          disabled={disabled || tags.length >= maxTags}
          className="flex-1 min-w-[140px] border-0 shadow-none focus-visible:ring-0 h-7 px-1 text-sm"
        />
      </div>
      <p className="text-[10px] text-muted-foreground">
        Press Enter or comma to add · tags save with the image
      </p>

      {showSuggestions && suggestions.length > 0 && (
        <div className="relative z-50">
          <ul className="absolute top-0 left-0 right-0 z-50 max-h-48 overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
            {suggestions.map((s) => (
              <li key={s}>
                <button
                  type="button"
                  className="w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    addTag(s);
                  }}
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}