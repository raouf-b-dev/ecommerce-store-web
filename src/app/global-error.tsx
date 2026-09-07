'use client';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <main id="main" tabIndex={-1} className="outline-none">
          <h1>Something went wrong</h1>
          <p>The storefront could not be loaded. You can try again.</p>
          <button type="button" onClick={reset}>
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
