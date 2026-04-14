import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.detail || err.message || 'An error occurred'
    return Promise.reject(new Error(message))
  }
)

export const uploadPDF = (file) => {
  const form = new FormData()
  form.append('file', file)
  return api.post('/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const generateCitation = (metadata) =>
  api.post('/generate-citation', metadata)

export const parseReferences = (filename) =>
  api.post(`/parse-references/${encodeURIComponent(filename)}`)

export const lookupDOI = (doi) =>
  api.post('/lookup-doi', { doi })

export const healthCheck = () =>
  api.get('/health')
