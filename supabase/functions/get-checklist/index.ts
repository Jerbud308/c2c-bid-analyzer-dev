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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Get opportunity_id from query params
    const url = new URL(req.url)
    const opportunityId = url.searchParams.get('opportunity_id')

    if (!opportunityId) {
      return new Response(
        JSON.stringify({ error: 'opportunity_id query parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch checklist
    const { data: checklist, error } = await supabaseClient
      .from('compliance_checklists')
      .select('*')
      .eq('opportunity_id', opportunityId)
      .single()

    if (error || !checklist) {
      return new Response(
        JSON.stringify({ error: 'Checklist not found for this opportunity' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Sort items by category, then status (incomplete first)
    const categoryOrder = ['Administrative', 'Technical', 'Qualifications', 'Pricing', 'Certifications', 'Insurance']
    const statusOrder = { 'not_started': 0, 'in_progress': 1, 'complete': 2 }

    const sortItems = (items: any[]) => {
      return [...items].sort((a, b) => {
        // First sort by category
        const categoryDiff = categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category)
        if (categoryDiff !== 0) return categoryDiff

        // Then sort by status
        return statusOrder[a.status] - statusOrder[b.status]
      })
    }

    const sortedItems = sortItems(checklist.items || [])
    const sortedCustomItems = sortItems(checklist.custom_items || [])

    return new Response(
      JSON.stringify({
        checklist_id: checklist.id,
        opportunity_id: checklist.opportunity_id,
        items: sortedItems,
        custom_items: sortedCustomItems,
        completion_percentage: checklist.completion_percentage,
        generated_at: checklist.generated_at,
        last_updated: checklist.last_updated,
      }),
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
