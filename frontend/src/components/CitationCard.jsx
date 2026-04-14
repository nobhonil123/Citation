import { useState } from 'react'
import toast from 'react-hot-toast'

function renderAPA(citation) {
  // Render *text* as italic spans
  const parts = citation.split(/(\*[^*]+\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i}>{part.slice(1, -1)}</em>
    }
    return <span key={i}>{part}</span>
  })
}

export default function CitationCard({ citation, bibtex, metadata, onEditMetadata }) {
  const [showBibtex, setShowBibtex] = useState(false)

  const copyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${label} copied to clipboard!`)
    } catch {
      toast.error('Failed to copy to clipboard')
    }
  }

  const downloadBibtex = () => {
    const blob = new Blob([bibtex], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'citation.bib'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('BibTeX downloaded!')
  }

  const plainTextCitation = citation.replace(/\*/g, '')

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-primary">Generated Citation</h2>
        <span className="text-xs bg-primary text-white px-2 py-1 rounded-full">APA 7th Edition</span>
      </div>

      {/* APA Citation Box */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 apa-citation">
        <p className="apa-citation-text text-gray-800 leading-relaxed">
          {renderAPA(citation)}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => copyToClipboard(plainTextCitation, 'Citation')}
          className="btn-accent text-sm flex items-center gap-1"
        >
          📋 Copy to Clipboard
        </button>
        <button
          onClick={() => setShowBibtex((v) => !v)}
          className="btn-outline text-sm"
        >
          {showBibtex ? 'Hide' : '📦 Show'} BibTeX
        </button>
        <button
          onClick={downloadBibtex}
          className="btn-outline text-sm flex items-center gap-1"
        >
          ⬇️ Download .bib
        </button>
        {onEditMetadata && (
          <button
            onClick={onEditMetadata}
            className="btn-outline text-sm ml-auto"
          >
            ✏️ Edit Metadata
          </button>
        )}
      </div>

      {/* BibTeX Block */}
      {showBibtex && (
        <div className="relative">
          <pre className="bg-gray-900 text-green-300 rounded-lg p-4 text-xs overflow-x-auto whitespace-pre-wrap">
            {bibtex}
          </pre>
          <button
            onClick={() => copyToClipboard(bibtex, 'BibTeX')}
            className="absolute top-2 right-2 text-xs bg-gray-700 text-white px-2 py-1 rounded hover:bg-gray-600"
          >
            Copy
          </button>
        </div>
      )}

      {/* Metadata Summary */}
      {metadata && (
        <details className="group">
          <summary className="cursor-pointer text-sm text-gray-500 hover:text-primary select-none">
            📊 View extracted metadata
          </summary>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            {Object.entries(metadata)
              .filter(([k, v]) => v && k !== 'abstract' && k !== 'source_type')
              .map(([k, v]) => (
                <div key={k} className="bg-gray-50 rounded p-2">
                  <span className="font-semibold text-gray-600 capitalize">{k.replace(/_/g, ' ')}: </span>
                  <span className="text-gray-700">
                    {Array.isArray(v) ? v.join(', ') : String(v)}
                  </span>
                </div>
              ))}
          </div>
        </details>
      )}
    </div>
  )
}
