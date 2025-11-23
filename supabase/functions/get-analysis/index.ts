import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders, type GetAnalysisResponse, type ErrorResponse } from '../_shared/types.ts';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get query parameters
    const url = new URL(req.url);
    const opportunityId = url.searchParams.get('opportunity_id');

    if (!opportunityId) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: 'Missing required query parameter: opportunity_id',
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch opportunity details
    const { data: opportunity, error: oppError } = await supabase
      .from('opportunities')
      .select('*')
      .eq('id', opportunityId)
      .single();

    if (oppError || !opportunity) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: 'Opportunity not found',
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch latest bid document
    const { data: document, error: docError } = await supabase
      .from('bid_documents')
      .select('*')
      .eq('opportunity_id', opportunityId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (docError || !document) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: 'No document found for this opportunity',
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if analysis is ready
    if (document.processing_status !== 'completed') {
      const errorResponse: ErrorResponse = {
        success: false,
        error: `Analysis not ready yet. Current status: ${document.processing_status}`,
        details: 'Use check-status endpoint to poll for completion',
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch analysis (exclude raw_ocr_text)
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
        created_at,
        updated_at
      `)
      .eq('document_id', document.id)
      .single();

    if (analysisError || !analysis) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: 'Analysis data not found',
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate processing time
    let processingTimeSeconds: number | undefined;
    if (document.created_at && document.analysis_completed_at) {
      const start = new Date(document.created_at).getTime();
      const end = new Date(document.analysis_completed_at).getTime();
      processingTimeSeconds = Math.round((end - start) / 1000);
    }

    // Prepare response
    const response: GetAnalysisResponse = {
      opportunity,
      analysis,
      processing_metadata: {
        file_name: document.file_name,
        page_count: document.page_count,
        processing_time_seconds: processingTimeSeconds,
        analyzed_at: document.analysis_completed_at,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorResponse: ErrorResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      details: error instanceof Error ? error.stack : undefined,
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
