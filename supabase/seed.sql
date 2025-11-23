-- ============================================================================
-- C2C Restoration Government Bid Analyzer - Sample Data
-- ============================================================================
-- Version: 1.0
-- Description: Seed data for development and testing
-- ============================================================================

-- ============================================================================
-- SAMPLE OPPORTUNITIES
-- ============================================================================
-- Two realistic government bid opportunities for testing the platform
-- ============================================================================

-- Sample Opportunity 1: Roofing Project in Florida
INSERT INTO opportunities (
    id,
    solicitation_number,
    title,
    agency,
    naics_code,
    set_aside_type,
    location,
    posted_date,
    deadline_date,
    estimated_value,
    status,
    notes,
    assigned_to
) VALUES (
    '550e8400-e29b-41d4-a716-446655440001',
    'W912EP-25-R-0042',
    'Roof Replacement Building 453 - MacDill Air Force Base',
    'U.S. Army Corps of Engineers, Jacksonville District',
    '238160',
    'SDVOSB',
    'Tampa, FL',
    '2025-01-15',
    '2025-02-28',
    485000.00,
    'new',
    'TPO roofing system, approximately 45,000 sq ft. Requires coordination with active military facility. Previous C2C experience at Eglin AFB may be relevant.',
    'Mike Johnson'
);

-- Sample Opportunity 2: Asbestos Remediation Project
INSERT INTO opportunities (
    id,
    solicitation_number,
    title,
    agency,
    naics_code,
    set_aside_type,
    location,
    posted_date,
    deadline_date,
    estimated_value,
    status,
    notes,
    assigned_to
) VALUES (
    '550e8400-e29b-41d4-a716-446655440002',
    'N62470-25-R-1205',
    'Asbestos Abatement and Demolition - Building 127',
    'Naval Facilities Engineering Systems Command Southeast',
    '562910',
    'SDVOSB',
    'Jacksonville, FL',
    '2025-01-10',
    '2025-03-15',
    275000.00,
    'analyzing',
    'Complete asbestos removal from 1960s-era warehouse before demolition. Approximately 12,000 sq ft. Davis-Bacon wages apply. Site visit scheduled for Jan 25.',
    'Sarah Martinez'
);

-- ============================================================================
-- SAMPLE BID DOCUMENTS
-- ============================================================================
-- Sample document records (files would be uploaded to storage separately)
-- ============================================================================

-- Document for Roofing Opportunity
INSERT INTO bid_documents (
    id,
    opportunity_id,
    file_name,
    file_path,
    file_size,
    mime_type,
    page_count,
    upload_date,
    processing_status,
    ocr_completed_at,
    analysis_completed_at
) VALUES (
    '660e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440001',
    'W912EP-25-R-0042_Solicitation_Package.pdf',
    'bid-documents/550e8400-e29b-41d4-a716-446655440001/W912EP-25-R-0042_Solicitation_Package.pdf',
    8450000,
    'application/pdf',
    127,
    '2025-01-16 09:30:00-05',
    'completed',
    '2025-01-16 09:35:22-05',
    '2025-01-16 09:42:18-05'
);

-- Document for Asbestos Opportunity
INSERT INTO bid_documents (
    id,
    opportunity_id,
    file_name,
    file_path,
    file_size,
    mime_type,
    page_count,
    upload_date,
    processing_status,
    ocr_completed_at
) VALUES (
    '660e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440002',
    'N62470-25-R-1205_Bid_Package.pdf',
    'bid-documents/550e8400-e29b-41d4-a716-446655440002/N62470-25-R-1205_Bid_Package.pdf',
    5230000,
    'application/pdf',
    89,
    '2025-01-12 14:20:00-05',
    'ai_processing',
    '2025-01-12 14:24:35-05'
);

-- ============================================================================
-- SAMPLE BID ANALYSIS
-- ============================================================================
-- Complete AI-generated analysis for the roofing opportunity
-- ============================================================================

INSERT INTO bid_analysis (
    id,
    opportunity_id,
    document_id,
    scope_summary,
    technical_requirements,
    submission_requirements,
    qualifications_required,
    timeline_schedule,
    insurance_bonding,
    pricing_structure,
    prevailing_wage,
    site_conditions,
    questions_flagged,
    fit_score,
    confidence_level,
    red_flags,
    raw_ocr_text,
    analysis_timestamp,
    processing_time_seconds
) VALUES (
    '770e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440001',
    '660e8400-e29b-41d4-a716-446655440001',
    'This project involves the complete roof replacement of Building 453 at MacDill Air Force Base in Tampa, Florida. The existing built-up roof (BUR) system has exceeded its service life and requires replacement with a new thermoplastic polyolefin (TPO) single-ply roofing system.

The scope includes removal and disposal of the existing roofing system down to the structural deck, installation of new insulation to meet current energy code requirements (minimum R-30), and installation of a fully adhered 60-mil white TPO membrane. The project also requires installation of new metal edge details, penetration flashings, and sheet metal work for all roof-mounted equipment.

Work must be coordinated with ongoing base operations and completed within a 90-day performance period. The contractor must maintain active security clearances for all personnel, provide detailed phasing plans to minimize disruption, and comply with all Unified Facilities Criteria (UFC) standards for military roofing systems.',
    '[
        {
            "category": "Roofing System",
            "requirement": "60-mil white TPO membrane, fully adhered, meeting ASTM D6878",
            "reference_section": "Section 07 54 00, Page 45"
        },
        {
            "category": "Insulation",
            "requirement": "Polyisocyanurate insulation, minimum R-30, tapered system for drainage",
            "reference_section": "Section 07 22 00, Page 38"
        },
        {
            "category": "Substrate Preparation",
            "requirement": "Complete removal of existing BUR to structural deck, deck inspection and repair",
            "reference_section": "Section 07 01 50, Page 22"
        },
        {
            "category": "Quality Control",
            "requirement": "Daily field reports, weekly progress photos, infrared scan upon completion",
            "reference_section": "Section 01 45 00, Page 12"
        },
        {
            "category": "Safety",
            "requirement": "OSHA-compliant fall protection, EM 385-1-1 compliance, site-specific safety plan",
            "reference_section": "Section 01 35 29, Page 8"
        }
    ]'::jsonb,
    '[
        {
            "item": "SF 1449 Solicitation/Contract Form",
            "format": "Completed and signed original",
            "due": "2025-02-28 14:00:00"
        },
        {
            "item": "Price Schedule with Line Items",
            "format": "Excel spreadsheet using provided template",
            "due": "2025-02-28 14:00:00"
        },
        {
            "item": "Technical Approach Narrative",
            "format": "PDF, maximum 15 pages",
            "due": "2025-02-28 14:00:00"
        },
        {
            "item": "Past Performance Questionnaires",
            "format": "Minimum 3 similar projects, completed forms",
            "due": "2025-02-28 14:00:00"
        },
        {
            "item": "SDVOSB Certification Documentation",
            "format": "Current SAM.gov registration printout",
            "due": "2025-02-28 14:00:00"
        },
        {
            "item": "Bonding Capacity Letter",
            "format": "Original letter from surety on company letterhead",
            "due": "2025-02-28 14:00:00"
        }
    ]'::jsonb,
    '[
        {
            "type": "SDVOSB Certification",
            "requirement": "Valid Service-Disabled Veteran-Owned Small Business certification in SAM.gov",
            "c2c_status": "met"
        },
        {
            "type": "Past Performance",
            "requirement": "Minimum 3 similar military roofing projects valued at $300K+ completed in last 5 years",
            "c2c_status": "met"
        },
        {
            "type": "Licensing",
            "requirement": "Florida State Certified Roofing Contractor license",
            "c2c_status": "met"
        },
        {
            "type": "Bonding Capacity",
            "requirement": "Surety bonding capacity minimum $500,000 single project",
            "c2c_status": "met"
        },
        {
            "type": "Insurance",
            "requirement": "General liability $2M, Workers comp per FL statutory requirements",
            "c2c_status": "met"
        },
        {
            "type": "Safety Record",
            "requirement": "EMR rating below 1.0, no significant OSHA violations in past 3 years",
            "c2c_status": "met"
        }
    ]'::jsonb,
    '{
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
            },
            {
                "name": "Deck Repairs and Preparation",
                "duration": "10 days",
                "completion": "Day 30"
            },
            {
                "name": "Insulation Installation",
                "duration": "20 days",
                "completion": "Day 50"
            },
            {
                "name": "TPO Membrane Installation",
                "duration": "25 days",
                "completion": "Day 75"
            },
            {
                "name": "Penetration Flashings and Sheet Metal",
                "duration": "10 days",
                "completion": "Day 85"
            },
            {
                "name": "Final Inspection and Testing",
                "duration": "5 days",
                "completion": "Day 90"
            }
        ]
    }'::jsonb,
    '{
        "general_liability": "$2,000,000 per occurrence / $4,000,000 aggregate",
        "workers_comp": "Florida statutory limits, all classes of employees",
        "performance_bond": "100% of contract value, issued by Treasury-listed surety",
        "payment_bond": "100% of contract value, issued by Treasury-listed surety",
        "additional_insured": "United States of America must be named as additional insured"
    }'::jsonb,
    '{
        "structure_type": "Firm Fixed Price",
        "payment_terms": "Monthly progress payments based on completed work, 10% retainage",
        "line_items": [
            {
                "clin": "0001",
                "description": "Base Bid - Complete Roof Replacement Building 453",
                "unit": "Lump Sum",
                "quantity": 1,
                "estimated_amount": "$485,000"
            },
            {
                "clin": "0002",
                "description": "Option - Additional Deck Repairs (if required)",
                "unit": "Square Foot",
                "quantity": 500,
                "estimated_unit_price": "$45"
            }
        ]
    }'::jsonb,
    false,
    'Active military installation with restricted access. All workers require security clearance processing (minimum 2 weeks lead time). Work hours limited to 0700-1700 Monday-Friday, no weekend work without prior approval. Building 453 is partially occupied - phased approach required to maintain operations in adjacent areas. Staging area designated in Lot 12B, approximately 200 feet from building. Material delivery requires 48-hour advance coordination with base logistics.',
    '[
        {
            "question": "Can the 2-week security clearance processing time be expedited? Our crew size is 8-12 workers.",
            "category": "Logistics",
            "criticality": "medium"
        },
        {
            "question": "Section 07 54 00 specifies fully adhered TPO, but typical for this climate is mechanically attached. Can we propose mechanically attached as alternate?",
            "category": "Technical",
            "criticality": "high"
        },
        {
            "question": "Is the asbestos survey in Appendix C current? Document dated 2018.",
            "category": "Safety/Compliance",
            "criticality": "high"
        }
    ]'::jsonb,
    87,
    'high',
    '[]'::jsonb,
    '--- SAMPLE OCR TEXT (truncated for seed data) ---

SOLICITATION NUMBER: W912EP-25-R-0042
PROJECT: Roof Replacement Building 453
LOCATION: MacDill Air Force Base, Tampa, FL

SECTION 1: GENERAL INFORMATION
This is a competitive solicitation for Service-Disabled Veteran-Owned Small Businesses (SDVOSB)...

[Full OCR text would be stored here in production]',
    '2025-01-16 09:42:18-05',
    416
);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these queries to verify the seed data was inserted correctly
-- ============================================================================

-- Verify opportunities were created
-- SELECT solicitation_number, title, status FROM opportunities ORDER BY posted_date DESC;

-- Verify documents were linked
-- SELECT bd.file_name, bd.processing_status, o.title
-- FROM bid_documents bd
-- JOIN opportunities o ON bd.opportunity_id = o.id;

-- Verify analysis was created
-- SELECT ba.fit_score, ba.confidence_level, o.title
-- FROM bid_analysis ba
-- JOIN opportunities o ON ba.opportunity_id = o.id;

-- ============================================================================
-- END OF SEED DATA
-- ============================================================================
