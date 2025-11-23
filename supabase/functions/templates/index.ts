/**
 * Templates Edge Function
 * Handles CRUD operations for bid response templates
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Extracts variables from template content
 */
function extractVariables(content: string): string[] {
  const variableRegex = /\{([A-Z_][A-Z0-9_]*)\}/g;
  const matches = content.matchAll(variableRegex);
  const variables = new Set<string>();

  for (const match of matches) {
    variables.add(match[1]);
  }

  return Array.from(variables).sort();
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
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

    // ========================================================================
    // GET: List templates or get single template
    // ========================================================================
    if (req.method === 'GET') {
      // Single template by ID
      if (templateId && templateId !== 'templates') {
        const { data, error } = await supabaseClient
          .from('templates')
          .select('*')
          .eq('id', templateId)
          .single();

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify(data),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // List templates with filters
      const category = url.searchParams.get('category');
      const status = url.searchParams.get('status') || 'approved';
      const tagsParam = url.searchParams.get('tags');
      const search = url.searchParams.get('search');

      let query = supabaseClient.from('templates').select('*');

      // Apply filters
      if (category) {
        query = query.eq('category', category);
      }

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      if (tagsParam) {
        const tags = tagsParam.split(',').map(t => t.trim());
        query = query.overlaps('tags', tags);
      }

      if (search) {
        query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
      }

      // Sort by usage count and updated date
      query = query.order('usage_count', { ascending: false })
                   .order('updated_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify(data || []),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========================================================================
    // POST: Create new template
    // ========================================================================
    if (req.method === 'POST') {
      const body = await req.json();
      const { title, category, content, tags, status, created_by } = body;

      // Validate required fields
      if (!title || !category || !content) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: title, category, content' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Extract variables from content
      const variables = extractVariables(content);

      // Insert template
      const { data, error } = await supabaseClient
        .from('templates')
        .insert({
          title,
          category,
          content,
          variables,
          tags: tags || [],
          status: status || 'draft',
          created_by,
          version: 1,
        })
        .select()
        .single();

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify(data),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========================================================================
    // PUT: Update existing template
    // ========================================================================
    if (req.method === 'PUT') {
      if (!templateId || templateId === 'templates') {
        return new Response(
          JSON.stringify({ error: 'Template ID required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const body = await req.json();
      const { title, category, content, tags, status, change_notes, created_by } = body;

      // Fetch current template to create version snapshot
      const { data: currentTemplate, error: fetchError } = await supabaseClient
        .from('templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (fetchError || !currentTemplate) {
        return new Response(
          JSON.stringify({ error: 'Template not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create version snapshot before updating
      await supabaseClient
        .from('template_versions')
        .insert({
          template_id: templateId,
          version: currentTemplate.version,
          content: currentTemplate.content,
          variables: currentTemplate.variables,
          created_by,
          change_notes,
        });

      // Prepare update object
      const updates: any = {
        version: currentTemplate.version + 1,
      };

      if (title !== undefined) updates.title = title;
      if (category !== undefined) updates.category = category;
      if (tags !== undefined) updates.tags = tags;
      if (status !== undefined) updates.status = status;

      // If content changed, re-extract variables
      if (content !== undefined) {
        updates.content = content;
        updates.variables = extractVariables(content);
      }

      // Update template
      const { data, error } = await supabaseClient
        .from('templates')
        .update(updates)
        .eq('id', templateId)
        .select()
        .single();

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify(data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========================================================================
    // DELETE: Archive template (soft delete)
    // ========================================================================
    if (req.method === 'DELETE') {
      if (!templateId || templateId === 'templates') {
        return new Response(
          JSON.stringify({ error: 'Template ID required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error } = await supabaseClient
        .from('templates')
        .update({ status: 'archived' })
        .eq('id', templateId);

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Method not allowed
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
