# C2C Restoration Government Bid Analyzer - Database Schema Documentation

## Overview

This document provides comprehensive documentation for the Supabase database schema used in C2C Restoration's government bid analyzer platform. The system is designed to manage government contract opportunities, store bid documents, and leverage AI to analyze complex solicitation packages.

---

## Table Relationships

```
┌─────────────────────────────────────┐
│         opportunities               │
│─────────────────────────────────────│
│ PK  id (UUID)                       │
│ UNQ solicitation_number             │
│     title                           │
│     agency                          │
│     naics_code                      │
│     set_aside_type (SDVOSB, etc)    │
│     location                        │
│     posted_date                     │
│     deadline_date                   │
│     estimated_value                 │
│     status (new→analyzing→won)      │
│     notes                           │
│     assigned_to                     │
│     created_at                      │
│     updated_at (auto-trigger)       │
└─────────────────────────────────────┘
              │
              │ 1
              │
              │ N
              ▼
┌─────────────────────────────────────┐
│         bid_documents               │
│─────────────────────────────────────│
│ PK  id (UUID)                       │
│ FK  opportunity_id                  │◄─── CASCADE DELETE
│     file_name                       │
│     file_path (storage bucket)      │
│     file_size                       │
│     mime_type                       │
│     page_count                      │
│     upload_date                     │
│     processing_status               │
│     ocr_completed_at                │
│     analysis_completed_at           │
│     error_message                   │
└─────────────────────────────────────┘
              │
              │ 1
              │
              │ 1 (one analysis per document)
              ▼
┌─────────────────────────────────────┐
│         bid_analysis                │
│─────────────────────────────────────│
│ PK  id (UUID)                       │
│ FK  opportunity_id                  │◄─── CASCADE DELETE
│ FK  document_id                     │◄─── CASCADE DELETE
│     scope_summary (TEXT)            │
│     technical_requirements (JSONB)  │
│     submission_requirements (JSONB) │
│     qualifications_required (JSONB) │
│     timeline_schedule (JSONB)       │
│     insurance_bonding (JSONB)       │
│     pricing_structure (JSONB)       │
│     prevailing_wage (BOOLEAN)       │
│     site_conditions (TEXT)          │
│     questions_flagged (JSONB)       │
│     fit_score (0-100)               │
│     confidence_level (high/med/low) │
│     red_flags (JSONB)               │
│     raw_ocr_text (TEXT)             │
│     analysis_timestamp              │
│     processing_time_seconds         │
│ UNQ (opportunity_id, document_id)   │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│    Storage: bid-documents           │
│     (Supabase Storage Bucket)       │
│─────────────────────────────────────│
│ Private bucket for PDF files        │
│ Max size: 50MB per file             │
│ MIME type: application/pdf          │
│ Access: authenticated users only    │
└─────────────────────────────────────┘
```

---

## Table Schemas

### 1. `opportunities`

Stores government contract opportunities that C2C Restoration can bid on.

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| `solicitation_number` | TEXT | UNIQUE | Government solicitation ID (e.g., "W912EP-25-R-0042") |
| `title` | TEXT | NOT NULL | Contract title/description |
| `agency` | TEXT | - | Issuing agency (e.g., "U.S. Army Corps of Engineers") |
| `naics_code` | TEXT | - | Industry classification: 238160 (Roofing), 238310 (Drywall), 236220 (Commercial), 236118 (Residential), 238210 (Electrical), 562910 (Asbestos) |
| `set_aside_type` | TEXT | - | Contract set-aside: SDVOSB, 8(a), HUBZone, WOSB |
| `location` | TEXT | - | Project location (city, state) |
| `posted_date` | DATE | - | When opportunity was posted |
| `deadline_date` | DATE | - | Bid submission deadline |
| `estimated_value` | DECIMAL(12,2) | - | Estimated contract value in USD |
| `status` | TEXT | DEFAULT 'new', CHECK constraint | Workflow state (see below) |
| `notes` | TEXT | - | Internal notes and observations |
| `assigned_to` | TEXT | - | Team member responsible for bid |
| `created_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW(), AUTO-UPDATED | Last modification timestamp |

#### Status Workflow

```
new → analyzing → reviewed → bidding → submitted → won/lost/pass
```

- **new**: Just discovered, not yet analyzed
- **analyzing**: AI processing bid documents
- **reviewed**: Analysis complete, team reviewing
- **bidding**: Actively preparing bid response
- **submitted**: Bid submitted to agency
- **won**: Contract awarded to C2C
- **lost**: Contract awarded to competitor
- **pass**: Decision made not to bid

---

### 2. `bid_documents`

Stores PDF documents uploaded for each opportunity.

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `opportunity_id` | UUID | FOREIGN KEY → opportunities(id) CASCADE DELETE | Links to parent opportunity |
| `file_name` | TEXT | NOT NULL | Original filename |
| `file_path` | TEXT | NOT NULL | Path in Supabase Storage (e.g., "bid-documents/{opp_id}/file.pdf") |
| `file_size` | INTEGER | - | File size in bytes |
| `mime_type` | TEXT | - | Should be "application/pdf" |
| `page_count` | INTEGER | - | Number of pages in PDF |
| `upload_date` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | When file was uploaded |
| `processing_status` | TEXT | DEFAULT 'pending', CHECK constraint | Processing workflow state |
| `ocr_completed_at` | TIMESTAMP WITH TIME ZONE | - | When OCR extraction finished |
| `analysis_completed_at` | TIMESTAMP WITH TIME ZONE | - | When AI analysis finished |
| `error_message` | TEXT | - | Error details if processing failed |

#### Processing Status Workflow

```
pending → ocr_processing → ocr_completed → ai_processing → completed/failed
```

- **pending**: Uploaded, awaiting processing
- **ocr_processing**: Text extraction in progress
- **ocr_completed**: OCR done, ready for AI
- **ai_processing**: AI analysis in progress
- **completed**: Full analysis complete
- **failed**: Error occurred during processing

---

### 3. `bid_analysis`

Stores AI-generated analysis of bid documents.

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `opportunity_id` | UUID | FOREIGN KEY → opportunities(id) CASCADE DELETE | Links to opportunity |
| `document_id` | UUID | FOREIGN KEY → bid_documents(id) CASCADE DELETE | Links to source document |
| `scope_summary` | TEXT | - | 2-3 paragraph AI summary of project |
| `technical_requirements` | JSONB | DEFAULT '[]' | Array of technical specs (see below) |
| `submission_requirements` | JSONB | DEFAULT '[]' | What to submit and when |
| `qualifications_required` | JSONB | DEFAULT '[]' | Certifications, licenses, experience |
| `timeline_schedule` | JSONB | DEFAULT '{}' | Project schedule and milestones |
| `insurance_bonding` | JSONB | DEFAULT '{}' | Insurance and bond requirements |
| `pricing_structure` | JSONB | DEFAULT '{}' | Payment terms and line items |
| `prevailing_wage` | BOOLEAN | - | Davis-Bacon wage requirements apply |
| `site_conditions` | TEXT | - | Site-specific requirements/constraints |
| `questions_flagged` | JSONB | DEFAULT '[]' | Questions needing clarification |
| `fit_score` | INTEGER | CHECK (0-100) | AI-calculated match score for C2C |
| `confidence_level` | TEXT | CHECK (high/medium/low) | AI confidence in analysis |
| `red_flags` | JSONB | DEFAULT '[]' | Disqualifying or high-risk issues |
| `raw_ocr_text` | TEXT | - | Full OCR-extracted text from PDF |
| `analysis_timestamp` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | When analysis was generated |
| `processing_time_seconds` | INTEGER | - | How long analysis took |

**Unique Constraint**: `(opportunity_id, document_id)` - One analysis per document

---

## JSONB Field Structures

### `technical_requirements` (Array)

```json
[
  {
    "category": "Roofing System",
    "requirement": "60-mil white TPO membrane, fully adhered, meeting ASTM D6878",
    "reference_section": "Section 07 54 00, Page 45"
  },
  {
    "category": "Insulation",
    "requirement": "Polyisocyanurate insulation, minimum R-30",
    "reference_section": "Section 07 22 00, Page 38"
  }
]
```

**Purpose**: Structured extraction of technical specifications from bid documents, with references to source sections.

---

### `submission_requirements` (Array)

```json
[
  {
    "item": "SF 1449 Solicitation/Contract Form",
    "format": "Completed and signed original",
    "due": "2025-02-28 14:00:00"
  },
  {
    "item": "Past Performance Questionnaires",
    "format": "Minimum 3 similar projects, completed forms",
    "due": "2025-02-28 14:00:00"
  }
]
```

**Purpose**: Checklist of what must be submitted with the bid and in what format.

---

### `qualifications_required` (Array)

```json
[
  {
    "type": "SDVOSB Certification",
    "requirement": "Valid Service-Disabled Veteran-Owned Small Business certification",
    "c2c_status": "met"
  },
  {
    "type": "Past Performance",
    "requirement": "Minimum 3 similar projects valued at $300K+",
    "c2c_status": "needs_verification"
  },
  {
    "type": "Bonding Capacity",
    "requirement": "Surety bonding capacity minimum $500,000",
    "c2c_status": "not_met"
  }
]
```

**C2C Status Values**:
- `met`: C2C currently meets this requirement
- `needs_verification`: May meet, requires verification
- `not_met`: C2C does not meet this requirement

**Purpose**: Track which qualifications C2C has vs. what's required.

---

### `timeline_schedule` (Object)

```json
{
  "start_date": "2025-04-01",
  "duration": "90 calendar days",
  "completion_date": "2025-06-30",
  "milestones": [
    {
      "name": "Mobilization and Site Setup",
      "duration": "5 days",
      "completion": "Day 5"
    },
    {
      "name": "Existing Roof Removal",
      "duration": "15 days",
      "completion": "Day 20"
    }
  ]
}
```

**Purpose**: Project schedule with key milestones for resource planning.

---

### `insurance_bonding` (Object)

```json
{
  "general_liability": "$2,000,000 per occurrence / $4,000,000 aggregate",
  "workers_comp": "Florida statutory limits",
  "performance_bond": "100% of contract value, Treasury-listed surety",
  "payment_bond": "100% of contract value, Treasury-listed surety",
  "additional_insured": "United States of America"
}
```

**Purpose**: Insurance and bonding requirements for compliance checking.

---

### `pricing_structure` (Object)

```json
{
  "structure_type": "Firm Fixed Price",
  "payment_terms": "Monthly progress payments, 10% retainage",
  "line_items": [
    {
      "clin": "0001",
      "description": "Base Bid - Roof Replacement",
      "unit": "Lump Sum",
      "quantity": 1,
      "estimated_amount": "$485,000"
    },
    {
      "clin": "0002",
      "description": "Option - Additional Deck Repairs",
      "unit": "Square Foot",
      "quantity": 500,
      "estimated_unit_price": "$45"
    }
  ]
}
```

**Purpose**: Structured pricing data for bid preparation.

---

### `questions_flagged` (Array)

```json
[
  {
    "question": "Can security clearance processing be expedited?",
    "category": "Logistics",
    "criticality": "medium"
  },
  {
    "question": "Is the asbestos survey current? Document dated 2018.",
    "category": "Safety/Compliance",
    "criticality": "high"
  }
]
```

**Criticality Levels**: `high`, `medium`, `low`

**Purpose**: Track questions that need answers before bidding.

---

### `red_flags` (Array)

```json
[
  {
    "flag": "Performance bond requirement ($2M) exceeds C2C bonding capacity",
    "severity": "critical",
    "disqualifying": true
  },
  {
    "flag": "Requires asbestos license - verify C2C has current certification",
    "severity": "high",
    "disqualifying": false
  }
]
```

**Purpose**: Highlight issues that could disqualify C2C or require mitigation.

---

## Indexes and Performance

### Index Strategy

| Index Name | Table | Column(s) | Purpose |
|------------|-------|-----------|---------|
| `idx_opportunities_status` | opportunities | status | Fast filtering by workflow status |
| `idx_opportunities_deadline` | opportunities | deadline_date (WHERE NOT NULL) | Upcoming deadline queries |
| `idx_opportunities_naics` | opportunities | naics_code (WHERE NOT NULL) | Filter by industry type |
| `idx_opportunities_set_aside` | opportunities | set_aside_type (WHERE NOT NULL) | Filter by set-aside type |
| `idx_bid_documents_opportunity` | bid_documents | opportunity_id | Join performance |
| `idx_bid_documents_status` | bid_documents | processing_status | Track processing queue |
| `idx_bid_documents_upload_date` | bid_documents | upload_date DESC | Recent uploads |
| `idx_bid_analysis_opportunity` | bid_analysis | opportunity_id | Join performance |
| `idx_bid_analysis_document` | bid_analysis | document_id | Join performance |
| `idx_bid_analysis_fit_score` | bid_analysis | fit_score DESC (WHERE NOT NULL) | Sort by best matches |

### Index Rationale

**Partial Indexes**: Several indexes use `WHERE column IS NOT NULL` to reduce index size and improve performance when many rows have NULL values.

**DESC Ordering**: `upload_date` and `fit_score` indexes use descending order because queries typically want newest uploads or highest scores first.

**Foreign Keys**: All foreign key columns are indexed for efficient joins and cascade delete operations.

---

## Triggers and Automation

### `update_updated_at_column()`

**Trigger**: `set_updated_at` on `opportunities` table

**Function**:
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Purpose**: Automatically update the `updated_at` timestamp whenever an opportunity record is modified.

**Fires**: BEFORE UPDATE on opportunities table

---

## Row Level Security (RLS)

### Security Model

All tables have RLS enabled with the following policies:

#### For Authenticated Users
```sql
CREATE POLICY "Enable all access for authenticated users"
    ON {table_name}
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
```

**Grants**: Full CRUD access (SELECT, INSERT, UPDATE, DELETE)

**Applies To**: Any user authenticated via Supabase Auth

#### For Service Role
```sql
CREATE POLICY "Enable all access for service role"
    ON {table_name}
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
```

**Grants**: Full CRUD access

**Purpose**: Allows backend services to perform operations (OCR, AI analysis, etc.)

### Production Security Considerations

**Current Setup**: Development-friendly - all authenticated users can access all data.

**Production Recommendations**:
1. **User-based isolation**: Add `user_id` column to opportunities table
2. **Team-based access**: Implement role-based policies (admin, analyst, viewer)
3. **Read-only roles**: Create policies for users who can view but not modify
4. **Audit logging**: Enable Supabase audit logs for compliance

**Example Production Policy**:
```sql
-- Only allow users to see opportunities assigned to them or unassigned
CREATE POLICY "Users can only access their opportunities"
    ON opportunities
    FOR SELECT
    TO authenticated
    USING (
        assigned_to = auth.email() OR assigned_to IS NULL
    );
```

---

## Storage Configuration

### Bucket: `bid-documents`

**Type**: Private (not publicly accessible)

**Purpose**: Store PDF bid documents uploaded by users

**Access Policies**:
- **Authenticated users**: Can upload, read, update, delete files
- **Service role**: Full access for backend processing

**Application-Level Constraints**:
- Maximum file size: 50MB per document
- Allowed MIME type: `application/pdf` only
- Validation occurs before upload

**File Naming Convention**:
```
bid-documents/{opportunity_id}/{timestamp}_{original_filename}.pdf
```

**Example**:
```
bid-documents/550e8400-e29b-41d4-a716-446655440001/1703980800_solicitation-package.pdf
```

---

## Data Flow and Processing Workflow

### Typical Workflow

```
1. User discovers opportunity on SAM.gov
   ↓
2. Create record in opportunities table (status: 'new')
   ↓
3. User uploads PDF to Supabase Storage
   ↓
4. Record created in bid_documents (status: 'pending')
   ↓
5. Backend triggers OCR processing
   - Status → 'ocr_processing'
   - Extract text from PDF
   - Status → 'ocr_completed'
   - Set ocr_completed_at timestamp
   ↓
6. Backend triggers AI analysis
   - Status → 'ai_processing'
   - Send OCR text to AI model
   - Parse structured data
   - Calculate fit_score
   ↓
7. Store results in bid_analysis table
   - Set analysis_completed_at timestamp
   - Update document status → 'completed'
   ↓
8. Update opportunity status → 'analyzing' → 'reviewed'
   ↓
9. Team reviews analysis and decides whether to bid
   ↓
10. Status → 'bidding' → 'submitted' → 'won'/'lost'/'pass'
```

### Error Handling

If processing fails:
- Document `processing_status` → 'failed'
- Error details stored in `error_message` column
- Opportunity status remains unchanged
- User notified to retry or upload different document

---

## Common Queries

### Get all opportunities with upcoming deadlines

```sql
SELECT
    solicitation_number,
    title,
    deadline_date,
    status,
    assigned_to
FROM opportunities
WHERE deadline_date >= CURRENT_DATE
    AND deadline_date <= CURRENT_DATE + INTERVAL '30 days'
ORDER BY deadline_date ASC;
```

### Get opportunities with completed analysis, sorted by fit score

```sql
SELECT
    o.solicitation_number,
    o.title,
    o.estimated_value,
    ba.fit_score,
    ba.confidence_level,
    ba.red_flags
FROM opportunities o
JOIN bid_analysis ba ON o.id = ba.opportunity_id
WHERE ba.fit_score IS NOT NULL
ORDER BY ba.fit_score DESC;
```

### Get processing status of all documents for an opportunity

```sql
SELECT
    bd.file_name,
    bd.page_count,
    bd.processing_status,
    bd.upload_date,
    bd.ocr_completed_at,
    bd.analysis_completed_at
FROM bid_documents bd
WHERE bd.opportunity_id = '550e8400-e29b-41d4-a716-446655440001'
ORDER BY bd.upload_date DESC;
```

### Find opportunities assigned to a team member with high fit scores

```sql
SELECT
    o.title,
    o.estimated_value,
    o.deadline_date,
    ba.fit_score,
    ba.confidence_level
FROM opportunities o
LEFT JOIN bid_analysis ba ON o.id = ba.opportunity_id
WHERE o.assigned_to = 'Mike Johnson'
    AND (ba.fit_score >= 80 OR ba.fit_score IS NULL)
ORDER BY o.deadline_date ASC;
```

---

## Deployment Instructions

### 1. Initialize Database

Run the schema file to create all tables, indexes, triggers, and RLS policies:

```bash
psql -h your-project.supabase.co -U postgres -d postgres -f supabase/schema.sql
```

Or via Supabase Dashboard:
1. Go to SQL Editor
2. Paste contents of `supabase/schema.sql`
3. Click "Run"

### 2. Configure Storage

Run the storage configuration:

```bash
psql -h your-project.supabase.co -U postgres -d postgres -f supabase/storage.sql
```

Or via Supabase Dashboard:
1. Go to SQL Editor
2. Paste contents of `supabase/storage.sql`
3. Click "Run"

### 3. Load Sample Data (Optional)

For development/testing environments:

```bash
psql -h your-project.supabase.co -U postgres -d postgres -f supabase/seed.sql
```

**WARNING**: Do not run seed data in production.

### 4. Verify Installation

```sql
-- Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';

-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- Check storage bucket exists
SELECT * FROM storage.buckets WHERE id = 'bid-documents';
```

---

## Maintenance and Monitoring

### Recommended Monitoring

1. **Processing Queue**: Track documents stuck in processing
   ```sql
   SELECT processing_status, COUNT(*)
   FROM bid_documents
   WHERE analysis_completed_at IS NULL
   GROUP BY processing_status;
   ```

2. **Storage Usage**: Monitor storage growth
   ```sql
   SELECT
       COUNT(*) as total_files,
       SUM(file_size) / 1024 / 1024 as total_mb,
       AVG(file_size) / 1024 / 1024 as avg_mb
   FROM bid_documents;
   ```

3. **Analysis Performance**: Track processing times
   ```sql
   SELECT
       AVG(processing_time_seconds) as avg_seconds,
       MAX(processing_time_seconds) as max_seconds
   FROM bid_analysis
   WHERE analysis_timestamp > NOW() - INTERVAL '7 days';
   ```

### Backup Strategy

- **Supabase automatic backups**: Enabled by default (daily)
- **Point-in-time recovery**: Available on Pro plan
- **Manual exports**: Run weekly via `pg_dump` for critical data

### Data Retention

Consider implementing:
- Archive opportunities older than 2 years
- Delete failed documents after 90 days
- Compress raw OCR text after 1 year

---

## Schema Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-01-23 | Initial schema release |

---

## Support and Contact

For questions about this schema:
- Technical Lead: [Your Name]
- Database: Supabase PostgreSQL 15
- Documentation: This file

---

**Last Updated**: 2025-01-23
**Schema Version**: 1.0
**Database**: Supabase PostgreSQL 15
