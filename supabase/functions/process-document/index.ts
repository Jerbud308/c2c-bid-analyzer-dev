// ============================================================================
// Supabase Edge Function: process-document
// ============================================================================
// Processes uploaded PDF using Claude AI
// - Extracts text from PDF
// - Analyzes bid requirements
// - Calculates fit score
// - Stores results in database
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!

/**
 * System prompt for Claude to analyze government bid documents
 */
const ANALYSIS_PROMPT = `You are an expert analyst for C2C Restoration, a government contracting company specializing in:
- Roofing (commercial and residential)
- Drywall and interior finishes
- General building renovation
- Asbestos and environmental remediation
- Electrical work
- HVAC systems

Analyze this government bid package and extract structured information. Evaluate how well this opportunity matches C2C's capabilities.

Return your analysis as a JSON object with this exact structure:

{
  "scope_summary": "2-3 paragraph summary of the project scope and requirements",
  "technical_requirements": [
    {"category": "Roofing", "requirement": "Install TPO roofing system", "reference_section": "Section 3.2"},
    ...
  ],
  "submission_requirements": [
    {"item": "SF-330 Form", "format": "PDF", "due": "2025-12-15"},
    ...
  ],
  "qualifications_required": [
    {"type": "License", "requirement": "State contractor license", "c2c_status": "met"},
    {"type": "Experience", "requirement": "3 similar projects", "c2c_status": "needs_verification"},
    ...
  ],
  "timeline_schedule": {
    "start_date": "2025-01-15",
    "duration": "180 days",
    "milestones": ["Mobilization by day 10", "Phase 1 complete by day 90", ...]
  },
  "insurance_bonding": {
    "general_liability": "$2,000,000",
    "workers_comp": "Required",
    "performance_bond": "100% of contract value",
    "payment_bond": "100% of contract value"
  },
  "pricing_structure": {
    "structure_type": "Lump sum",
    "line_items": ["Base bid", "Alternate 1 - HVAC upgrades", ...],
    "payment_terms": "Monthly progress payments"
  },
  "prevailing_wage": true,
  "site_conditions": "Federal building in downtown area. Limited parking. Occupied building requires night/weekend work.",
  "questions_flagged": [
    "Clarify whether asbestos testing is included in base bid",
    "Request site visit date",
    ...
  ],
  "fit_score": 85,
  "confidence_level": "high",
  "red_flags": [
    "Requires bonding capacity of $5M (verify C2C's current capacity)",
    ...
  ]
}

IMPORTANT SCORING GUIDELINES:
- fit_score (0-100): How well this matches C2C's capabilities
  - 80-100: Excellent match, core competency
  - 60-79: Good match, can execute with current resources
  - 40-59: Moderate match, may need subcontractors
  - 0-39: Poor match, outside expertise

- confidence_level: Your confidence in the analysis
  - "high": Clear, well-documented solicitation
  - "medium": Some ambiguity or missing details
  - "low": Vague or incomplete documentation

- c2c_status for qualifications:
  - "met": C2C clearly meets this (e.g., standard licenses)
  - "needs_verification": Unclear if C2C meets (e.g., "3 similar projects" - need to verify)
  - "not_met": C2C likely does not meet this

Be thorough but concise. Focus on actionable information. Flag anything that needs clarification or could disqualify the bid.`

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = Date.now()

  try {
    const { document_id, opportunity_id } = await req.json()

    if (!document_id || !opportunity_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: document_id, opportunity_id' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`Processing document ${document_id} for opportunity ${opportunity_id}`)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Update status to processing
    await supabase
      .from('bid_documents')
      .update({ processing_status: 'ocr_processing' })
      .eq('id', document_id)

    // Fetch document info
    const { data: document, error: docError } = await supabase
      .from('bid_documents')
      .select('*')
      .eq('id', document_id)
      .single()

    if (docError || !document) {
      throw new Error(`Document not found: ${docError?.message}`)
    }

    console.log(`Fetching PDF from storage: ${document.file_path}`)

    // Download PDF from storage
    const { data: pdfData, error: downloadError } = await supabase.storage
      .from('bid-documents')
      .download(document.file_path)

    if (downloadError || !pdfData) {
      throw new Error(`Failed to download PDF: ${downloadError?.message}`)
    }

    // Convert PDF to base64 for Claude API
    const pdfBuffer = await pdfData.arrayBuffer()
    const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)))

    console.log(`PDF loaded, size: ${pdfBuffer.byteLength} bytes`)

    // Update status to AI processing
    await supabase
      .from('bid_documents')
      .update({
        processing_status: 'ai_processing',
        ocr_completed_at: new Date().toISOString()
      })
      .eq('id', document_id)

    // Call Claude API with PDF
    console.log('Sending to Claude API for analysis...')

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'document',
                source: {
                  type: 'base64',
                  media_type: 'application/pdf',
                  data: pdfBase64
                }
              },
              {
                type: 'text',
                text: ANALYSIS_PROMPT
              }
            ]
          }
        ]
      })
    })

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text()
      throw new Error(`Claude API error: ${claudeResponse.status} - ${errorText}`)
    }

    const claudeResult = await claudeResponse.json()
    console.log('Received response from Claude API')

    // Extract JSON from Claude's response
    const responseText = claudeResult.content[0].text
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)

    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from Claude response')
    }

    const analysis = JSON.parse(jsonMatch[0])

    console.log(`Analysis complete. Fit score: ${analysis.fit_score}, Confidence: ${analysis.confidence_level}`)

    // Store analysis in database
    const { error: insertError } = await supabase
      .from('bid_analysis')
      .insert({
        opportunity_id: opportunity_id,
        document_id: document_id,
        scope_summary: analysis.scope_summary,
        technical_requirements: analysis.technical_requirements || [],
        submission_requirements: analysis.submission_requirements || [],
        qualifications_required: analysis.qualifications_required || [],
        timeline_schedule: analysis.timeline_schedule || {},
        insurance_bonding: analysis.insurance_bonding || {},
        pricing_structure: analysis.pricing_structure || {},
        prevailing_wage: analysis.prevailing_wage,
        site_conditions: analysis.site_conditions,
        questions_flagged: analysis.questions_flagged || [],
        fit_score: analysis.fit_score,
        confidence_level: analysis.confidence_level,
        red_flags: analysis.red_flags || [],
        raw_ocr_text: responseText, // Store full response for debugging
        processing_time_seconds: Math.round((Date.now() - startTime) / 1000)
      })

    if (insertError) {
      throw new Error(`Failed to save analysis: ${insertError.message}`)
    }

    // Update document status to completed
    await supabase
      .from('bid_documents')
      .update({
        processing_status: 'completed',
        analysis_completed_at: new Date().toISOString()
      })
      .eq('id', document_id)

    // Update opportunity status to reviewed
    await supabase
      .from('opportunities')
      .update({ status: 'reviewed' })
      .eq('id', opportunity_id)

    console.log('Processing complete, triggering notification...')

    // Trigger notification (fire and forget)
    fetch(`${supabaseUrl}/functions/v1/notify-analysis-complete`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ opportunityId: opportunity_id })
    }).catch(err => console.error('Notification failed:', err))

    return new Response(
      JSON.stringify({
        success: true,
        opportunity_id: opportunity_id,
        fit_score: analysis.fit_score,
        confidence_level: analysis.confidence_level,
        processing_time_seconds: Math.round((Date.now() - startTime) / 1000)
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Processing error:', error)

    // Update document status to failed
    if (req.body) {
      try {
        const { document_id } = await req.json()
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        )

        await supabase
          .from('bid_documents')
          .update({
            processing_status: 'failed',
            error_message: error.message
          })
          .eq('id', document_id)

        // Trigger failure notification
        const { opportunity_id } = await req.json()
        fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/notify-processing-failed`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ documentId: document_id, opportunityId: opportunity_id })
        }).catch(err => console.error('Notification failed:', err))
      } catch (updateError) {
        console.error('Failed to update error status:', updateError)
      }
    }

    return new Response(
      JSON.stringify({
        error: 'Processing failed',
        message: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
