"use client";

import { openDB, type IDBPDatabase } from "idb";
import type { KnowledgeImage } from "@/types";

const DB_NAME = "image-kb";
const STORE_NAME = "images";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
          store.createIndex("createdAt", "createdAt");
          store.createIndex("tags", "tags", { multiEntry: true });
        }
      },
    });
  }
  return dbPromise;
}

export async function getAllImages(): Promise<KnowledgeImage[]> {
  const db = await getDB();
  const images = await db.getAll(STORE_NAME);
  return images.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getImage(id: string): Promise<KnowledgeImage | undefined> {
  const db = await getDB();
  return db.get(STORE_NAME, id);
}

export async function saveImage(image: KnowledgeImage): Promise<void> {
  const db = await getDB();
  await db.put(STORE_NAME, image);
}

export async function saveImages(images: KnowledgeImage[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  await Promise.all(images.map((img) => tx.store.put(img)));
  await tx.done;
}

export async function deleteImage(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
}

export async function clearAllImages(): Promise<void> {
  const db = await getDB();
  await db.clear(STORE_NAME);
}

export async function getAllTags(): Promise<string[]> {
  const images = await getAllImages();
  const tagSet = new Set<string>();
  images.forEach((img) => img.tags.forEach((t) => tagSet.add(t)));
  return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
}

export async function exportKB(): Promise<string> {
  const images = await getAllImages();
  return JSON.stringify(images, null, 2);
}

export async function importKB(json: string): Promise<number> {
  const data = JSON.parse(json) as KnowledgeImage[];
  if (!Array.isArray(data)) throw new Error("Invalid KB export");
  await saveImages(data);
  return data.length;
}
