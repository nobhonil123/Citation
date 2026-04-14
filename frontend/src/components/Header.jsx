export default function Header() {
  return (
    <header className="bg-primary text-white shadow-lg">
      <div className="max-w-4xl mx-auto px-4 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">📖</span>
          <div>
            <h1 className="text-xl font-bold leading-tight">Citation Generator</h1>
            <p className="text-xs text-blue-200">AI-Powered Academic Citations · APA 7th Edition</p>
          </div>
        </div>
        <nav className="hidden sm:flex items-center gap-4 text-sm text-blue-100">
          <a
            href="https://apastyle.apa.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            APA Style Guide ↗
          </a>
        </nav>
      </div>
    </header>
  )
}
