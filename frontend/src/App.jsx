import { useState } from 'react'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import FileUpload from './components/FileUpload.jsx'
import CitationCard from './components/CitationCard.jsx'
import MetadataForm from './components/MetadataForm.jsx'
import ReferenceList from './components/ReferenceList.jsx'
import ManualEntry from './components/ManualEntry.jsx'
import DOILookup from './components/DOILookup.jsx'
import { parseReferences } from './services/api.js'
import toast from 'react-hot-toast'

const TABS = [
  { id: 'upload', label: '📄 Upload PDF' },
  { id: 'manual', label: '✏️ Manual Entry' },
  { id: 'doi', label: '🔍 DOI Lookup' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('upload')
  const [uploadResult, setUploadResult] = useState(null)
  const [references, setReferences] = useState([])
  const [loadingRefs, setLoadingRefs] = useState(false)
  const [showMetadataEdit, setShowMetadataEdit] = useState(false)

  const handleUploadSuccess = (result) => {
    setUploadResult(result)
    setReferences([])
    setShowMetadataEdit(false)
  }

  const handleMetadataUpdate = (newCitationData) => {
    setUploadResult((prev) => ({ ...prev, ...newCitationData }))
    setShowMetadataEdit(false)
  }

  const handleParseReferences = async () => {
    if (!uploadResult?.filename) return
    setLoadingRefs(true)
    try {
      const { data } = await parseReferences(uploadResult.filename)
      setReferences(data.references || [])
      if (data.references?.length === 0) toast('No references found in this PDF.')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoadingRefs(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        {/* Tab Navigation */}
        <div className="flex gap-6 border-b border-gray-200 mb-8">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-medium ${
                activeTab === tab.id ? 'tab-active' : 'tab-inactive'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'upload' && (
          <div className="space-y-6">
            <FileUpload onSuccess={handleUploadSuccess} />

            {uploadResult && (
              <>
                <CitationCard
                  citation={uploadResult.citation}
                  bibtex={uploadResult.bibtex}
                  metadata={uploadResult.metadata}
                  onEditMetadata={() => setShowMetadataEdit((v) => !v)}
                />

                {showMetadataEdit && (
                  <MetadataForm
                    initialMetadata={uploadResult.metadata}
                    onUpdate={handleMetadataUpdate}
                  />
                )}

                <div className="flex items-center gap-4">
                  <button
                    onClick={handleParseReferences}
                    disabled={loadingRefs}
                    className="btn-outline text-sm flex items-center gap-2"
                  >
                    {loadingRefs ? (
                      <>
                        <span className="animate-spin">⏳</span> Parsing…
                      </>
                    ) : (
                      '📚 Extract References from PDF'
                    )}
                  </button>
                </div>

                {references.length > 0 && (
                  <ReferenceList references={references} />
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'manual' && <ManualEntry />}
        {activeTab === 'doi' && <DOILookup />}
      </main>
      <Footer />
    </div>
  )
}
