import type { Annotation } from "@/types";

/**
 * Draw a single annotation onto a canvas context.
 * Points are normalized 0–1 and scaled by the given width/height.
 */
export function drawAnnotation(
  ctx: CanvasRenderingContext2D,
  ann: Annotation,
  width: number,
  height: number
) {
  ctx.save();
  ctx.strokeStyle = ann.color;
  ctx.fillStyle = ann.color;
  ctx.lineWidth = ann.strokeWidth * (width / 800);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const pts = ann.points;

  switch (ann.type) {
    case "freehand": {
      if (pts.length < 4) break;
      ctx.beginPath();
      ctx.moveTo(pts[0] * width, pts[1] * height);
      for (let i = 2; i < pts.length; i += 2) {
        ctx.lineTo(pts[i] * width, pts[i + 1] * height);
      }
      ctx.stroke();
      break;
    }
    case "rect": {
      if (pts.length < 4) break;
      const [x, y, w, h] = pts;
      ctx.strokeRect(x * width, y * height, w * width, h * height);
      break;
    }
    case "circle": {
      if (pts.length < 4) break;
      const [cx, cy, rx, ry] = pts;
      ctx.beginPath();
      ctx.ellipse(
        cx * width,
        cy * height,
        Math.abs(rx * width),
        Math.abs(ry * height),
        0,
        0,
        Math.PI * 2
      );
      ctx.stroke();
      break;
    }
    case "arrow": {
      if (pts.length < 4) break;
      const [x1, y1, x2, y2] = pts;
      const fromX = x1 * width;
      const fromY = y1 * height;
      const toX = x2 * width;
      const toY = y2 * height;

      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(toX, toY);
      ctx.stroke();

      const angle = Math.atan2(toY - fromY, toX - fromX);
      const headLen = 12 + ann.strokeWidth * 2;
      ctx.beginPath();
      ctx.moveTo(toX, toY);
      ctx.lineTo(
        toX - headLen * Math.cos(angle - Math.PI / 6),
        toY - headLen * Math.sin(angle - Math.PI / 6)
      );
      ctx.moveTo(toX, toY);
      ctx.lineTo(
        toX - headLen * Math.cos(angle + Math.PI / 6),
        toY - headLen * Math.sin(angle + Math.PI / 6)
      );
      ctx.stroke();
      break;
    }
    case "text": {
      if (!ann.text || pts.length < 2) break;
      // Scale vs ~500px reference; floor so labels stay readable
      const fontSize = Math.max(
        14,
        (ann.fontSize || 28) * (width / 500)
      );
      ctx.font = `600 ${fontSize}px Inter, system-ui, sans-serif`;
      ctx.textBaseline = "top";
      // Halo for contrast on light/dark areas
      ctx.lineWidth = Math.max(2, fontSize / 12);
      ctx.strokeStyle = "rgba(0,0,0,0.75)";
      ctx.strokeText(ann.text, pts[0] * width, pts[1] * height);
      ctx.fillStyle = ann.color;
      ctx.fillText(ann.text, pts[0] * width, pts[1] * height);
      break;
    }
  }
  ctx.restore();
}

/**
 * Render full image + all annotations and return a data URL.
 */
export async function exportAnnotatedImage(
  imageDataUrl: string,
  annotations: Annotation[],
  originalWidth: number,
  originalHeight: number,
  mimeType: string = "image/png"
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = originalWidth;
      canvas.height = originalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }
      ctx.drawImage(img, 0, 0, originalWidth, originalHeight);
      annotations.forEach((ann) =>
        drawAnnotation(ctx, ann, originalWidth, originalHeight)
      );
      resolve(canvas.toDataURL(mimeType));
    };
    img.onerror = () => reject(new Error("Failed to load image for export"));
    img.src = imageDataUrl;
  });
}

export function createAnnotationId(): string {
  return `ann_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}