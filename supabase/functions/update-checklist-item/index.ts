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

    const { checklist_id, item_id, updates } = await req.json()

    if (!checklist_id || !item_id || !updates) {
      return new Response(
        JSON.stringify({ error: 'checklist_id, item_id, and updates are required' }),
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

    // Find and update the item in items or custom_items
    let items = [...(checklist.items || [])]
    let customItems = [...(checklist.custom_items || [])]
    let found = false

    // Try to find in regular items
    const itemIndex = items.findIndex((item: any) => item.id === item_id)
    if (itemIndex !== -1) {
      found = true
      items[itemIndex] = { ...items[itemIndex], ...updates }

      // If status changed to complete, set completed_at
      if (updates.status === 'complete' && !items[itemIndex].completed_at) {
        items[itemIndex].completed_at = new Date().toISOString()
      }

      // If status changed from complete, clear completed_at
      if (updates.status !== 'complete' && items[itemIndex].completed_at) {
        items[itemIndex].completed_at = null
      }
    } else {
      // Try to find in custom items
      const customIndex = customItems.findIndex((item: any) => item.id === item_id)
      if (customIndex !== -1) {
        found = true
        customItems[customIndex] = { ...customItems[customIndex], ...updates }

        // If status changed to complete, set completed_at
        if (updates.status === 'complete' && !customItems[customIndex].completed_at) {
          customItems[customIndex].completed_at = new Date().toISOString()
        }

        // If status changed from complete, clear completed_at
        if (updates.status !== 'complete' && customItems[customIndex].completed_at) {
          customItems[customIndex].completed_at = null
        }
      }
    }

    if (!found) {
      return new Response(
        JSON.stringify({ error: 'Item not found in checklist' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Recalculate completion percentage
    const allItems = [...items, ...customItems]
    const completedItems = allItems.filter((item: any) => item.status === 'complete').length
    const completionPercentage = allItems.length > 0
      ? Math.round((completedItems / allItems.length) * 100)
      : 0

    // Update the checklist
    const { error: updateError } = await supabaseClient
      .from('compliance_checklists')
      .update({
        items: items,
        custom_items: customItems,
        completion_percentage: completionPercentage,
        last_updated: new Date().toISOString(),
      })
      .eq('id', checklist_id)

    if (updateError) {
      console.error('Update error:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update checklist', details: updateError.message }),
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
