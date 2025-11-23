# Supabase Edge Functions Documentation

## Overview

This document describes the 5 Supabase Edge Functions that power the C2C Bid Analyzer platform. These functions handle the complete workflow from PDF upload to AI-powered analysis of government bid packages.

## Workflow

1. **User uploads PDF** → `upload-bid-package`
2. **OCR processing triggered** → `ocr-processor` (Google Cloud Vision API)
3. **AI analysis triggered** → `ai-analyzer` (Anthropic Claude API)
4. **User polls status** → `check-status`
5. **Retrieve results** → `get-analysis`

---

## 1. upload-bid-package

**Purpose**: Accept PDF uploads, create database records, initiate OCR processing

**Endpoint**: `POST /functions/v1/upload-bid-package`

**Content-Type**: `multipart/form-data`

### Request Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| file | File | Yes | PDF file (max 50MB) |
| solicitation_number | String | Yes | Unique solicitation ID |
| title | String | Yes | Bid title |
| agency | String | Yes | Government agency name |
| due_date | String | No | Due date (ISO 8601) |
| location | String | No | Project location |
| naics_codes | JSON Array | No | NAICS codes as JSON string |
| set_aside | String | No | Set-aside type (e.g., "SDVOSB") |
| url | String | No | Source URL |

### Response

**Success (200)**:
```json
{
  "success": true,
  "opportunity_id": "uuid",
  "document_id": "uuid",
  "status": "processing",
  "message": "Bid package uploaded successfully. OCR processing initiated."
}
```

**Error (400/500)**:
```json
{
  "success": false,
  "error": "Error message",
  "details": "Stack trace (dev only)"
}
```

### Example Request

```bash
curl -X POST https://your-project.supabase.co/functions/v1/upload-bid-package \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -F "file=@/path/to/bid.pdf" \
  -F "solicitation_number=FA1234-25-R-0001" \
  -F "title=Roofing Repair Services" \
  -F "agency=Department of Defense" \
  -F "due_date=2025-12-01T17:00:00Z" \
  -F "location=Florida" \
  -F 'naics_codes=["238160"]' \
  -F "set_aside=SDVOSB"
```

### Validation Rules

- File must be PDF format
- File size ≤ 50MB
- Required fields: file, solicitation_number, title, agency

### Side Effects

- Creates/updates record in `opportunities` table
- Uploads PDF to `bid-documents` storage bucket
- Creates record in `bid_documents` table
- Triggers `ocr-processor` function asynchronously

---

## 2. ocr-processor

**Purpose**: Extract text from PDF using Google Cloud Vision API

**Endpoint**: `POST /functions/v1/ocr-processor`

**Content-Type**: `application/json`

**Note**: This function is typically called automatically by `upload-bid-package`. Manual invocation is supported for reprocessing.

### Request Body

```json
{
  "documentId": "uuid",
  "opportunityId": "uuid",
  "filePath": "storage-path/to/file.pdf"
}
```

### Response

**Success (200)**:
```json
{
  "success": true,
  "text_length": 45678,
  "page_count": 23,
  "processing_time_seconds": 12.5
}
```

### Example Request

```bash
curl -X POST https://your-project.supabase.co/functions/v1/ocr-processor \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "documentId": "550e8400-e29b-41d4-a716-446655440000",
    "opportunityId": "660e8400-e29b-41d4-a716-446655440001",
    "filePath": "660e8400-e29b-41d4-a716-446655440001/1699999999_bid.pdf"
  }'
```

### Processing Steps

1. Updates `bid_documents.processing_status` to `ocr_processing`
2. Downloads PDF from Supabase Storage
3. Converts PDF to base64
4. Authenticates with Google Cloud Vision using JWT
5. Calls Vision API with `DOCUMENT_TEXT_DETECTION`
6. Stores extracted text in `bid_analysis.raw_ocr_text`
7. Updates `bid_documents` with `ocr_completed` status
8. Triggers `ai-analyzer` function

### Error Handling

- On failure, sets `bid_documents.processing_status` to `failed`
- Stores error message in `bid_documents.error_message`

---

## 3. ai-analyzer

**Purpose**: Analyze extracted text using Anthropic Claude API, calculate fit score

**Endpoint**: `POST /functions/v1/ai-analyzer`

**Content-Type**: `application/json`

**Note**: Automatically triggered by `ocr-processor`. Manual invocation supported for reanalysis.

### Request Body

```json
{
  "documentId": "uuid",
  "opportunityId": "uuid"
}
```

### Response

**Success (200)**:
```json
{
  "success": true,
  "fit_score": 85,
  "confidence": "high",
  "processing_time": 8.3
}
```

### Example Request

```bash
curl -X POST https://your-project.supabase.co/functions/v1/ai-analyzer \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "documentId": "550e8400-e29b-41d4-a716-446655440000",
    "opportunityId": "660e8400-e29b-41d4-a716-446655440001"
  }'
```

### Analysis Output

The AI extracts and structures:

- **scope_summary**: 2-3 paragraph project overview
- **technical_requirements**: Materials, installation, standards
- **submission_requirements**: What to submit, formats, deadlines
- **qualifications_required**: Licenses, certifications (with C2C match status)
- **timeline_schedule**: Start date, duration, milestones
- **insurance_bonding**: Liability, workers comp, bonds
- **pricing_structure**: Lump sum/unit price/cost plus
- **prevailing_wage**: Boolean (Davis-Bacon Act)
- **site_conditions**: Location and access details
- **questions_flagged**: Items needing clarification

### Fit Score Calculation

**Total: 100 points**

| Factor | Points | Logic |
|--------|--------|-------|
| Qualifications match | 40 | % of requirements with `c2c_status='met'` |
| No prevailing wage | 10 | Bonus if `prevailing_wage=false` |
| Service keywords | 20 | Match against C2C services (roofing, remediation, etc.) |
| Florida location | 15 | Location contains "Florida" or "FL" |
| Bonding < $2M | 15 | Favorable bonding; red flag if >$2M |

### Confidence Levels

- **High**: Score ≥ 70 AND no red flags
- **Medium**: Score ≥ 50
- **Low**: Score < 50

### Red Flags

- Qualifications with `c2c_status='not_met'`
- Bonding requirements > $2M
- Prevailing wage requirements

---

## 4. check-status

**Purpose**: Poll processing status for an opportunity

**Endpoint**: `GET /functions/v1/check-status?opportunity_id={uuid}`

**Content-Type**: N/A (GET request)

### Query Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| opportunity_id | Yes | Opportunity UUID |

### Response

**Success (200)**:
```json
{
  "opportunity_id": "uuid",
  "processing_status": "ai_processing",
  "completion_percent": 50,
  "ocr_completed": true,
  "analysis_completed": false,
  "page_count": 23,
  "error_message": null,
  "ready_for_review": false
}
```

**Not Found (404)**:
```json
{
  "success": false,
  "error": "No document found for this opportunity"
}
```

### Example Request

```bash
curl -X GET "https://your-project.supabase.co/functions/v1/check-status?opportunity_id=660e8400-e29b-41d4-a716-446655440001" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### Processing Status Values

| Status | Completion % | Description |
|--------|--------------|-------------|
| pending | 0% | Awaiting OCR processing |
| ocr_processing | 25% | Extracting text from PDF |
| ocr_completed | 50% | OCR done, awaiting AI analysis |
| ai_processing | 50% | AI analyzing extracted text |
| completed | 100% | Analysis complete, ready for review |
| failed | 0% | Error occurred (check error_message) |

### Polling Recommendations

- Poll every 5-10 seconds during processing
- Stop polling when `ready_for_review: true`
- Display `completion_percent` in UI progress bar

---

## 5. get-analysis

**Purpose**: Retrieve complete analysis results

**Endpoint**: `GET /functions/v1/get-analysis?opportunity_id={uuid}`

**Content-Type**: N/A (GET request)

### Query Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| opportunity_id | Yes | Opportunity UUID |

### Response

**Success (200)**:
```json
{
  "opportunity": {
    "id": "uuid",
    "solicitation_number": "FA1234-25-R-0001",
    "title": "Roofing Repair Services",
    "agency": "Department of Defense",
    "status": "reviewed",
    "due_date": "2025-12-01T17:00:00Z",
    "location": "Florida",
    "naics_codes": ["238160"],
    "set_aside": "SDVOSB",
    "created_at": "2025-11-23T10:00:00Z",
    "updated_at": "2025-11-23T10:05:00Z"
  },
  "analysis": {
    "id": "uuid",
    "opportunity_id": "uuid",
    "document_id": "uuid",
    "scope_summary": "Project involves roof replacement for 3 buildings...",
    "technical_requirements": [
      {
        "category": "Materials",
        "requirement": "GAF Timberline HDZ shingles",
        "reference_section": "Section 3.2"
      }
    ],
    "submission_requirements": [
      {
        "item": "Past performance references",
        "format": "3 references with contact info",
        "due": "2025-11-30"
      }
    ],
    "qualifications_required": [
      {
        "type": "License",
        "requirement": "Florida Roofing Contractor License",
        "c2c_status": "met"
      },
      {
        "type": "Certification",
        "requirement": "SDVOSB certification",
        "c2c_status": "met"
      }
    ],
    "timeline_schedule": {
      "start_date": "2026-01-15",
      "duration": "60 days",
      "milestones": ["Site prep: 5 days", "Installation: 45 days", "Final inspection: 10 days"]
    },
    "insurance_bonding": {
      "general_liability": "$1,000,000",
      "workers_comp": "$500,000",
      "performance_bond": "100%",
      "payment_bond": "100%"
    },
    "pricing_structure": {
      "structure_type": "lump sum",
      "line_items": ["Building A roof", "Building B roof", "Building C roof"],
      "payment_terms": "Net 30 after completion"
    },
    "prevailing_wage": false,
    "site_conditions": "Located at Eglin AFB, Florida. Base access required.",
    "questions_flagged": [
      "Confirm GAF Timberline HDZ color selection",
      "Clarify site access requirements for workers"
    ],
    "fit_score": 85,
    "confidence_level": "high",
    "red_flags": [],
    "created_at": "2025-11-23T10:02:00Z",
    "updated_at": "2025-11-23T10:05:00Z"
  },
  "processing_metadata": {
    "file_name": "FA1234-25-R-0001_solicitation.pdf",
    "page_count": 23,
    "processing_time_seconds": 300,
    "analyzed_at": "2025-11-23T10:05:00Z"
  }
}
```

**Not Ready (404)**:
```json
{
  "success": false,
  "error": "Analysis not ready yet. Current status: ocr_processing",
  "details": "Use check-status endpoint to poll for completion"
}
```

### Example Request

```bash
curl -X GET "https://your-project.supabase.co/functions/v1/get-analysis?opportunity_id=660e8400-e29b-41d4-a716-446655440001" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### Notes

- Returns complete analysis except `raw_ocr_text` (excluded for size)
- Only returns when `processing_status='completed'`
- Use `check-status` first to verify readiness

---

## Environment Variables

All functions require the following environment variables:

### Required for All Functions

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Required for ocr-processor

```bash
GOOGLE_CLOUD_PROJECT_ID=your-gcp-project-id
GOOGLE_CLOUD_CREDENTIALS='{"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}'
```

**GOOGLE_CLOUD_CREDENTIALS** must be a JSON string containing your service account key with the following permissions:
- Cloud Vision API access (`roles/cloudvision.user`)

### Required for ai-analyzer

```bash
ANTHROPIC_API_KEY=sk-ant-...
```

---

## Error Codes

| HTTP Code | Meaning | Common Causes |
|-----------|---------|---------------|
| 400 | Bad Request | Missing required fields, invalid file type, file too large |
| 404 | Not Found | Opportunity/document doesn't exist, analysis not ready |
| 500 | Internal Server Error | API failures, database errors, processing errors |

All error responses follow this format:
```json
{
  "success": false,
  "error": "Human-readable error message",
  "details": "Additional context (optional)"
}
```

---

## Deployment Instructions

### 1. Set Environment Variables

```bash
# Set secrets for all functions
supabase secrets set SUPABASE_URL="https://your-project.supabase.co"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="your-key"
supabase secrets set GOOGLE_CLOUD_PROJECT_ID="your-project"
supabase secrets set GOOGLE_CLOUD_CREDENTIALS='{"type":"service_account",...}'
supabase secrets set ANTHROPIC_API_KEY="sk-ant-..."
```

### 2. Deploy Functions

```bash
# Deploy all functions
supabase functions deploy upload-bid-package
supabase functions deploy ocr-processor
supabase functions deploy ai-analyzer
supabase functions deploy check-status
supabase functions deploy get-analysis
```

### 3. Create Storage Bucket

```sql
-- Run in Supabase SQL editor
INSERT INTO storage.buckets (id, name, public)
VALUES ('bid-documents', 'bid-documents', false);

-- Set up storage policies
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'bid-documents');

CREATE POLICY "Service role can do anything"
ON storage.objects
TO service_role
USING (bucket_id = 'bid-documents');
```

### 4. Verify Deployment

```bash
# Test upload-bid-package
curl -X POST https://your-project.supabase.co/functions/v1/upload-bid-package \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -F "file=@test.pdf" \
  -F "solicitation_number=TEST-001" \
  -F "title=Test Bid" \
  -F "agency=Test Agency"
```

---

## Performance Considerations

### Timeouts

Supabase Edge Functions have a **150-second timeout**. For large PDFs:
- OCR processing typically takes 5-30 seconds
- AI analysis typically takes 5-15 seconds
- Total processing time usually < 60 seconds

### Best Practices

1. **Asynchronous Processing**: Functions trigger each other asynchronously to avoid blocking
2. **Polling**: Use `check-status` for status updates (poll every 5-10s)
3. **Error Recovery**: Failed documents can be reprocessed by calling `ocr-processor` manually
4. **Rate Limiting**:
   - Google Vision API: 1,800 requests/minute
   - Anthropic API: Varies by plan (typically 50-100 requests/minute)

---

## Security Notes

1. **CORS**: All functions allow cross-origin requests (`Access-Control-Allow-Origin: *`)
2. **Authentication**:
   - Public endpoints: `upload-bid-package`, `check-status`, `get-analysis`
   - Internal endpoints: `ocr-processor`, `ai-analyzer` (use service role key)
3. **File Validation**: PDFs only, 50MB max
4. **API Keys**: Store in Supabase secrets, never commit to code

---

## Monitoring & Debugging

### View Function Logs

```bash
# Real-time logs
supabase functions logs upload-bid-package --tail

# Specific time range
supabase functions logs ai-analyzer --since 1h
```

### Common Issues

| Issue | Solution |
|-------|----------|
| "Failed to get access token" | Check GOOGLE_CLOUD_CREDENTIALS format |
| "Vision API error" | Verify GCP project has Vision API enabled |
| "Anthropic API error" | Check API key and rate limits |
| "No text extracted" | PDF may be image-only; ensure OCR is configured |
| Processing stuck | Check function logs for errors; retry manually |

---

## Support

For issues or questions:
- Review function logs: `supabase functions logs <function-name>`
- Check database records in `bid_documents` table for error messages
- Verify environment variables are set correctly
- Ensure external APIs (Google Vision, Anthropic) are accessible

---

**Last Updated**: 2025-11-23
**Version**: 1.0.0
