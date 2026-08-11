"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getOptions, addOption } from "@/lib/dropdown-options";
import type { DropdownKind } from "@/types";

interface ExtensibleSelectProps {
  kind: DropdownKind;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Dropdown that supports selecting a preset OR typing a new value.
 * New values are persisted to localStorage for future sessions.
 */
export function ExtensibleSelect({
  kind,
  label,
  value,
  onChange,
  placeholder = "Select or type…",
  disabled = false,
  className,
}: ExtensibleSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [options, setOptions] = React.useState<string[]>([]);
  const [query, setQuery] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setOptions(getOptions(kind));
  }, [kind]);

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [options, query]);

  const exactMatch = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return options.some((o) => o.toLowerCase() === q);
  }, [options, query]);

  const selectValue = (v: string) => {
    onChange(v);
    setOpen(false);
    setQuery("");
  };

  const createAndSelect = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    const next = addOption(kind, trimmed);
    setOptions(next);
    onChange(trimmed);
    setOpen(false);
    setQuery("");
  };

  return (
    <div className={cn("space-y-1.5 relative", className)} ref={containerRef}>
      <Label>{label}</Label>
      <Button
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={open}
        disabled={disabled}
        className="w-full justify-between font-normal h-9"
        onClick={() => {
          setOpen((o) => !o);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
      >
        <span className={cn("truncate", !value && "text-muted-foreground")}>
          {value || placeholder}
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md">
          <div className="p-2 border-b">
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search or add new…"
              className="h-8"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (!exactMatch && query.trim()) {
                    createAndSelect();
                  } else if (filtered.length === 1) {
                    selectValue(filtered[0]);
                  } else if (exactMatch && query.trim()) {
                    const match = options.find(
                      (o) => o.toLowerCase() === query.trim().toLowerCase()
                    );
                    if (match) selectValue(match);
                  }
                }
                if (e.key === "Escape") {
                  setOpen(false);
                  setQuery("");
                }
              }}
            />
          </div>
          <div className="max-h-48 overflow-y-auto p-1">
            {filtered.map((opt) => (
              <button
                key={opt}
                type="button"
                className={cn(
                  "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                  value === opt && "bg-accent/50"
                )}
                onClick={() => selectValue(opt)}
              >
                <Check
                  className={cn(
                    "mr-2 h-3.5 w-3.5",
                    value === opt ? "opacity-100" : "opacity-0"
                  )}
                />
                {opt}
              </button>
            ))}

            {!exactMatch && query.trim() && (
              <button
                type="button"
                className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground text-primary"
                onClick={createAndSelect}
              >
                <Plus className="mr-2 h-3.5 w-3.5" />
                Add “{query.trim()}”
              </button>
            )}

            {filtered.length === 0 && exactMatch && (
              <p className="px-2 py-1.5 text-sm text-muted-foreground">
                No matches
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}