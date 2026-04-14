import { useState } from 'react'
import toast from 'react-hot-toast'
import { lookupDOI } from '../services/api.js'
import CitationCard from './CitationCard.jsx'

export default function DOILookup() {
  const [doi, setDoi] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleLookup = async (e) => {
    e.preventDefault()
    const trimmed = doi.trim()
    if (!trimmed) {
      toast.error('Please enter a DOI')
      return
    }
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const { data } = await lookupDOI(trimmed)
      setResult(data)
      toast.success('Citation found!')
    } catch (err) {
      setError(err.message)
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-lg font-semibold text-primary mb-2">DOI Lookup</h2>
        <p className="text-sm text-gray-500 mb-5">
          Enter a DOI to automatically retrieve metadata and generate an APA 7th Edition citation
          via the CrossRef API.
        </p>

        <form onSubmit={handleLookup} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              DOI (Digital Object Identifier)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={doi}
                onChange={(e) => setDoi(e.target.value)}
                className="input-field flex-1"
                placeholder="10.1038/nature12373 or https://doi.org/10.1038/nature12373"
                disabled={loading}
              />
              <button type="submit" disabled={loading || !doi.trim()} className="btn-primary whitespace-nowrap">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Looking up…
                  </span>
                ) : (
                  '🔍 Look Up'
                )}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <span>⚠️</span> {error}
            </p>
          )}
        </form>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
          <p className="text-xs text-blue-700 font-medium mb-1">💡 Examples</p>
          <div className="space-y-1">
            {[
              '10.1038/nature12373',
              '10.1016/j.cell.2021.01.018',
              '10.1126/science.abl4896',
            ].map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setDoi(example)}
                className="block text-xs text-blue-600 hover:text-blue-800 hover:underline font-mono"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </div>

      {result && (
        <CitationCard
          citation={result.citation}
          bibtex={result.bibtex}
          metadata={result.metadata}
        />
      )}
    </div>
  )
}
