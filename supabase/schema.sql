-- ============================================================================
-- C2C Restoration Government Bid Analyzer - Database Schema
-- ============================================================================
-- Version: 1.0
-- Description: Complete database schema for tracking government contract
--              opportunities, bid documents, and AI-powered analysis
-- ============================================================================

-- Enable UUID extension for auto-generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE: opportunities
-- ============================================================================
-- Stores government contract opportunities that C2C Restoration can bid on
-- ============================================================================

CREATE TABLE opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    solicitation_number TEXT UNIQUE,
    title TEXT NOT NULL,
    agency TEXT,
    naics_code TEXT,
    set_aside_type TEXT,
    location TEXT,
    posted_date DATE,
    deadline_date DATE,
    estimated_value DECIMAL(12,2),
    status TEXT NOT NULL DEFAULT 'new',
    notes TEXT,
    assigned_to TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraint: status must be one of the valid workflow states
    CONSTRAINT opportunities_status_check
        CHECK (status IN ('new', 'analyzing', 'reviewed', 'bidding', 'submitted', 'won', 'lost', 'pass'))
);

-- Add comment documentation
COMMENT ON TABLE opportunities IS 'Government contract opportunities for C2C Restoration to bid on';
COMMENT ON COLUMN opportunities.solicitation_number IS 'Unique government solicitation ID (e.g., W912XX-25-R-0001)';
COMMENT ON COLUMN opportunities.naics_code IS 'Industry classification codes: 238160 (Roofing), 238310 (Drywall), 236220 (Commercial), 236118 (Residential), 238210 (Electrical), 562910 (Asbestos Remediation)';
COMMENT ON COLUMN opportunities.set_aside_type IS 'Contract set-aside: SDVOSB, 8(a), HUBZone, WOSB';
COMMENT ON COLUMN opportunities.status IS 'Workflow status: new -> analyzing -> reviewed -> bidding -> submitted -> won/lost/pass';
COMMENT ON COLUMN opportunities.estimated_value IS 'Estimated contract value in USD';
COMMENT ON COLUMN opportunities.assigned_to IS 'Team member responsible for this bid';

-- ============================================================================
-- TABLE: bid_documents
-- ============================================================================
-- Stores PDF documents uploaded for each opportunity
-- ============================================================================

CREATE TABLE bid_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    opportunity_id UUID NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    page_count INTEGER,
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processing_status TEXT NOT NULL DEFAULT 'pending',
    ocr_completed_at TIMESTAMP WITH TIME ZONE,
    analysis_completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,

    -- Foreign key relationship
    CONSTRAINT fk_opportunity
        FOREIGN KEY (opportunity_id)
        REFERENCES opportunities(id)
        ON DELETE CASCADE,

    -- Constraint: processing_status must be one of the valid states
    CONSTRAINT bid_documents_processing_status_check
        CHECK (processing_status IN ('pending', 'ocr_processing', 'ocr_completed', 'ai_processing', 'completed', 'failed'))
);

-- Add comment documentation
COMMENT ON TABLE bid_documents IS 'PDF documents uploaded for bid opportunities';
COMMENT ON COLUMN bid_documents.file_path IS 'Path in Supabase Storage bucket (bid-documents)';
COMMENT ON COLUMN bid_documents.file_size IS 'File size in bytes';
COMMENT ON COLUMN bid_documents.page_count IS 'Number of pages in PDF document';
COMMENT ON COLUMN bid_documents.processing_status IS 'Processing workflow: pending -> ocr_processing -> ocr_completed -> ai_processing -> completed/failed';

-- ============================================================================
-- TABLE: bid_analysis
-- ============================================================================
-- Stores AI-generated analysis of bid documents
-- ============================================================================

CREATE TABLE bid_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    opportunity_id UUID NOT NULL,
    document_id UUID NOT NULL,

    -- Core analysis fields
    scope_summary TEXT,
    technical_requirements JSONB DEFAULT '[]'::jsonb,
    submission_requirements JSONB DEFAULT '[]'::jsonb,
    qualifications_required JSONB DEFAULT '[]'::jsonb,
    timeline_schedule JSONB DEFAULT '{}'::jsonb,
    insurance_bonding JSONB DEFAULT '{}'::jsonb,
    pricing_structure JSONB DEFAULT '{}'::jsonb,
    prevailing_wage BOOLEAN,
    site_conditions TEXT,
    questions_flagged JSONB DEFAULT '[]'::jsonb,

    -- Scoring and assessment
    fit_score INTEGER,
    confidence_level TEXT,
    red_flags JSONB DEFAULT '[]'::jsonb,

    -- Raw data and metadata
    raw_ocr_text TEXT,
    analysis_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processing_time_seconds INTEGER,

    -- Foreign key relationships
    CONSTRAINT fk_opportunity
        FOREIGN KEY (opportunity_id)
        REFERENCES opportunities(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_document
        FOREIGN KEY (document_id)
        REFERENCES bid_documents(id)
        ON DELETE CASCADE,

    -- Constraints
    CONSTRAINT bid_analysis_fit_score_check
        CHECK (fit_score >= 0 AND fit_score <= 100),

    CONSTRAINT bid_analysis_confidence_level_check
        CHECK (confidence_level IN ('high', 'medium', 'low')),

    -- Unique constraint: one analysis per document per opportunity
    CONSTRAINT bid_analysis_unique_opportunity_document
        UNIQUE (opportunity_id, document_id)
);

-- Add comment documentation
COMMENT ON TABLE bid_analysis IS 'AI-powered analysis of government bid documents';
COMMENT ON COLUMN bid_analysis.scope_summary IS '2-3 paragraph AI-generated summary of project scope';
COMMENT ON COLUMN bid_analysis.technical_requirements IS 'Array of {category, requirement, reference_section}';
COMMENT ON COLUMN bid_analysis.submission_requirements IS 'Array of {item, format, due}';
COMMENT ON COLUMN bid_analysis.qualifications_required IS 'Array of {type, requirement, c2c_status: met|needs_verification|not_met}';
COMMENT ON COLUMN bid_analysis.timeline_schedule IS 'Object: {start_date, duration, milestones: []}';
COMMENT ON COLUMN bid_analysis.insurance_bonding IS 'Object: {general_liability, workers_comp, performance_bond, payment_bond}';
COMMENT ON COLUMN bid_analysis.pricing_structure IS 'Object: {structure_type, line_items: [], payment_terms}';
COMMENT ON COLUMN bid_analysis.prevailing_wage IS 'Davis-Bacon prevailing wage requirements apply';
COMMENT ON COLUMN bid_analysis.fit_score IS 'AI-calculated match score (0-100) for C2C capabilities';
COMMENT ON COLUMN bid_analysis.red_flags IS 'Array of disqualifying or high-risk issues';
COMMENT ON COLUMN bid_analysis.raw_ocr_text IS 'Full OCR-extracted text from PDF document';

-- ============================================================================
-- TABLE: compliance_checklists
-- ============================================================================
-- Stores automatically generated compliance checklists for each opportunity
-- ============================================================================

CREATE TABLE compliance_checklists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    opportunity_id UUID NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completion_percentage INTEGER DEFAULT 0,
    items JSONB DEFAULT '[]'::jsonb,
    custom_items JSONB DEFAULT '[]'::jsonb,

    -- Foreign key relationship
    CONSTRAINT fk_opportunity
        FOREIGN KEY (opportunity_id)
        REFERENCES opportunities(id)
        ON DELETE CASCADE,

    -- Constraints
    CONSTRAINT compliance_checklists_completion_check
        CHECK (completion_percentage >= 0 AND completion_percentage <= 100),

    -- Unique constraint: one checklist per opportunity
    CONSTRAINT compliance_checklists_unique_opportunity
        UNIQUE (opportunity_id)
);

-- Add comment documentation
COMMENT ON TABLE compliance_checklists IS 'Auto-generated compliance checklists for tracking bid requirements';
COMMENT ON COLUMN compliance_checklists.items IS 'Array of checklist items: [{id, category, description, reference_section, status, responsible_party, notes, source, created_at, completed_at}]';
COMMENT ON COLUMN compliance_checklists.custom_items IS 'Array of user-added custom checklist items with same structure as items';
COMMENT ON COLUMN compliance_checklists.completion_percentage IS 'Percentage of items marked as complete (0-100)';

-- ============================================================================
-- INDEXES
-- ============================================================================
-- Performance optimization for common queries
-- ============================================================================

-- Opportunities indexes
CREATE INDEX idx_opportunities_status
    ON opportunities(status);

CREATE INDEX idx_opportunities_deadline
    ON opportunities(deadline_date)
    WHERE deadline_date IS NOT NULL;

CREATE INDEX idx_opportunities_naics
    ON opportunities(naics_code)
    WHERE naics_code IS NOT NULL;

CREATE INDEX idx_opportunities_set_aside
    ON opportunities(set_aside_type)
    WHERE set_aside_type IS NOT NULL;

-- Bid documents indexes
CREATE INDEX idx_bid_documents_opportunity
    ON bid_documents(opportunity_id);

CREATE INDEX idx_bid_documents_status
    ON bid_documents(processing_status);

CREATE INDEX idx_bid_documents_upload_date
    ON bid_documents(upload_date DESC);

-- Bid analysis indexes
CREATE INDEX idx_bid_analysis_opportunity
    ON bid_analysis(opportunity_id);

CREATE INDEX idx_bid_analysis_document
    ON bid_analysis(document_id);

CREATE INDEX idx_bid_analysis_fit_score
    ON bid_analysis(fit_score DESC)
    WHERE fit_score IS NOT NULL;

-- Compliance checklists indexes
CREATE INDEX idx_compliance_opportunity
    ON compliance_checklists(opportunity_id);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to opportunities table
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON opportunities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to compliance_checklists table
CREATE TRIGGER update_compliance_updated
    BEFORE UPDATE ON compliance_checklists
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- Enable RLS on all tables for security
-- Note: In production, refine these policies based on actual auth requirements
-- ============================================================================

-- Enable RLS
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE bid_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE bid_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_checklists ENABLE ROW LEVEL SECURITY;

-- Policies: Allow all operations for authenticated users
-- (Tighten in production with user-specific or role-based policies)

CREATE POLICY "Enable all access for authenticated users"
    ON opportunities
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable all access for authenticated users"
    ON bid_documents
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable all access for authenticated users"
    ON bid_analysis
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Allow service role full access (for backend operations)
CREATE POLICY "Enable all access for service role"
    ON opportunities
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable all access for service role"
    ON bid_documents
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable all access for service role"
    ON bid_analysis
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable all access for authenticated users"
    ON compliance_checklists
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable all access for service role"
    ON compliance_checklists
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
