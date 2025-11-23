// ============================================================================
// Supabase Edge Function: check-status
// ============================================================================
// Returns the processing status of an uploaded bid document
// Used for polling during document processing
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Calculate completion percentage based on processing status
 */
function getCompletionPercent(status: string): number {
  const statusMap: Record<string, number> = {
    'pending': 0,
    'ocr_processing': 25,
    'ocr_completed': 50,
    'ai_processing': 75,
    'completed': 100,
    'failed': 0
  }
  return statusMap[status] ?? 0
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

    // Query document(s) for this opportunity
    const { data: documents, error: documentsError } = await supabase
      .from('bid_documents')
      .select('*')
      .eq('opportunity_id', opportunityId)
      .order('upload_date', { ascending: false })

    if (documentsError) {
      console.error('Database error:', documentsError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch document status' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!documents || documents.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Opportunity not found or no documents uploaded' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get the most recent document
    const document = documents[0]

    // Check if analysis exists
    const { data: analysis } = await supabase
      .from('bid_analysis')
      .select('id, analysis_timestamp')
      .eq('document_id', document.id)
      .single()

    const analysisCompleted = !!analysis
    const ocrCompleted = ['ocr_completed', 'ai_processing', 'completed'].includes(document.processing_status)
    const readyForReview = document.processing_status === 'completed' && analysisCompleted

    // Build status response
    const statusResponse = {
      opportunity_id: opportunityId,
      processing_status: document.processing_status,
      completion_percent: getCompletionPercent(document.processing_status),
      ocr_completed: ocrCompleted,
      analysis_completed: analysisCompleted,
      page_count: document.page_count,
      error_message: document.error_message,
      ready_for_review: readyForReview
    }

    console.log('Status check:', {
      opportunityId,
      status: document.processing_status,
      readyForReview
    })

    return new Response(
      JSON.stringify(statusResponse),
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
