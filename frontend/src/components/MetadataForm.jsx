import { useState } from 'react'
import toast from 'react-hot-toast'
import { generateCitation } from '../services/api.js'
import CitationCard from './CitationCard.jsx'

const SOURCE_TYPES = [
  { value: 'journal', label: 'Journal Article' },
  { value: 'book', label: 'Book' },
  { value: 'conference', label: 'Conference Paper' },
  { value: 'website', label: 'Website' },
]

export default function MetadataForm({ initialMetadata = {}, onUpdate }) {
  const [form, setForm] = useState({
    title: initialMetadata.title || '',
    authors: Array.isArray(initialMetadata.authors)
      ? initialMetadata.authors.join(', ')
      : initialMetadata.authors || '',
    year: initialMetadata.year || '',
    journal: initialMetadata.journal || '',
    volume: initialMetadata.volume || '',
    issue: initialMetadata.issue || '',
    pages: initialMetadata.pages || '',
    doi: initialMetadata.doi || '',
    publisher: initialMetadata.publisher || '',
    source_type: initialMetadata.source_type || 'journal',
    conference: initialMetadata.conference || '',
    location: initialMetadata.location || '',
    url: initialMetadata.url || '',
    accessed_date: initialMetadata.accessed_date || '',
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        ...form,
        authors: form.authors
          ? form.authors.split(',').map((a) => a.trim()).filter(Boolean)
          : [],
      }
      const { data } = await generateCitation(payload)
      setResult(data)
      if (onUpdate) onUpdate(data)
      toast.success('Citation regenerated!')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const sourceType = form.source_type

  return (
    <div className="card space-y-5">
      <h3 className="text-lg font-semibold text-primary">Edit Metadata</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Source Type</label>
            <select name="source_type" value={form.source_type} onChange={handleChange} className="input-field">
              {SOURCE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
            <input name="title" value={form.title} onChange={handleChange} className="input-field" placeholder="Article/Book title" />
          </div>

          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Authors (comma-separated, e.g. Smith, J. A., Jones, B.)
            </label>
            <input name="authors" value={form.authors} onChange={handleChange} className="input-field" placeholder="Smith, J. A., Jones, B. C." />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Year</label>
            <input name="year" value={form.year} onChange={handleChange} className="input-field" placeholder="2024" maxLength={4} />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">DOI</label>
            <input name="doi" value={form.doi} onChange={handleChange} className="input-field" placeholder="10.xxxx/xxxxx" />
          </div>

          {(sourceType === 'journal') && (
            <>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Journal</label>
                <input name="journal" value={form.journal} onChange={handleChange} className="input-field" placeholder="Nature, Science, etc." />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Volume</label>
                <input name="volume" value={form.volume} onChange={handleChange} className="input-field" placeholder="12" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Issue</label>
                <input name="issue" value={form.issue} onChange={handleChange} className="input-field" placeholder="3" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Pages</label>
                <input name="pages" value={form.pages} onChange={handleChange} className="input-field" placeholder="100–115" />
              </div>
            </>
          )}

          {sourceType === 'book' && (
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Publisher</label>
              <input name="publisher" value={form.publisher} onChange={handleChange} className="input-field" placeholder="Springer, Oxford University Press, etc." />
            </div>
          )}

          {sourceType === 'conference' && (
            <>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Conference Name</label>
                <input name="conference" value={form.conference} onChange={handleChange} className="input-field" placeholder="International Conference on…" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
                <input name="location" value={form.location} onChange={handleChange} className="input-field" placeholder="New York, NY, USA" />
              </div>
            </>
          )}

          {sourceType === 'website' && (
            <>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">URL</label>
                <input name="url" value={form.url} onChange={handleChange} className="input-field" placeholder="https://example.com/article" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Accessed Date</label>
                <input name="accessed_date" value={form.accessed_date} onChange={handleChange} className="input-field" placeholder="January 1, 2024" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Publisher / Site Name</label>
                <input name="publisher" value={form.publisher} onChange={handleChange} className="input-field" placeholder="Website Name" />
              </div>
            </>
          )}
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? '⏳ Regenerating…' : '🔄 Regenerate Citation'}
        </button>
      </form>

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
