"use client";

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">ImageKB</h1>
        <p className="text-muted-foreground">
          The full application files are still being uploaded to GitHub.
          <br />
          Please wait a moment and run <code className="bg-muted px-1 rounded">git pull</code> again.
        </p>
      </div>
    </div>
  );
}
