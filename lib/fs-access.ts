"use client";

import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "image-kb-fs";
const STORE_NAME = "handles";
const HANDLE_KEY = "knowledge-base-root";

// ---------- Extend the incomplete DOM types ----------
interface FileSystemDirectoryHandleWithPermission extends FileSystemDirectoryHandle {
  queryPermission(descriptor?: { mode?: "read" | "readwrite" }): Promise<PermissionState>;
  requestPermission(descriptor?: { mode?: "read" | "readwrite" }): Promise<PermissionState>;
}

/** `values()` is shipped in Chromium but missing from the bundled DOM types. */
interface FileSystemDirectoryHandleWithValues extends FileSystemDirectoryHandle {
  values(): AsyncIterableIterator<FileSystemDirectoryHandle | FileSystemFileHandle>;
}

// ---------- Types ----------

export interface PhotoIndexEntry {
  dateAdded: string;
  filename: string;
  description: string;
  relatedSection: string;
}

export interface SaveToKBOptions {
  recommendedName: string;
  annotatedBlob: Blob;
  description?: string;
  relatedSection?: string;
  tags?: string[];
  /** Set once the user has confirmed replacing an existing file. */
  overwrite?: boolean;
}

export interface SaveToKBResult {
  success: boolean;
  message: string;
  /** Nothing was written because the filename is already taken. */
  conflict?: boolean;
  /** A free `Name (n).ext` variant offered alongside the conflict. */
  suggestedName?: string;
}

// ---------- Browser Support ----------

export function isFileSystemAccessSupported(): boolean {
  return typeof window !== "undefined" && "showDirectoryPicker" in window;
}

// ---------- IndexedDB for Directory Handle ----------

let dbPromise: Promise<IDBPDatabase> | null = null;

function getHandleDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
  }
  return dbPromise;
}

export async function persistDirectoryHandle(
  handle: FileSystemDirectoryHandle
): Promise<void> {
  const db = await getHandleDB();
  await db.put(STORE_NAME, handle, HANDLE_KEY);
}

export async function getPersistedDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await getHandleDB();
    const handle = (await db.get(STORE_NAME, HANDLE_KEY)) as
      | FileSystemDirectoryHandleWithPermission
      | undefined;

    if (!handle) return null;

    let permission = await handle.queryPermission({ mode: "readwrite" });
    if (permission !== "granted") {
      permission = await handle.requestPermission({ mode: "readwrite" });
    }

    return permission === "granted" ? handle : null;
  } catch (err) {
    console.warn("Failed to restore directory handle", err);
    return null;
  }
}

export async function clearPersistedDirectoryHandle(): Promise<void> {
  const db = await getHandleDB();
  await db.delete(STORE_NAME, HANDLE_KEY);
}

export async function requestKnowledgeBaseDirectory(): Promise<FileSystemDirectoryHandle | null> {
  if (!isFileSystemAccessSupported()) {
    return null;
  }

  try {
    // @ts-expect-error File System Access API
    const handle: FileSystemDirectoryHandle = await window.showDirectoryPicker({
      mode: "readwrite",
      id: "knowledge-base-root",
      startIn: "documents",
    });

    await persistDirectoryHandle(handle);
    return handle;
  } catch (err) {
    console.warn("Directory picker cancelled or failed", err);
    return null;
  }
}

// ---------- Helpers to resolve the correct Media folder ----------

/**
 * Returns the correct Media directory handle.
 * - If user selected the knowledge-base root → use/create Media/ inside it
 * - If user selected the Media folder itself → use it directly (no nesting)
 */
async function resolveMediaDirectory(
  selectedHandle: FileSystemDirectoryHandle
): Promise<FileSystemDirectoryHandle> {
  if (selectedHandle.name.toLowerCase() === "media") {
    return selectedHandle;
  }

  return await selectedHandle.getDirectoryHandle("Media", { create: true });
}

// ---------- Existence check / name suggestions ----------

async function fileExistsIn(
  dirHandle: FileSystemDirectoryHandle,
  filename: string
): Promise<boolean> {
  try {
    await dirHandle.getFileHandle(filename);
    return true;
  } catch (err) {
    if (err instanceof DOMException && err.name === "NotFoundError") {
      return false;
    }
    throw err;
  }
}

export async function mediaFileExists(
  rootOrMediaHandle: FileSystemDirectoryHandle,
  filename: string
): Promise<boolean> {
  const mediaHandle = await resolveMediaDirectory(rootOrMediaHandle);
  return fileExistsIn(mediaHandle, filename);
}

/** Splits `Home-AC (2).jpg` into `Home-AC (2)` + `.jpg`. */
function splitExtension(filename: string): { base: string; ext: string } {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot <= 0) return { base: filename, ext: "" };
  return { base: filename.slice(0, lastDot), ext: filename.slice(lastDot) };
}

const COUNTER_SUFFIX = /\s*\((\d+)\)$/;
const MAX_NAME_ATTEMPTS = 500;

/**
 * Finds the first free `Name (n).ext` variant so multiple views of the same
 * item can live side by side. An existing counter is replaced rather than
 * stacked, so `Faucet (2).jpg` yields `Faucet (3).jpg`.
 */
export async function suggestAvailableName(
  rootOrMediaHandle: FileSystemDirectoryHandle,
  filename: string
): Promise<string | undefined> {
  const mediaHandle = await resolveMediaDirectory(rootOrMediaHandle);
  const { base, ext } = splitExtension(filename);
  const stem = base.replace(COUNTER_SUFFIX, "");

  for (let n = 2; n <= MAX_NAME_ATTEMPTS; n++) {
    const candidate = `${stem} (${n})${ext}`;
    if (!(await fileExistsIn(mediaHandle, candidate))) return candidate;
  }

  return undefined;
}

// ---------- Write image into Media/ ----------

export async function writeImageToMedia(
  rootOrMediaHandle: FileSystemDirectoryHandle,
  filename: string,
  blob: Blob
): Promise<void> {
  const mediaHandle = await resolveMediaDirectory(rootOrMediaHandle);

  const fileHandle = await mediaHandle.getFileHandle(filename, {
    create: true,
  });

  const writable = await fileHandle.createWritable();
  await writable.write(blob);
  await writable.close();
}

// ---------- Append row to Media-Index.md ----------

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Keeps free-text from breaking the Markdown table's columns or rows. */
function escapeTableCell(value: string): string {
  return value.replace(/\s*[\r\n]+\s*/g, " ").replace(/\|/g, "\\|").trim();
}

export async function appendToMediaIndex(
  rootOrMediaHandle: FileSystemDirectoryHandle,
  entry: PhotoIndexEntry
): Promise<void> {
  const mediaHandle = await resolveMediaDirectory(rootOrMediaHandle);

  const indexHandle = await mediaHandle.getFileHandle("Media-Index.md", {
    create: true,
  });

  const file = await indexHandle.getFile();
  let content = await file.text();

  const newRow = `| ${entry.dateAdded} | ${entry.filename} | ${escapeTableCell(
    entry.description
  )} | ${escapeTableCell(entry.relatedSection)} |`;

  // A replaced image keeps one row rather than gaining a duplicate
  const existingRow = new RegExp(
    `^\\|[^|\\n]*\\|\\s*${escapeRegExp(entry.filename)}\\s*\\|[^\\n]*$`,
    "m"
  );
  if (existingRow.test(content)) {
    // Replacer function so `$&`-style sequences in the text stay literal
    content = content.replace(existingRow, () => newRow);
    const writable = await indexHandle.createWritable();
    await writable.write(content);
    await writable.close();
    return;
  }

  const notesMarker = "\n\n## Notes";
  if (content.includes(notesMarker)) {
    content = content.replace(notesMarker, () => `\n${newRow}${notesMarker}`);
  } else if (content.includes("| ---------- |")) {
    content = content.trimEnd() + `\n${newRow}\n`;
  } else {
    content += `\n\n| Date Added | Filename | Description | Related Section |\n| ---------- | -------- | ----------- | --------------- |\n${newRow}\n`;
  }

  const writable = await indexHandle.createWritable();
  await writable.write(content);
  await writable.close();
}

// ---------- Gallery helpers ----------

export async function listMediaImages(): Promise<
  { name: string; file: File; handle: FileSystemFileHandle }[]
> {
  const root = await getPersistedDirectoryHandle();
  if (!root) {
    throw new Error(
      "No Knowledge-base folder selected. Save one image first or reset permission."
    );
  }

  const mediaHandle = await resolveMediaDirectory(root);
  const images: { name: string; file: File; handle: FileSystemFileHandle }[] = [];

  const iterable = mediaHandle as FileSystemDirectoryHandleWithValues;

  for await (const entry of iterable.values()) {
    if (entry.kind !== "file") continue;

    const name = entry.name.toLowerCase();
    if (
      !name.endsWith(".jpg") &&
      !name.endsWith(".jpeg") &&
      !name.endsWith(".png") &&
      !name.endsWith(".webp")
    ) {
      continue;
    }

    const file = await entry.getFile();
    images.push({ name: entry.name, file, handle: entry });
  }

  // Newest-looking names first
  images.sort((a, b) => b.name.localeCompare(a.name));
  return images;
}

// ---------- High-level helper ----------

export async function saveToKnowledgeBase(
  options: SaveToKBOptions
): Promise<SaveToKBResult> {
  if (!isFileSystemAccessSupported()) {
    return {
      success: false,
      message:
        "File System Access API is not supported in this browser. Please use Chrome or Edge.",
    };
  }

  let root = await getPersistedDirectoryHandle();

  if (!root) {
    root = await requestKnowledgeBaseDirectory();
    if (!root) {
      return {
        success: false,
        message: "No Knowledge-base folder selected.",
      };
    }
  }

  try {
    if (!options.overwrite) {
      const exists = await mediaFileExists(root, options.recommendedName);
      if (exists) {
        return {
          success: false,
          conflict: true,
          suggestedName: await suggestAvailableName(
            root,
            options.recommendedName
          ),
          message: `“${options.recommendedName}” already exists in Media/`,
        };
      }
    }

    await writeImageToMedia(root, options.recommendedName, options.annotatedBlob);

    const now = new Date();
    const dateAdded = `${String(now.getMonth() + 1).padStart(2, "0")}/${String(
      now.getDate()
    ).padStart(2, "0")}/${now.getFullYear()}`;

    const description =
      options.description?.trim() ||
      options.tags?.join(", ") ||
      "Added via ImageKB";

    const relatedSection = options.relatedSection?.trim() || "Media";

    await appendToMediaIndex(root, {
      dateAdded,
      filename: options.recommendedName,
      description,
      relatedSection,
    });

    const locationHint =
      root.name.toLowerCase() === "media"
        ? "Media/"
        : "Media/ (inside the selected knowledge-base folder)";

    return {
      success: true,
      message: `${
        options.overwrite ? "Replaced" : "Saved"
      } “${options.recommendedName}” in ${locationHint} and updated Media-Index.md`,
    };
  } catch (err) {
    console.error("saveToKnowledgeBase failed", err);
    return {
      success: false,
      message:
        err instanceof Error
          ? err.message
          : "Failed to save to Knowledge-base. Check folder permissions.",
    };
  }
}