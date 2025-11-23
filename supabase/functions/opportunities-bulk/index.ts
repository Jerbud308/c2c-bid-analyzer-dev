// ============================================================================
// Supabase Edge Function: Opportunities Bulk Operations
// ============================================================================
// Handles bulk status updates for multiple opportunities
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // ----------------------------------------------------------------------------
    // PUT: Bulk update status
    // ----------------------------------------------------------------------------
    if (req.method === 'PUT') {
      const { opportunity_ids, status } = await req.json();

      // Validate input
      if (!Array.isArray(opportunity_ids) || opportunity_ids.length === 0) {
        throw new Error('opportunity_ids must be a non-empty array');
      }

      if (!status) {
        throw new Error('status is required');
      }

      // Validate status
      const validStatuses = ['new', 'analyzing', 'reviewed', 'bidding', 'submitted', 'won', 'lost', 'pass'];
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }

      // Update all opportunities
      const { data, error, count } = await supabaseClient
        .from('opportunities')
        .update({ status })
        .in('id', opportunity_ids)
        .select();

      if (error) throw error;

      return new Response(
        JSON.stringify({
          success: true,
          updated_count: count || data?.length || 0,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
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
