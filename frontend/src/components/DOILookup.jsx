import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { lookupDOI } from '../services/api'
import CitationCard from './CitationCard'
import MetadataCard from './MetadataCard'

export default function DOILookup() {
  const [doi, setDoi] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmed = doi.trim()
    if (!trimmed) {
      toast.error('Please enter a DOI.')
      return
    }
    setLoading(true)
    try {
      const resp = await lookupDOI(trimmed)
      setResult(resp.data)
      toast.success('DOI resolved successfully!')
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to look up DOI. Please check and try again.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
          <h3 className="font-semibold text-gray-700 text-sm flex items-center gap-2">
            🔗 DOI Lookup
          </h3>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-500 mb-4">
            Enter a DOI to automatically fetch metadata from CrossRef and generate an APA citation.
          </p>
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              value={doi}
              onChange={(e) => setDoi(e.target.value)}
              placeholder="e.g. 10.1000/xyz123 or https://doi.org/10.1000/xyz123"
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-[#1e3a5f] text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-[#2a5298] disabled:opacity-60 transition-colors whitespace-nowrap"
            >
              {loading ? '⏳ Looking up…' : '🔍 Look Up & Generate'}
            </button>
          </form>

          {/* Quick examples */}
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs text-gray-400">Try:</span>
            {['10.1038/nature12373', '10.1126/science.1157996'].map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setDoi(example)}
                className="text-xs text-blue-600 hover:underline"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </div>

      {result && (
        <>
          <MetadataCard metadata={result.metadata} />
          <CitationCard
            citation={result.apa_citation}
            bibtex={result.bibtex}
            metadata={result.metadata}
          />
        </>
      )}
    </div>
  )
}
