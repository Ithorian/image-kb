# ImageKB — Knowledge Base Image Manager

A polished, fully client-side micro-app for uploading, organizing, tagging, and annotating images in a personal **Knowledge Base**.

Built with **Next.js 15**, **TypeScript**, **Tailwind CSS**, and **shadcn/ui**.

## Features

- **Drag & drop multi-image upload** with live previews
- **Smart recommended filenames** based on original name, tags, dimensions, and date
- **Tagging system** with suggestions from existing tags, multi-tag filters, and search
- **Annotation overlay** on any image:
  - Freehand pen, rectangle, circle, arrow, text labels
  - Color picker + stroke width
  - Undo / Clear
  - Export full-resolution annotated PNG
- **Gallery** with responsive grid, search, tag chips, sort (newest / oldest / name / size)
- **Image detail view** with editable metadata, tags, notes, and live annotation canvas
- **Persistence** via IndexedDB (survives page reloads)
- **Export / Import** the entire Knowledge Base as JSON
- **Dark / Light mode** toggle
- Fully responsive and free of external backend dependencies

## Tech Stack

| Layer            | Choice                          |
|------------------|---------------------------------|
| Framework        | Next.js 15 (App Router)         |
| Language         | TypeScript                      |
| Styling          | Tailwind CSS + shadcn/ui        |
| Icons            | lucide-react                    |
| Toasts           | sonner                          |
| Storage          | IndexedDB (`idb`)               |
| IDs              | uuid                            |
| Package Manager  | **pnpm**                        |

## Getting Started

This project uses **pnpm**.

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

Other useful commands:

```bash
pnpm build
pnpm start
pnpm lint
```

All data is stored locally in the browser’s IndexedDB under the database name `image-kb`. Clearing site data will wipe the Knowledge Base.

## Project Structure

```
image-kb/
├── app/
│   ├── layout.tsx          # Root layout + theme + toaster
│   ├── page.tsx            # Main orchestration
│   └── globals.css         # Tailwind + CSS variables
├── components/
│   ├── ui/                 # shadcn primitives
│   ├── AnnotationCanvas.tsx
│   ├── AnnotationToolbar.tsx
│   ├── ImageCard.tsx
│   ├── ImageDetail.tsx
│   ├── ImageGallery.tsx
│   ├── ImageUploader.tsx
│   ├── TagInput.tsx
│   └── ThemeToggle.tsx
├── lib/
│   ├── storage.ts          # IndexedDB helpers
│   ├── filename-recommender.ts
│   ├── filter.ts
│   ├── annotation-utils.ts
│   └── utils.ts
├── types/
│   └── index.ts
├── package.json
├── tailwind.config.ts
└── components.json
```

## Data Model

```ts
interface KnowledgeImage {
  id: string;
  originalName: string;
  recommendedName: string;
  dataUrl: string;
  mimeType: string;
  size: number;
  width: number;
  height: number;
  tags: string[];
  annotations: Annotation[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

Annotations are stored with **normalized coordinates (0–1)** so they remain correct when the image is displayed at any size.

## License

MIT — feel free to use, modify, and build upon.
