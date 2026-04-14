import { useState, useRef } from 'react'
import toast from 'react-hot-toast'
import { uploadPDF } from '../services/api.js'

const MAX_SIZE_MB = 20
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

export default function FileUpload({ onSuccess }) {
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [fileName, setFileName] = useState(null)
  const inputRef = useRef(null)

  const validate = (file) => {
    if (!file) return 'No file selected.'
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return 'Only PDF files are accepted.'
    }
    if (file.size > MAX_SIZE_BYTES) {
      return `File is too large. Maximum size is ${MAX_SIZE_MB}MB.`
    }
    return null
  }

  const handleFile = async (file) => {
    const validationError = validate(file)
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    setFileName(file.name)
    setLoading(true)
    try {
      const { data } = await uploadPDF(file)
      toast.success('PDF processed successfully!')
      onSuccess(data)
    } catch (err) {
      setError(err.message)
      toast.error('Upload failed: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const onInputChange = (e) => {
    const file = e.target.files[0]
    if (file) handleFile(file)
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !loading && inputRef.current?.click()}
        className={`cursor-pointer border-2 border-dashed rounded-xl p-10 text-center transition-colors duration-200 ${
          dragging
            ? 'border-primary bg-blue-50'
            : 'border-gray-300 hover:border-primary hover:bg-gray-50'
        } ${loading ? 'cursor-not-allowed opacity-70' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={onInputChange}
          disabled={loading}
        />

        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-primary font-medium">Processing {fileName}…</p>
            <p className="text-xs text-gray-500">Extracting metadata and generating citation</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <span className="text-5xl">📄</span>
            <p className="text-lg font-semibold text-gray-700">
              Drag &amp; drop your PDF here
            </p>
            <p className="text-sm text-gray-500">or click to browse</p>
            <p className="text-xs text-gray-400">PDF only · Max {MAX_SIZE_MB}MB</p>
            {fileName && !loading && (
              <p className="text-xs text-accent font-medium mt-1">✓ Last uploaded: {fileName}</p>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
          <span>⚠️</span> {error}
        </p>
      )}
    </div>
  )
}
