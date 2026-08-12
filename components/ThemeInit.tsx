"use client";

import { useEffect } from "react";

export function ThemeInit() {
  useEffect(() => {
    const stored = localStorage.getItem("theme") as "light" | "dark" | null;
    const preferred = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
    const theme = stored || preferred;
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, []);
  return null;
}