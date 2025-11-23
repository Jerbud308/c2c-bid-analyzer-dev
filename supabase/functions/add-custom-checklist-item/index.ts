import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    const { checklist_id, category, description, responsible_party } = await req.json()

    if (!checklist_id || !category || !description) {
      return new Response(
        JSON.stringify({ error: 'checklist_id, category, and description are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate category
    const validCategories = ['Administrative', 'Technical', 'Qualifications', 'Pricing', 'Certifications', 'Insurance']
    if (!validCategories.includes(category)) {
      return new Response(
        JSON.stringify({ error: `Invalid category. Must be one of: ${validCategories.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch current checklist
    const { data: checklist, error: fetchError } = await supabaseClient
      .from('compliance_checklists')
      .select('*')
      .eq('id', checklist_id)
      .single()

    if (fetchError || !checklist) {
      return new Response(
        JSON.stringify({ error: 'Checklist not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create new custom item
    const newItem = {
      id: crypto.randomUUID(),
      category,
      description,
      reference_section: null,
      status: 'not_started',
      responsible_party: responsible_party || null,
      notes: null,
      source: 'custom',
      created_at: new Date().toISOString(),
      completed_at: null,
    }

    // Add to custom_items array
    const customItems = [...(checklist.custom_items || []), newItem]

    // Update the checklist
    const { error: updateError } = await supabaseClient
      .from('compliance_checklists')
      .update({
        custom_items: customItems,
        last_updated: new Date().toISOString(),
      })
      .eq('id', checklist_id)

    if (updateError) {
      console.error('Update error:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to add custom item', details: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, item_id: newItem.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
