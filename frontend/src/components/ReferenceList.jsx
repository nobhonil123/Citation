import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { parseReferences } from '../services/api'

export default function ReferenceList({ filename, initialRefs }) {
  const [refs, setRefs] = useState(initialRefs || [])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(!!initialRefs?.length)

  const loadRefs = async () => {
    if (!filename) return
    setLoading(true)
    try {
      const resp = await parseReferences(filename)
      setRefs(resp.data.references || [])
      setLoaded(true)
      toast.success(`Found ${resp.data.count} references!`)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to parse references.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = (text) => {
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success('Copied!'))
      .catch(() => toast.error('Copy failed.'))
  }

  const handleCopyAll = () => {
    const all = refs.map((r) => r.apa_citation).join('\n\n')
    handleCopy(all)
    toast.success('All references copied!')
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-[#1e3a5f] text-white px-6 py-3 flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <span>📚</span> References from Paper
        </h3>
        {refs.length > 0 && (
          <button
            onClick={handleCopyAll}
            className="text-xs text-blue-200 hover:text-white border border-blue-400 px-2 py-1 rounded"
          >
            Copy All
          </button>
        )}
      </div>
      <div className="p-6">
        {!loaded ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm mb-4">
              Click below to extract and format all references from this paper.
            </p>
            <button
              onClick={loadRefs}
              disabled={loading}
              className="bg-[#1e3a5f] text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-[#2a5298] disabled:opacity-60 transition-colors"
            >
              {loading ? '⏳ Parsing…' : '📖 Parse References'}
            </button>
          </div>
        ) : refs.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">
            No references section found in this paper.
          </p>
        ) : (
          <ul className="space-y-4">
            {refs.map((ref, idx) => (
              <li
                key={idx}
                className="border border-gray-100 rounded-lg p-4 hover:border-gray-200 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <span className="inline-block bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded mr-2">
                      [{idx + 1}]
                    </span>
                    <p className="apa-citation text-sm text-gray-800 mt-2 leading-relaxed">
                      {ref.apa_citation || ref.raw}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCopy(ref.apa_citation || ref.raw)}
                    className="shrink-0 text-gray-400 hover:text-gray-600 text-xs border border-gray-200 px-2 py-1 rounded"
                    title="Copy this citation"
                  >
                    📋
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
