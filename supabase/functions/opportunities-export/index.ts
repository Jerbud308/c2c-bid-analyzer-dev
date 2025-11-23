// ============================================================================
// Supabase Edge Function: Opportunities Export
// ============================================================================
// Exports opportunities to CSV or Excel format
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
    format: params.get('format') || 'csv',
  };
}

function escapeCSV(value: any): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatCurrency(value: number | null): string {
  if (value === null) return '';
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US');
}

function generateCSV(opportunities: any[]): string {
  // CSV Header
  const headers = [
    'Solicitation Number',
    'Title',
    'Agency',
    'Location',
    'NAICS Code',
    'Set-Aside Type',
    'Posted Date',
    'Deadline',
    'Estimated Value',
    'Fit Score',
    'Status',
  ];

  const rows = opportunities.map((opp) => [
    opp.solicitation_number || '',
    opp.title || '',
    opp.agency || '',
    opp.location || '',
    opp.naics_code || '',
    opp.set_aside_type || '',
    formatDate(opp.posted_date),
    formatDate(opp.deadline_date),
    formatCurrency(opp.estimated_value),
    opp.fit_score || '',
    opp.status || '',
  ]);

  // Build CSV
  const csvLines = [
    headers.map(escapeCSV).join(','),
    ...rows.map(row => row.map(escapeCSV).join(','))
  ];

  return csvLines.join('\n');
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
    const filters = parseQueryParams(url);

    // ----------------------------------------------------------------------------
    // GET: Export opportunities
    // ----------------------------------------------------------------------------
    if (req.method === 'GET') {
      // Build query (same as list endpoint, but without pagination)
      let query = supabaseClient
        .from('opportunities')
        .select(`
          *,
          bid_analysis!left(fit_score, confidence_level)
        `);

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

      // Search
      if (filters.search) {
        query = query.or(
          `title.ilike.%${filters.search}%,` +
          `solicitation_number.ilike.%${filters.search}%,` +
          `agency.ilike.%${filters.search}%`
        );
      }

      // Order by deadline
      query = query.order('deadline_date', { ascending: true });

      const { data: opportunities, error } = await query;

      if (error) throw error;

      // Process opportunities
      const processedOpportunities = opportunities?.map((opp: any) => {
        const analysis = Array.isArray(opp.bid_analysis) ? opp.bid_analysis[0] : opp.bid_analysis;
        return {
          ...opp,
          fit_score: analysis?.fit_score || null,
          confidence_level: analysis?.confidence_level || null,
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

      // Generate file based on format
      if (filters.format === 'csv') {
        const csv = generateCSV(filteredOpportunities);
        const filename = `opportunities-${new Date().toISOString().split('T')[0]}.csv`;

        return new Response(csv, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="${filename}"`,
          },
        });
      } else if (filters.format === 'excel') {
        // For Excel, we'd use a library like xlsx
        // For now, return CSV with xlsx extension
        const csv = generateCSV(filteredOpportunities);
        const filename = `opportunities-${new Date().toISOString().split('T')[0]}.csv`;

        return new Response(csv, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/vnd.ms-excel',
            'Content-Disposition': `attachment; filename="${filename}"`,
          },
        });
      } else {
        throw new Error('Invalid format. Must be csv or excel');
      }
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
