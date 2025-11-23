# C2C Bid Analyzer - API Client Documentation

Comprehensive guide for using the framework-agnostic API client for the C2C Bid Analyzer application.

## Table of Contents

- [Quick Start](#quick-start)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Reference](#api-reference)
  - [Upload Bid](#upload-bid)
  - [Check Status](#check-status)
  - [Get Analysis](#get-analysis)
- [Error Handling](#error-handling)
- [Usage Patterns](#usage-patterns)
- [TypeScript Types](#typescript-types)
- [Utility Functions](#utility-functions)

## Quick Start

```typescript
import { api } from '@/lib/api'

// 1. Upload a bid package
const formData = new FormData()
formData.append('file', pdfFile)
formData.append('title', 'Roof Replacement Project')
const result = await api.uploadBid(formData)

// 2. Poll for completion
const checkStatus = async () => {
  const status = await api.checkStatus(result.opportunity_id)
  if (status.ready_for_review) {
    // 3. Get analysis when ready
    const analysis = await api.getAnalysis(result.opportunity_id)
    console.log(`Fit Score: ${analysis.analysis.fit_score}`)
  }
}
```

## Installation

### Prerequisites

1. Install dependencies:
```bash
npm install @supabase/supabase-js
# or
yarn add @supabase/supabase-js
# or
pnpm add @supabase/supabase-js
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Add your Supabase credentials to `.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Framework Compatibility

The API client is framework-agnostic and works with:
- ✅ Vite + React
- ✅ Next.js (App Router or Pages Router)
- ✅ Remix
- ✅ Astro
- ✅ SvelteKit
- ✅ Vue.js
- ✅ Vanilla JavaScript/TypeScript

**Note for Next.js users:** Change `import.meta.env` to `process.env` in `src/lib/supabase.ts` and `src/lib/api.ts`, or use a compatibility layer.

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Your Supabase anonymous key (safe for client-side) |

### Constants

Configure application behavior in `src/lib/constants.ts`:

```typescript
export const MAX_FILE_SIZE = 50 * 1024 * 1024  // 50MB
export const POLLING_INTERVAL = 5000            // 5 seconds
export const REQUEST_TIMEOUT = 30000            // 30 seconds
export const MAX_RETRIES = 3                    // Retry attempts
```

## API Reference

### Upload Bid

Uploads a bid package PDF for processing.

```typescript
api.uploadBid(formData: FormData): Promise<UploadResponse>
```

#### Parameters

**formData** - FormData object with the following fields:
- `file` (required): PDF file to upload
- `title` (optional): Title for the opportunity
- `agency` (optional): Government agency name
- `solicitation_number` (optional): Solicitation number
- `deadline_date` (optional): Submission deadline (ISO 8601)

#### Returns

```typescript
{
  success: boolean
  opportunity_id: string        // Use this for status checking
  document_id: string
  status: string
  message: string
}
```

#### Example

```typescript
import { api } from '@/lib/api'

async function handleUpload(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('title', 'HVAC System Replacement')
  formData.append('agency', 'GSA')
  formData.append('solicitation_number', 'W912BU-24-R-0001')
  formData.append('deadline_date', '2025-12-31T23:59:59Z')

  try {
    const result = await api.uploadBid(formData)
    console.log('Upload successful!')
    console.log('Opportunity ID:', result.opportunity_id)
    return result
  } catch (error) {
    if (error instanceof ApiError) {
      console.error('Upload failed:', error.message)
    }
  }
}
```

#### Validation

Before uploading, validate the file:

```typescript
import { isValidPdfFile, isValidFileSize } from '@/lib/utils'
import { MAX_FILE_SIZE } from '@/lib/constants'

if (!isValidPdfFile(file)) {
  throw new Error('Only PDF files are allowed')
}

if (!isValidFileSize(file, MAX_FILE_SIZE)) {
  throw new Error('File size must be under 50MB')
}
```

### Check Status

Checks the processing status of an uploaded bid.

```typescript
api.checkStatus(opportunityId: string): Promise<StatusResponse>
```

#### Parameters

- `opportunityId` - The opportunity ID from the upload response

#### Returns

```typescript
{
  opportunity_id: string
  processing_status: ProcessingStatus  // 'pending' | 'ocr_processing' | etc.
  completion_percent: number           // 0-100
  ocr_completed: boolean
  analysis_completed: boolean
  page_count: number | null
  error_message: string | null
  ready_for_review: boolean           // true when analysis is complete
}
```

#### Example

```typescript
async function pollStatus(opportunityId: string) {
  const status = await api.checkStatus(opportunityId)

  console.log(`Status: ${status.processing_status}`)
  console.log(`Progress: ${status.completion_percent}%`)

  if (status.error_message) {
    console.error('Processing error:', status.error_message)
  }

  return status.ready_for_review
}
```

#### Polling Pattern

```typescript
import { POLLING_INTERVAL } from '@/lib/constants'

async function waitForCompletion(opportunityId: string) {
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      try {
        const status = await api.checkStatus(opportunityId)

        if (status.processing_status === 'failed') {
          clearInterval(interval)
          reject(new Error(status.error_message || 'Processing failed'))
        }

        if (status.ready_for_review) {
          clearInterval(interval)
          resolve(status)
        }
      } catch (error) {
        clearInterval(interval)
        reject(error)
      }
    }, POLLING_INTERVAL)
  })
}
```

### Get Analysis

Retrieves the complete AI analysis for a processed bid.

```typescript
api.getAnalysis(opportunityId: string): Promise<AnalysisResponse>
```

#### Parameters

- `opportunityId` - The opportunity ID to retrieve

#### Returns

```typescript
{
  opportunity: Opportunity           // Full opportunity record
  analysis: Analysis                // AI analysis (without raw OCR)
  processing_metadata: {
    file_name: string
    page_count: number
    processing_time_seconds: number
    analyzed_at: string
  }
}
```

#### Example

```typescript
async function displayAnalysis(opportunityId: string) {
  try {
    const result = await api.getAnalysis(opportunityId)

    console.log('Opportunity:', result.opportunity.title)
    console.log('Fit Score:', result.analysis.fit_score)
    console.log('Confidence:', result.analysis.confidence_level)
    console.log('Summary:', result.analysis.scope_summary)

    // Technical requirements
    result.analysis.technical_requirements.forEach(req => {
      console.log(`- ${req.category}: ${req.requirement}`)
    })

    // Red flags
    if (result.analysis.red_flags.length > 0) {
      console.log('⚠️ Red Flags:')
      result.analysis.red_flags.forEach(flag => console.log(`  - ${flag}`))
    }

    return result
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) {
      console.error('Analysis not ready yet')
    }
  }
}
```

## Error Handling

All API methods throw typed `ApiError` instances on failure.

### ApiError Class

```typescript
class ApiError extends Error {
  message: string       // Human-readable error message
  statusCode?: number   // HTTP status code (if applicable)
  details?: any        // Additional error details
}
```

### Error Handling Patterns

#### Basic Try-Catch

```typescript
import { ApiError } from '@/lib/types'

try {
  const result = await api.uploadBid(formData)
} catch (error) {
  if (error instanceof ApiError) {
    console.error('API Error:', error.message)
    console.error('Status Code:', error.statusCode)
    console.error('Details:', error.details)
  }
}
```

#### Specific Error Handling

```typescript
try {
  const analysis = await api.getAnalysis(opportunityId)
} catch (error) {
  if (error instanceof ApiError) {
    switch (error.statusCode) {
      case 404:
        // Analysis not ready or not found
        console.log('Analysis not ready yet, check back later')
        break
      case 408:
        // Timeout
        console.error('Request timed out, please try again')
        break
      case 500:
        // Server error
        console.error('Server error, please contact support')
        break
      default:
        console.error('Unexpected error:', error.message)
    }
  }
}
```

#### React Error Boundary

```typescript
import { Component, ErrorInfo, ReactNode } from 'react'
import { ApiError } from '@/lib/types'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: ApiError
}

class ApiErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    if (error instanceof ApiError) {
      return { hasError: true, error }
    }
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('API Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div className="error">
          <h2>API Error</h2>
          <p>{this.state.error.message}</p>
          {this.state.error.statusCode && (
            <p>Status Code: {this.state.error.statusCode}</p>
          )}
        </div>
      )
    }

    return this.props.children
  }
}
```

## Usage Patterns

### Complete Upload Flow with React

```typescript
import { useState } from 'react'
import { api } from '@/lib/api'
import { ApiError } from '@/lib/types'
import { POLLING_INTERVAL } from '@/lib/constants'

function UploadPage() {
  const [uploading, setUploading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [opportunityId, setOpportunityId] = useState<string | null>(null)

  const handleUpload = async (file: File) => {
    setUploading(true)

    try {
      // Upload
      const formData = new FormData()
      formData.append('file', file)
      const result = await api.uploadBid(formData)

      setOpportunityId(result.opportunity_id)
      setUploading(false)
      setProcessing(true)

      // Poll for completion
      const interval = setInterval(async () => {
        const status = await api.checkStatus(result.opportunity_id)
        setProgress(status.completion_percent)

        if (status.ready_for_review) {
          clearInterval(interval)
          setProcessing(false)

          // Get analysis
          const analysis = await api.getAnalysis(result.opportunity_id)
          console.log('Analysis complete:', analysis)
        }
      }, POLLING_INTERVAL)
    } catch (error) {
      setUploading(false)
      setProcessing(false)

      if (error instanceof ApiError) {
        alert(`Error: ${error.message}`)
      }
    }
  }

  return (
    <div>
      {uploading && <p>Uploading...</p>}
      {processing && <p>Processing: {progress}%</p>}
      <input
        type="file"
        accept=".pdf"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleUpload(file)
        }}
      />
    </div>
  )
}
```

### Custom Hook for Upload and Processing

```typescript
import { useState, useCallback } from 'react'
import { api } from '@/lib/api'
import type { AnalysisResponse } from '@/lib/types'
import { POLLING_INTERVAL } from '@/lib/constants'

export function useUploadBid() {
  const [uploading, setUploading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null)

  const upload = useCallback(async (file: File, metadata?: {
    title?: string
    agency?: string
    solicitation_number?: string
  }) => {
    setUploading(true)
    setError(null)

    try {
      // Upload
      const formData = new FormData()
      formData.append('file', file)
      if (metadata?.title) formData.append('title', metadata.title)
      if (metadata?.agency) formData.append('agency', metadata.agency)
      if (metadata?.solicitation_number) {
        formData.append('solicitation_number', metadata.solicitation_number)
      }

      const result = await api.uploadBid(formData)
      setUploading(false)
      setProcessing(true)

      // Poll for completion
      const intervalId = setInterval(async () => {
        try {
          const status = await api.checkStatus(result.opportunity_id)
          setProgress(status.completion_percent)

          if (status.processing_status === 'failed') {
            clearInterval(intervalId)
            setProcessing(false)
            setError(status.error_message || 'Processing failed')
            return
          }

          if (status.ready_for_review) {
            clearInterval(intervalId)

            // Get analysis
            const analysisResult = await api.getAnalysis(result.opportunity_id)
            setAnalysis(analysisResult)
            setProcessing(false)
          }
        } catch (err) {
          clearInterval(intervalId)
          setProcessing(false)
          setError(err instanceof Error ? err.message : 'Unknown error')
        }
      }, POLLING_INTERVAL)
    } catch (err) {
      setUploading(false)
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }, [])

  const reset = useCallback(() => {
    setUploading(false)
    setProcessing(false)
    setProgress(0)
    setError(null)
    setAnalysis(null)
  }, [])

  return {
    upload,
    reset,
    uploading,
    processing,
    progress,
    error,
    analysis,
  }
}
```

## TypeScript Types

### Core Types

All types are exported from `@/lib/types`:

```typescript
import type {
  // Database entities
  Opportunity,
  BidDocument,
  Analysis,

  // API responses
  UploadResponse,
  StatusResponse,
  AnalysisResponse,

  // Enums
  OpportunityStatus,
  ProcessingStatus,
  ConfidenceLevel,

  // Error
  ApiError,
} from '@/lib/types'
```

### Type Guards

```typescript
import { ApiError } from '@/lib/types'

function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

// Usage
try {
  await api.uploadBid(formData)
} catch (error) {
  if (isApiError(error)) {
    console.log('API Error:', error.statusCode)
  }
}
```

## Utility Functions

### File Utilities

```typescript
import {
  formatFileSize,
  isValidPdfFile,
  isValidFileSize,
} from '@/lib/utils'
import { MAX_FILE_SIZE } from '@/lib/constants'

// Format file size
formatFileSize(1048576) // "1.0 MB"
formatFileSize(52428800) // "50.0 MB"

// Validate PDF
isValidPdfFile(file) // true if PDF

// Validate size
isValidFileSize(file, MAX_FILE_SIZE) // true if under limit
```

### Date Utilities

```typescript
import {
  formatDate,
  formatDateTime,
  getDaysRemaining,
  formatDaysRemaining,
} from '@/lib/utils'

formatDate('2025-12-31T23:59:59Z') // "Dec 31, 2025"
formatDateTime('2025-11-23T15:30:00Z') // "Nov 23, 2025 3:30 PM"
getDaysRemaining('2025-12-31') // 38 (days from now)
formatDaysRemaining(5) // "5 days left"
formatDaysRemaining(-2) // "2 days overdue"
```

### Status Utilities

```typescript
import {
  getStatusIcon,
  getStatusLabel,
  getFitScoreColor,
  getConfidenceBadgeColor,
} from '@/lib/utils'

getStatusIcon('completed') // "✅"
getStatusLabel('ai_processing') // "Analyzing document..."
getFitScoreColor(85) // "green"
getConfidenceBadgeColor('high') // "bg-green-100"
```

### Currency and Formatting

```typescript
import {
  formatCurrency,
  formatPercentage,
  formatDuration,
} from '@/lib/utils'

formatCurrency(50000) // "$50,000"
formatPercentage(75) // "75%"
formatDuration(150) // "2m 30s"
```

### Class Name Utility

```typescript
import { cn } from '@/lib/utils'

// Conditional class names
cn('base', isActive && 'active', 'end')
// → "base active end" (if isActive is true)

cn('base', false && 'hidden', 'end')
// → "base end"
```

## Advanced Usage

### Retry Logic

The API client automatically retries failed requests up to 3 times with exponential backoff. You can customize this in `src/lib/constants.ts`:

```typescript
export const MAX_RETRIES = 3
export const RETRY_DELAY = 1000 // Initial delay in ms
```

Retry delays: 1s → 2s → 4s

### Timeout Configuration

Requests timeout after 30 seconds by default:

```typescript
export const REQUEST_TIMEOUT = 30000 // 30 seconds
```

### Development Logging

The API client automatically logs requests and responses in development mode (when `import.meta.env.DEV` is true). Check your browser console for detailed logs.

## Troubleshooting

### "Missing environment variable" Error

Ensure your `.env` file contains:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Restart your dev server after adding environment variables.

### TypeScript Errors

If you see import errors, ensure you have a `tsconfig.json` with path aliases:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### CORS Errors

CORS errors indicate your Supabase URL or authentication is incorrect. Verify:
1. `VITE_SUPABASE_URL` matches your project URL exactly
2. `VITE_SUPABASE_ANON_KEY` is the anonymous key, not service role key
3. Your Supabase project is active

## License

This API client is part of the C2C Bid Analyzer project.
