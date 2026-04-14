import toast from 'react-hot-toast'

function renderAPA(citation) {
  const parts = citation.split(/(\*[^*]+\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i}>{part.slice(1, -1)}</em>
    }
    return <span key={i}>{part}</span>
  })
}

export default function ReferenceList({ references }) {
  const copyOne = async (citation) => {
    const plain = citation.replace(/\*/g, '')
    try {
      await navigator.clipboard.writeText(plain)
      toast.success('Reference copied!')
    } catch {
      toast.error('Failed to copy')
    }
  }

  const copyAll = async () => {
    const all = references
      .map((r, i) => `[${i + 1}] ${r.citation.replace(/\*/g, '')}`)
      .join('\n\n')
    try {
      await navigator.clipboard.writeText(all)
      toast.success(`${references.length} references copied!`)
    } catch {
      toast.error('Failed to copy references')
    }
  }

  if (!references || references.length === 0) return null

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-primary">
          References ({references.length})
        </h2>
        <button onClick={copyAll} className="btn-accent text-sm">
          📋 Copy All
        </button>
      </div>

      <ul className="space-y-3">
        {references.map((ref, idx) => (
          <li key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-3 group">
            <div className="flex items-start gap-2">
              <span className="text-xs text-gray-400 mt-1 font-mono min-w-[24px]">
                [{idx + 1}]
              </span>
              <div className="flex-1">
                <p className="text-sm text-gray-800 leading-relaxed apa-citation-text">
                  {renderAPA(ref.citation)}
                </p>
                {ref.raw && ref.raw !== ref.citation && (
                  <details className="mt-1">
                    <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
                      Show original text
                    </summary>
                    <p className="text-xs text-gray-500 mt-1 italic">{ref.raw}</p>
                  </details>
                )}
              </div>
              <button
                onClick={() => copyOne(ref.citation)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-primary hover:text-primary-light px-2 py-1 border border-primary rounded shrink-0"
              >
                Copy
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
