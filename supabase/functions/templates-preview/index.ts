/**
 * Templates Preview Edge Function
 * Renders template content with variable substitution
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Replaces variable placeholders with provided values
 */
function replaceVariables(
  content: string,
  values: Record<string, string>,
  showMissing = true
): string {
  return content.replace(/\{([A-Z_][A-Z0-9_]*)\}/g, (match, varName) => {
    if (values[varName] !== undefined && values[varName] !== null) {
      return values[varName];
    }

    // Show placeholder for missing variables
    return showMissing ? `[MISSING: ${varName}]` : match;
  });
}

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

    if (!templateId || templateId === 'templates-preview') {
      return new Response(
        JSON.stringify({ error: 'Template ID required in URL path' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { variables, show_missing = true } = body;

    if (!variables || typeof variables !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Variables object required in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch template
    const { data: template, error } = await supabaseClient
      .from('templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (error || !template) {
      return new Response(
        JSON.stringify({ error: 'Template not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Replace variables in content
    const processedContent = replaceVariables(
      template.content,
      variables,
      show_missing
    );

    // Check for missing variables
    const missingVariables = template.variables.filter(
      (varName: string) => !variables[varName] || variables[varName].trim() === ''
    );

    return new Response(
      JSON.stringify({
        template_id: templateId,
        template_title: template.title,
        original_content: template.content,
        processed_content: processedContent,
        variables_used: template.variables,
        variables_provided: Object.keys(variables),
        missing_variables: missingVariables,
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
