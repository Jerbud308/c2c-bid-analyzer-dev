import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CheckCircle, Loader2, AlertCircle, FileText, FileSearch, Brain } from 'lucide-react'
import clsx from 'clsx'
import { checkStatus } from '@/lib/api'
import type { StatusResponse } from '@/types'

export function ProcessingStatus() {
  const { opportunityId } = useParams<{ opportunityId: string }>()
  const navigate = useNavigate()

  const [status, setStatus] = useState<StatusResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!opportunityId) {
      navigate('/')
      return
    }

    let intervalId: number

    const fetchStatus = async () => {
      try {
        const data = await checkStatus(opportunityId)
        setStatus(data)
        setLoading(false)
        setError(null)

        // Auto-redirect when ready
        if (data.ready_for_review) {
          setTimeout(() => {
            navigate(`/analysis/${opportunityId}`)
          }, 2000)
        }

        // Stop polling if completed or failed
        if (data.status === 'completed' || data.status === 'failed') {
          if (intervalId) {
            clearInterval(intervalId)
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch status')
        setLoading(false)
      }
    }

    // Initial fetch
    fetchStatus()

    // Poll every 5 seconds
    intervalId = window.setInterval(fetchStatus, 5000)

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [opportunityId, navigate])

  const getStageStatus = (stageName: string): 'completed' | 'active' | 'pending' => {
    if (!status) return 'pending'

    const currentStatus = status.processing_status?.toLowerCase() || ''

    if (stageName === 'upload') {
      return 'completed'
    }

    if (stageName === 'ocr') {
      if (currentStatus.includes('ai') || currentStatus.includes('analysis')) {
        return 'completed'
      }
      if (currentStatus.includes('ocr') || currentStatus.includes('extract')) {
        return 'active'
      }
      return 'pending'
    }

    if (stageName === 'ai') {
      if (status.ready_for_review || status.status === 'completed') {
        return 'completed'
      }
      if (currentStatus.includes('ai') || currentStatus.includes('analysis')) {
        return 'active'
      }
      return 'pending'
    }

    return 'pending'
  }

  const estimateTimeRemaining = (): string => {
    if (!status || status.completion_percent === 0) {
      return 'Calculating...'
    }

    if (status.completion_percent >= 95) {
      return 'Almost done'
    }

    const remainingPercent = 100 - status.completion_percent
    const estimatedMinutes = Math.ceil((remainingPercent / 100) * 5) // Assume ~5 min total

    if (estimatedMinutes <= 1) {
      return 'Less than 1 minute'
    }

    return `Approximately ${estimatedMinutes} minute${estimatedMinutes > 1 ? 's' : ''} remaining`
  }

  // Loading skeleton
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="skeleton-title w-64 mx-auto mb-8"></div>
          <div className="space-y-6">
            <div className="skeleton h-20"></div>
            <div className="skeleton h-20"></div>
            <div className="skeleton h-20"></div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error || status?.status === 'failed') {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-danger-100 mb-4">
              <AlertCircle className="h-10 w-10 text-danger-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Processing Failed
            </h2>
            <p className="text-gray-600 mb-6">
              {status?.error_message || error || 'An error occurred during processing'}
            </p>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!status) {
    return null
  }

  const uploadStatus = getStageStatus('upload')
  const ocrStatus = getStageStatus('ocr')
  const aiStatus = getStageStatus('ai')

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Processing Document
          </h2>
          <p className="text-gray-600">{status.title}</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm font-medium text-gray-700">
              {status.completion_percent}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-primary h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${status.completion_percent}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            {estimateTimeRemaining()}
          </p>
        </div>

        {/* Stages */}
        <div className="space-y-4">
          {/* Stage 1: Upload */}
          <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex-shrink-0">
              {uploadStatus === 'completed' && (
                <CheckCircle className="w-6 h-6 text-success-600" />
              )}
              {uploadStatus === 'active' && (
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              )}
              {uploadStatus === 'pending' && (
                <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">Document Uploaded</h3>
              </div>
              <p className="text-sm text-gray-600">
                {uploadStatus === 'completed' && 'Document uploaded successfully'}
              </p>
            </div>
          </div>

          {/* Stage 2: OCR */}
          <div
            className={clsx(
              'flex items-start gap-4 p-4 rounded-lg',
              ocrStatus === 'active' ? 'bg-primary-50 border-2 border-primary-200' : 'bg-gray-50'
            )}
          >
            <div className="flex-shrink-0">
              {ocrStatus === 'completed' && (
                <CheckCircle className="w-6 h-6 text-success-600" />
              )}
              {ocrStatus === 'active' && (
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              )}
              {ocrStatus === 'pending' && (
                <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <FileSearch className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">OCR Text Extraction</h3>
              </div>
              <p className="text-sm text-gray-600">
                {ocrStatus === 'completed' && 'Text extracted successfully'}
                {ocrStatus === 'active' &&
                  (status.processing_substatus || `Extracting text from ${status.page_count || 0} pages...`)}
                {ocrStatus === 'pending' && 'Waiting to start...'}
              </p>
            </div>
          </div>

          {/* Stage 3: AI Analysis */}
          <div
            className={clsx(
              'flex items-start gap-4 p-4 rounded-lg',
              aiStatus === 'active' ? 'bg-primary-50 border-2 border-primary-200' : 'bg-gray-50'
            )}
          >
            <div className="flex-shrink-0">
              {aiStatus === 'completed' && (
                <CheckCircle className="w-6 h-6 text-success-600" />
              )}
              {aiStatus === 'active' && (
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              )}
              {aiStatus === 'pending' && (
                <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Brain className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">AI Analysis</h3>
              </div>
              <p className="text-sm text-gray-600">
                {aiStatus === 'completed' && 'Analysis complete'}
                {aiStatus === 'active' &&
                  (status.processing_substatus || 'Analyzing requirements with Claude AI...')}
                {aiStatus === 'pending' && 'Waiting to start...'}
              </p>
            </div>
          </div>
        </div>

        {/* Redirect Message */}
        {status.ready_for_review && (
          <div className="mt-8 p-4 bg-success-50 border border-success-200 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-success-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-success-900">Processing Complete!</p>
                <p className="text-sm text-success-700">
                  Redirecting to analysis results...
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
