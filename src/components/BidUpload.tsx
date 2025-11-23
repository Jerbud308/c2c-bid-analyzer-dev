import { useState, useRef, type ChangeEvent, type DragEvent, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import clsx from 'clsx'
import { uploadBid } from '@/lib/api'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export function BidUpload() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ opportunityId: string; message: string } | null>(null)

  // Form fields
  const [solicitationNumber, setSolicitationNumber] = useState('')
  const [title, setTitle] = useState('')
  const [agency, setAgency] = useState('')

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    setError(null)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    setError(null)
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
  }

  const handleFileSelect = (selectedFile: File) => {
    // Validate file type
    if (selectedFile.type !== 'application/pdf') {
      setError('Please select a PDF file')
      return
    }

    // Validate file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError('File size must be less than 50MB')
      return
    }

    setFile(selectedFile)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!file) {
      setError('Please select a file')
      return
    }

    if (!title.trim()) {
      setError('Title is required')
      return
    }

    setLoading(true)

    try {
      const response = await uploadBid(file, {
        solicitation_number: solicitationNumber.trim() || undefined,
        title: title.trim(),
        agency: agency.trim() || undefined,
      })

      setSuccess(response)
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFile(null)
    setSolicitationNumber('')
    setTitle('')
    setAgency('')
    setError(null)
    setSuccess(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Success state
  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-success-100 mb-4">
              <CheckCircle className="h-10 w-10 text-success-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Upload Successful!
            </h2>
            <p className="text-gray-600 mb-6">{success.message}</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => navigate(`/processing/${success.opportunityId}`)}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
              >
                View Status
              </button>
              <button
                onClick={handleReset}
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
              >
                Upload Another
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Upload form
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Upload Bid Document
          </h2>
          <p className="text-gray-600">
            Upload a PDF bid document to analyze with AI
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Drop Zone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bid Document (PDF) *
            </label>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={clsx(
                'drop-zone',
                'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer',
                dragActive
                  ? 'drag-active border-primary bg-primary-100'
                  : file
                  ? 'border-success bg-success-50'
                  : 'border-gray-300 bg-gray-50'
              )}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileInput}
                className="hidden"
                disabled={loading}
              />

              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText className="w-8 h-8 text-success-600" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-medium text-primary">
                      Click to upload
                    </span>{' '}
                    or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PDF up to 50MB</p>
                </div>
              )}
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label
                htmlFor="solicitation_number"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Solicitation Number
              </label>
              <input
                type="text"
                id="solicitation_number"
                value={solicitationNumber}
                onChange={(e) => setSolicitationNumber(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent transition-colors font-mono text-sm"
                placeholder="e.g., RFP-2024-001"
                disabled={loading}
              />
            </div>

            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Title *
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                placeholder="e.g., School Cafeteria Renovation"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label
                htmlFor="agency"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Agency
              </label>
              <input
                type="text"
                id="agency"
                value={agency}
                onChange={(e) => setAgency(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                placeholder="e.g., City of Phoenix"
                disabled={loading}
              />
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="rounded-md bg-danger-50 border border-danger-200 p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-danger-600 mr-3" />
                <div className="text-sm text-danger-800">{error}</div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!file || !title.trim() || loading}
            className={clsx(
              'w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white transition-colors',
              !file || !title.trim() || loading
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-primary hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary'
            )}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-5 w-5 mr-2" />
                Upload and Analyze
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
