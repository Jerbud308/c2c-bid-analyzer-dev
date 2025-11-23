/**
 * Templates Approve Edge Function
 * Handles template approval workflow
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
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
    const templateId = pathParts[pathParts.length - 1];

    if (!templateId || templateId === 'templates-approve') {
      return new Response(
        JSON.stringify({ error: 'Template ID required in URL path' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { approver } = body;

    if (!approver) {
      return new Response(
        JSON.stringify({ error: 'Approver name required in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // TODO: In production, add authorization check
    // Only Phil or designated approvers should be able to approve
    // const allowedApprovers = ['Phil', 'phil@c2crestoration.com'];
    // if (!allowedApprovers.includes(approver)) {
    //   return new Response(
    //     JSON.stringify({ error: 'Unauthorized: Only designated approvers can approve templates' }),
    //     { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    //   );
    // }

    // Update template status to approved
    const { data, error } = await supabaseClient
      .from('templates')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: approver,
      })
      .eq('id', templateId)
      .select()
      .single();

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!data) {
      return new Response(
        JSON.stringify({ error: 'Template not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Template approved by ${approver}`,
        template: data,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
