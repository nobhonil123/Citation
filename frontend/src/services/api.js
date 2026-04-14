import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 60000,
})

export const uploadPDF = (file, onUploadProgress) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  })
}

export const generateCitation = (metadata) =>
  api.post('/generate-citation', metadata)

export const parseReferences = (filename) =>
  api.post(`/parse-references/${filename}`)

export const lookupDOI = (doi) =>
  api.post('/lookup-doi', { doi })

export const healthCheck = () =>
  api.get('/health')

export default api
