export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--primary)' }}>
        ELI5 Now!
      </h1>
      <p className="text-xl" style={{ color: 'var(--foreground-muted)' }}>
        No Question Unanswered!
      </p>
      <p className="mt-8" style={{ color: 'var(--foreground-subtle)' }}>
        Chat interface coming soon...
      </p>
    </main>
  );
}
