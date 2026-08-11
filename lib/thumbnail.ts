/**
 * Creates a small JPEG thumbnail from an image Blob or File.
 * Returns a new Blob (image/jpeg) and a temporary object URL.
 */
export async function createThumbnail(
    source: Blob,
    maxWidth = 320,
    quality = 0.72
  ): Promise<{ blob: Blob; url: string }> {
    const bitmap = await createImageBitmap(source);
  
    const scale = Math.min(1, maxWidth / bitmap.width);
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
  
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
  
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Could not get canvas context for thumbnail");
    }
  
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
  
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Thumbnail blob failed"))),
        "image/jpeg",
        quality
      );
    });
  
    const url = URL.createObjectURL(blob);
    return { blob, url };
  }