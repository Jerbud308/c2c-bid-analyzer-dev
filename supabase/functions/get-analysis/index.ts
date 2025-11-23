// ============================================================================
// Supabase Edge Function: get-analysis
// ============================================================================
// Returns the complete AI analysis for a processed bid document
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get opportunity_id from query params
    const url = new URL(req.url)
    const opportunityId = url.searchParams.get('opportunity_id')

    if (!opportunityId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: opportunity_id' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Query opportunity
    const { data: opportunity, error: opportunityError } = await supabase
      .from('opportunities')
      .select('*')
      .eq('id', opportunityId)
      .single()

    if (opportunityError || !opportunity) {
      console.error('Opportunity not found:', opportunityError)
      return new Response(
        JSON.stringify({ error: 'Opportunity not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Query document(s) for this opportunity
    const { data: documents, error: documentsError } = await supabase
      .from('bid_documents')
      .select('*')
      .eq('opportunity_id', opportunityId)
      .order('upload_date', { ascending: false })

    if (documentsError || !documents || documents.length === 0) {
      console.error('Document not found:', documentsError)
      return new Response(
        JSON.stringify({ error: 'No documents found for this opportunity' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const document = documents[0]

    // Check if document processing is complete
    if (document.processing_status !== 'completed') {
      return new Response(
        JSON.stringify({
          error: 'Analysis not ready yet',
          current_status: document.processing_status,
          message: 'Document is still being processed. Please check status and try again later.'
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Query analysis (exclude raw_ocr_text to reduce response size)
    const { data: analysis, error: analysisError } = await supabase
      .from('bid_analysis')
      .select(`
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
        analysis_timestamp,
        processing_time_seconds
      `)
      .eq('document_id', document.id)
      .single()

    if (analysisError || !analysis) {
      console.error('Analysis not found:', analysisError)
      return new Response(
        JSON.stringify({
          error: 'Analysis not found',
          message: 'Document processed but analysis data is missing. Please contact support.'
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Build response
    const response = {
      opportunity: opportunity,
      analysis: analysis,
      processing_metadata: {
        file_name: document.file_name,
        page_count: document.page_count || 0,
        processing_time_seconds: analysis.processing_time_seconds || 0,
        analyzed_at: analysis.analysis_timestamp
      }
    }

    console.log('Analysis retrieved:', {
      opportunityId,
      fitScore: analysis.fit_score,
      confidence: analysis.confidence_level
    })

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
