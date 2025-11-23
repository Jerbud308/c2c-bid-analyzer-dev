import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders, type CheckStatusResponse, type ErrorResponse } from '../_shared/types.ts';

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

    // Fetch latest bid_documents record for this opportunity
    const { data: document, error: fetchError } = await supabase
      .from('bid_documents')
      .select('*')
      .eq('opportunity_id', opportunityId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !document) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: 'No document found for this opportunity',
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate completion percentage
    let completionPercent = 0;
    switch (document.processing_status) {
      case 'pending':
        completionPercent = 0;
        break;
      case 'ocr_processing':
        completionPercent = 25;
        break;
      case 'ocr_completed':
      case 'ai_processing':
        completionPercent = 50;
        break;
      case 'completed':
        completionPercent = 100;
        break;
      case 'failed':
        completionPercent = 0;
        break;
    }

    // Prepare response
    const response: CheckStatusResponse = {
      opportunity_id: opportunityId,
      processing_status: document.processing_status,
      completion_percent: completionPercent,
      ocr_completed: document.ocr_completed_at !== null,
      analysis_completed: document.analysis_completed_at !== null,
      page_count: document.page_count,
      error_message: document.error_message,
      ready_for_review: document.processing_status === 'completed',
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
