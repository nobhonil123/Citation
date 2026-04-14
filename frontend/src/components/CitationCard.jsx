import React, { useState } from 'react'
import toast from 'react-hot-toast'

export default function CitationCard({ citation, bibtex, metadata, onEditMetadata }) {
  const [showBibtex, setShowBibtex] = useState(false)

  const handleCopy = (text, label = 'Citation') => {
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success(`${label} copied to clipboard!`))
      .catch(() => toast.error('Failed to copy. Please copy manually.'))
  }

  const handleDownloadBibtex = () => {
    const blob = new Blob([bibtex], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const title = metadata?.title || 'citation'
    a.download = `${title.slice(0, 30).replace(/[^a-z0-9]/gi, '_')}.bib`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-[#1e3a5f] text-white px-6 py-3 flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <span>📝</span> APA 7th Edition Citation
        </h3>
        <span className="text-xs text-blue-200 bg-blue-900/40 px-2 py-0.5 rounded">
          {metadata?.source_type?.replace('_', ' ') || 'Journal Article'}
        </span>
      </div>

      <div className="p-6">
        {/* Citation Display */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
          <p className="apa-citation text-gray-800 leading-relaxed">{citation}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => handleCopy(citation)}
            className="flex items-center gap-1.5 bg-[#1e3a5f] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#2a5298] transition-colors"
          >
            📋 Copy Citation
          </button>
          <button
            onClick={handleDownloadBibtex}
            className="flex items-center gap-1.5 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            📥 Download BibTeX
          </button>
          <button
            onClick={() => setShowBibtex((v) => !v)}
            className="flex items-center gap-1.5 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            {showBibtex ? '🙈 Hide BibTeX' : '👁️ Show BibTeX'}
          </button>
          {onEditMetadata && (
            <button
              onClick={onEditMetadata}
              className="flex items-center gap-1.5 bg-amber-50 border border-amber-300 text-amber-700 px-4 py-2 rounded-lg text-sm hover:bg-amber-100 transition-colors"
            >
              ✏️ Edit Metadata
            </button>
          )}
        </div>

        {/* BibTeX Panel */}
        {showBibtex && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-gray-700">BibTeX Format</h4>
              <button
                onClick={() => handleCopy(bibtex, 'BibTeX')}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Copy BibTeX
              </button>
            </div>
            <pre className="bg-gray-900 text-green-400 text-xs rounded-lg p-4 overflow-x-auto whitespace-pre-wrap font-mono">
              {bibtex}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
