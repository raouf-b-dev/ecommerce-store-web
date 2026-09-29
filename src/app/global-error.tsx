'use client';

export default function GlobalError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <main id="main" tabIndex={-1} className="outline-none">
          <h1>Something went wrong</h1>
          <p>The shop could not be loaded. You can try again.</p>
          <button type="button" onClick={retry}>
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
