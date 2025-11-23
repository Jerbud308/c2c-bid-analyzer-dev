// ============================================================================
// Supabase Edge Function: Opportunities
// ============================================================================
// Handles GET (list/single), PUT (update status), DELETE operations
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ----------------------------------------------------------------------------
// Helper Functions
// ----------------------------------------------------------------------------

function parseQueryParams(url: URL) {
  const params = url.searchParams;

  return {
    status: params.get('status')?.split(',') || [],
    naics_code: params.get('naics_code')?.split(',') || [],
    set_aside_type: params.get('set_aside_type')?.split(',') || [],
    deadline_from: params.get('deadline_from') || null,
    deadline_to: params.get('deadline_to') || null,
    fit_score_min: params.get('fit_score_min') ? parseInt(params.get('fit_score_min')!) : null,
    fit_score_max: params.get('fit_score_max') ? parseInt(params.get('fit_score_max')!) : null,
    search: params.get('search') || null,
    sort: params.get('sort') || 'deadline_date',
    order: params.get('order') || 'asc',
    page: params.get('page') ? parseInt(params.get('page')!) : 1,
    limit: params.get('limit') ? Math.min(parseInt(params.get('limit')!), 100) : 20,
  };
}

// ----------------------------------------------------------------------------
// Main Handler
// ----------------------------------------------------------------------------

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);

    // Extract opportunity ID if present
    const opportunityId = pathParts[pathParts.length - 1] !== 'status'
      ? pathParts[pathParts.length - 1]
      : pathParts[pathParts.length - 2];

    const isStatusUpdate = pathParts[pathParts.length - 1] === 'status';

    // ----------------------------------------------------------------------------
    // GET: List opportunities or get single opportunity
    // ----------------------------------------------------------------------------
    if (req.method === 'GET') {
      // Get single opportunity
      if (opportunityId && opportunityId !== 'opportunities') {
        const { data: opportunity, error } = await supabaseClient
          .from('opportunities')
          .select(`
            *,
            bid_documents(id, processing_status, analysis_completed_at),
            bid_analysis(fit_score, confidence_level)
          `)
          .eq('id', opportunityId)
          .single();

        if (error) throw error;

        return new Response(JSON.stringify(opportunity), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // List opportunities with filters
      const filters = parseQueryParams(url);

      // Build query
      let query = supabaseClient
        .from('opportunities')
        .select(`
          *,
          bid_documents!left(id, processing_status, analysis_completed_at),
          bid_analysis!left(fit_score, confidence_level)
        `, { count: 'exact' });

      // Apply filters
      if (filters.status.length > 0) {
        query = query.in('status', filters.status);
      }

      if (filters.naics_code.length > 0) {
        query = query.in('naics_code', filters.naics_code);
      }

      if (filters.set_aside_type.length > 0) {
        query = query.in('set_aside_type', filters.set_aside_type);
      }

      if (filters.deadline_from) {
        query = query.gte('deadline_date', filters.deadline_from);
      }

      if (filters.deadline_to) {
        query = query.lte('deadline_date', filters.deadline_to);
      }

      // Search across multiple fields
      if (filters.search) {
        query = query.or(
          `title.ilike.%${filters.search}%,` +
          `solicitation_number.ilike.%${filters.search}%,` +
          `agency.ilike.%${filters.search}%`
        );
      }

      // Sorting
      const sortColumn = filters.sort as string;
      const ascending = filters.order === 'asc';
      query = query.order(sortColumn, { ascending });

      // Pagination
      const from = (filters.page - 1) * filters.limit;
      const to = from + filters.limit - 1;
      query = query.range(from, to);

      const { data: opportunities, error, count } = await query;

      if (error) throw error;

      // Process opportunities to flatten nested data
      const processedOpportunities = opportunities?.map((opp: any) => {
        const analysis = Array.isArray(opp.bid_analysis) ? opp.bid_analysis[0] : opp.bid_analysis;
        const document = Array.isArray(opp.bid_documents) ? opp.bid_documents[0] : opp.bid_documents;

        return {
          ...opp,
          fit_score: analysis?.fit_score || null,
          confidence_level: analysis?.confidence_level || null,
          processing_status: document?.processing_status || null,
          analysis_completed: !!document?.analysis_completed_at,
          bid_documents: undefined,
          bid_analysis: undefined,
        };
      }) || [];

      // Filter by fit score if specified
      let filteredOpportunities = processedOpportunities;
      if (filters.fit_score_min !== null || filters.fit_score_max !== null) {
        filteredOpportunities = processedOpportunities.filter((opp: any) => {
          if (opp.fit_score === null) return false;
          if (filters.fit_score_min !== null && opp.fit_score < filters.fit_score_min) return false;
          if (filters.fit_score_max !== null && opp.fit_score > filters.fit_score_max) return false;
          return true;
        });
      }

      // Calculate metrics
      const totalOpportunities = count || 0;

      // Get average fit score (from all opportunities with analysis)
      const { data: avgData } = await supabaseClient
        .from('bid_analysis')
        .select('fit_score');

      const fitScores = avgData?.filter(a => a.fit_score !== null).map(a => a.fit_score) || [];
      const avgFitScore = fitScores.length > 0
        ? fitScores.reduce((sum, score) => sum + score, 0) / fitScores.length
        : 0;

      // Get urgent count (deadlines in next 7 days)
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      const { count: urgentCount } = await supabaseClient
        .from('opportunities')
        .select('*', { count: 'exact', head: true })
        .gte('deadline_date', new Date().toISOString().split('T')[0])
        .lte('deadline_date', sevenDaysFromNow.toISOString().split('T')[0]);

      const response = {
        opportunities: filteredOpportunities,
        total_count: totalOpportunities,
        page: filters.page,
        limit: filters.limit,
        metrics: {
          total: totalOpportunities,
          avg_fit_score: Math.round(avgFitScore * 10) / 10,
          urgent_count: urgentCount || 0,
        },
      };

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ----------------------------------------------------------------------------
    // PUT: Update opportunity status
    // ----------------------------------------------------------------------------
    if (req.method === 'PUT' && isStatusUpdate) {
      const { status } = await req.json();

      if (!status) {
        throw new Error('Status is required');
      }

      const { data, error } = await supabaseClient
        .from('opportunities')
        .update({ status })
        .eq('id', opportunityId)
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ----------------------------------------------------------------------------
    // DELETE: Delete opportunity
    // ----------------------------------------------------------------------------
    if (req.method === 'DELETE') {
      const { error } = await supabaseClient
        .from('opportunities')
        .delete()
        .eq('id', opportunityId);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Method not allowed
    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders,
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ message: error.message || 'Internal server error' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
