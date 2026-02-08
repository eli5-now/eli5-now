export default function Home() {
  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header
        className="flex items-center justify-center py-4 border-b"
        style={{ borderColor: 'var(--surface-alt)', backgroundColor: 'var(--surface)' }}
      >
        <h1 className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>
          ELI5 Now!
        </h1>
      </header>

      {/* Message area */}
      <main
        className="flex-1 overflow-y-auto p-4"
        style={{ backgroundColor: 'var(--background)' }}
      >
        <p
          className="text-center mt-8"
          style={{ color: 'var(--foreground-subtle)' }}
        >
          Ask Eli anything!
        </p>
      </main>

      {/* Input area placeholder */}
      <footer
        className="p-4 border-t"
        style={{ borderColor: 'var(--surface-alt)', backgroundColor: 'var(--surface)' }}
      >
        <div
          className="rounded-full px-4 py-3"
          style={{ backgroundColor: 'var(--surface-alt)', color: 'var(--foreground-subtle)' }}
        >
          Type your question here...
        </div>
      </footer>
    </div>
  );
}
