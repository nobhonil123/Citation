export default function Footer() {
  return (
    <footer className="bg-primary-dark text-blue-200 py-6 mt-8">
      <div className="max-w-4xl mx-auto px-4 text-center text-sm">
        <p className="mb-1">
          <span className="font-semibold text-white">Citation Generator</span> — APA 7th Edition
        </p>
        <p className="text-xs">
          Powered by{' '}
          <a
            href="https://www.crossref.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-white"
          >
            CrossRef API
          </a>{' '}
          · Built with FastAPI &amp; React
        </p>
        <p className="text-xs mt-2 opacity-60">
          © 2024 nobhonil123 · MIT License
        </p>
      </div>
    </footer>
  )
}
