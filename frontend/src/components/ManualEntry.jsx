import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { generateCitation } from '../services/api'
import CitationCard from './CitationCard'

const SOURCE_TYPES = [
  { value: 'journal_article', label: 'Journal Article' },
  { value: 'book', label: 'Book' },
  { value: 'book_chapter', label: 'Book Chapter' },
  { value: 'conference_paper', label: 'Conference Paper' },
  { value: 'web', label: 'Website' },
]

const FIELDS_BY_TYPE = {
  journal_article: ['title', 'authors', 'year', 'journal', 'volume', 'issue', 'pages', 'doi'],
  book: ['title', 'authors', 'year', 'publisher', 'doi'],
  book_chapter: ['title', 'authors', 'year', 'journal', 'pages', 'publisher', 'doi'],
  conference_paper: ['title', 'authors', 'year', 'journal', 'doi'],
  web: ['title', 'authors', 'year', 'publisher', 'doi'],
}

const FIELD_LABELS = {
  title: 'Title',
  authors: 'Authors (one per line)',
  year: 'Year',
  journal: 'Journal / Conference / Book Title',
  volume: 'Volume',
  issue: 'Issue',
  pages: 'Pages',
  doi: 'DOI',
  publisher: 'Publisher',
}

export default function ManualEntry() {
  const [sourceType, setSourceType] = useState('journal_article')
  const [form, setForm] = useState({})
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const activeFields = FIELDS_BY_TYPE[sourceType] || []

  const handleChange = (key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const authors = (form.authors || '')
      .split('\n')
      .map((a) => a.trim())
      .filter(Boolean)

    const payload = {
      ...form,
      authors,
      source_type: sourceType,
    }

    setLoading(true)
    try {
      const resp = await generateCitation(payload)
      setResult(resp.data)
      toast.success('Citation generated!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to generate citation.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
          <h3 className="font-semibold text-gray-700 text-sm flex items-center gap-2">
            ✏️ Manual Citation Entry
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Source type selector */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Source Type</label>
            <div className="flex flex-wrap gap-2">
              {SOURCE_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setSourceType(t.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    sourceType === t.value
                      ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {activeFields.map((key) => {
              const isTextarea = key === 'authors'
              const isFullWidth = key === 'title' || key === 'authors'
              return (
                <div key={key} className={isFullWidth ? 'sm:col-span-2' : ''}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {FIELD_LABELS[key]}
                  </label>
                  {isTextarea ? (
                    <textarea
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      value={form[key] || ''}
                      onChange={(e) => handleChange(key, e.target.value)}
                      placeholder={`Enter ${FIELD_LABELS[key].toLowerCase()}`}
                    />
                  ) : (
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={form[key] || ''}
                      onChange={(e) => handleChange(key, e.target.value)}
                      placeholder={`Enter ${FIELD_LABELS[key].toLowerCase()}`}
                    />
                  )}
                </div>
              )
            })}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-[#1e3a5f] text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-[#2a5298] disabled:opacity-60 transition-colors"
          >
            {loading ? '⏳ Generating…' : '🎓 Generate Citation'}
          </button>
        </form>
      </div>

      {result && (
        <CitationCard
          citation={result.apa_citation}
          bibtex={result.bibtex}
          metadata={result.metadata}
        />
      )}
    </div>
  )
}
