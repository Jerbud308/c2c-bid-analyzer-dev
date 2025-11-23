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

    // Support both POST body and DELETE with query params
    let checklist_id: string | null = null
    let item_id: string | null = null

    if (req.method === 'DELETE') {
      const url = new URL(req.url)
      checklist_id = url.searchParams.get('checklist_id')
      item_id = url.searchParams.get('item_id')
    } else {
      const body = await req.json()
      checklist_id = body.checklist_id
      item_id = body.item_id
    }

    if (!checklist_id || !item_id) {
      return new Response(
        JSON.stringify({ error: 'checklist_id and item_id are required' }),
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

    // Remove item from custom_items
    const customItems = (checklist.custom_items || []).filter((item: any) => item.id !== item_id)

    // Check if item was found and removed
    if (customItems.length === (checklist.custom_items || []).length) {
      return new Response(
        JSON.stringify({ error: 'Custom item not found in checklist' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Recalculate completion percentage
    const allItems = [...(checklist.items || []), ...customItems]
    const completedItems = allItems.filter((item: any) => item.status === 'complete').length
    const completionPercentage = allItems.length > 0
      ? Math.round((completedItems / allItems.length) * 100)
      : 0

    // Update the checklist
    const { error: updateError } = await supabaseClient
      .from('compliance_checklists')
      .update({
        custom_items: customItems,
        completion_percentage: completionPercentage,
        last_updated: new Date().toISOString(),
      })
      .eq('id', checklist_id)

    if (updateError) {
      console.error('Update error:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to delete custom item', details: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, completion_percentage: completionPercentage }),
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
