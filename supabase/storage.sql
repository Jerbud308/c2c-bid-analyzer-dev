-- ============================================================================
-- C2C Restoration Government Bid Analyzer - Storage Configuration
-- ============================================================================
-- Version: 1.0
-- Description: Storage bucket configuration for PDF bid documents
-- ============================================================================

-- ============================================================================
-- STORAGE BUCKET: bid-documents
-- ============================================================================
-- Private bucket for storing government bid PDF documents
-- Max file size: 50MB (enforced at application level)
-- Allowed MIME types: application/pdf (enforced at application level)
-- ============================================================================

-- Create the storage bucket for bid documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('bid-documents', 'bid-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Add bucket comment/description
COMMENT ON TABLE storage.buckets IS 'Storage buckets for C2C bid analyzer';

-- ============================================================================
-- STORAGE POLICIES
-- ============================================================================
-- Security policies controlling access to files in the bid-documents bucket
-- ============================================================================

-- Policy 1: Allow authenticated users to upload (INSERT) bid documents
CREATE POLICY "Allow authenticated users to upload bid documents"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'bid-documents'
    );

-- Policy 2: Allow authenticated users to read (SELECT) bid documents
CREATE POLICY "Allow authenticated users to read bid documents"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'bid-documents'
    );

-- Policy 3: Allow authenticated users to update bid document metadata
CREATE POLICY "Allow authenticated users to update bid documents"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'bid-documents'
    )
    WITH CHECK (
        bucket_id = 'bid-documents'
    );

-- Policy 4: Allow authenticated users to delete their bid documents
CREATE POLICY "Allow authenticated users to delete bid documents"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'bid-documents'
    );

-- Policy 5: Allow service role full access to all operations
-- (Required for backend processing, OCR, AI analysis)
CREATE POLICY "Allow service role full access to bid documents"
    ON storage.objects
    FOR ALL
    TO service_role
    USING (
        bucket_id = 'bid-documents'
    )
    WITH CHECK (
        bucket_id = 'bid-documents'
    );

-- ============================================================================
-- STORAGE BUCKET CONFIGURATION NOTES
-- ============================================================================
--
-- File Upload Guidelines:
-- -----------------------
-- 1. Max file size: 50MB per document
--    - Enforced at application level before upload
--    - Typical government bids: 5-20MB
--
-- 2. Allowed file types: PDF only
--    - MIME type: application/pdf
--    - Enforced at application level with validation
--
-- 3. File naming convention:
--    - Format: {opportunity_id}/{timestamp}_{original_filename}.pdf
--    - Example: 123e4567-e89b-12d3-a456-426614174000/1703980800_bid-package.pdf
--
-- 4. Security:
--    - Bucket is PRIVATE (public = false)
--    - Files accessible only to authenticated users
--    - Service role has full access for backend operations
--
-- 5. Backend Processing Workflow:
--    a. User uploads PDF via authenticated client
--    b. File stored in: bid-documents/{opportunity_id}/{filename}
--    c. Record created in bid_documents table
--    d. Backend service (using service_role) retrieves file
--    e. OCR extraction performed
--    f. AI analysis generated
--    g. Results stored in bid_analysis table
--
-- 6. Production Considerations:
--    - Enable versioning for document history
--    - Set up lifecycle policies for old documents
--    - Consider CDN caching for frequently accessed files
--    - Monitor storage usage and costs
--    - Implement virus scanning before processing
--
-- ============================================================================
-- END OF STORAGE CONFIGURATION
-- ============================================================================
