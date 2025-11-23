import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
// Note: For PDF/Excel generation, libraries will be imported dynamically when needed

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

    // Get checklist_id and format from query params
    const url = new URL(req.url)
    const checklistId = url.searchParams.get('checklist_id')
    const format = url.searchParams.get('format') || 'pdf'

    if (!checklistId) {
      return new Response(
        JSON.stringify({ error: 'checklist_id query parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!['pdf', 'excel'].includes(format)) {
      return new Response(
        JSON.stringify({ error: 'format must be either "pdf" or "excel"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch checklist and opportunity details
    const { data: checklist, error: checklistError } = await supabaseClient
      .from('compliance_checklists')
      .select('*, opportunities!inner(solicitation_number, title)')
      .eq('id', checklistId)
      .single()

    if (checklistError || !checklist) {
      return new Response(
        JSON.stringify({ error: 'Checklist not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const allItems = [...(checklist.items || []), ...(checklist.custom_items || [])]
    const opportunity = (checklist as any).opportunities

    if (format === 'excel') {
      return await generateExcel(allItems, opportunity, checklist)
    } else {
      return await generatePDF(allItems, opportunity, checklist)
    }

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function generateExcel(items: any[], opportunity: any, checklist: any) {
  // For Excel export, we'll generate a CSV which is simpler and works well
  // Group items by category
  const categories = ['Administrative', 'Technical', 'Qualifications', 'Pricing', 'Certifications', 'Insurance']

  let csv = 'Compliance Checklist Export\n'
  csv += `Opportunity: ${opportunity.title}\n`
  csv += `Solicitation Number: ${opportunity.solicitation_number}\n`
  csv += `Generated: ${new Date(checklist.generated_at).toLocaleDateString()}\n`
  csv += `Completion: ${checklist.completion_percentage}%\n\n`

  categories.forEach(category => {
    const categoryItems = items.filter((item: any) => item.category === category)
    if (categoryItems.length > 0) {
      csv += `\n${category}\n`
      csv += 'Status,Description,Reference,Assigned To,Notes\n'

      categoryItems.forEach((item: any) => {
        const status = item.status.replace('_', ' ').toUpperCase()
        const description = `"${(item.description || '').replace(/"/g, '""')}"`
        const reference = `"${(item.reference_section || '').replace(/"/g, '""')}"`
        const assignedTo = item.responsible_party || 'Unassigned'
        const notes = `"${(item.notes || '').replace(/"/g, '""')}"`

        csv += `${status},${description},${reference},${assignedTo},${notes}\n`
      })
    }
  })

  const encoder = new TextEncoder()
  const csvData = encoder.encode(csv)

  return new Response(csvData, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="compliance-checklist-${opportunity.solicitation_number || 'export'}.csv"`,
    },
  })
}

async function generatePDF(items: any[], opportunity: any, checklist: any) {
  // For PDF, we'll generate a simple HTML that can be printed as PDF
  // In a production environment, you'd use jsPDF or similar

  const categories = ['Administrative', 'Technical', 'Qualifications', 'Pricing', 'Certifications', 'Insurance']
  const statusColors = {
    'complete': '#22c55e',
    'in_progress': '#f97316',
    'not_started': '#94a3b8'
  }

  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Compliance Checklist - ${opportunity.title}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 40px;
      color: #1e293b;
    }
    .header {
      border-bottom: 3px solid #3b82f6;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    h1 {
      margin: 0;
      color: #1e40af;
    }
    .meta {
      margin-top: 10px;
      color: #64748b;
    }
    .category {
      margin-top: 30px;
      page-break-inside: avoid;
    }
    .category-header {
      background: #f1f5f9;
      padding: 10px 15px;
      font-weight: bold;
      font-size: 16px;
      border-left: 4px solid #3b82f6;
      margin-bottom: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th {
      background: #e2e8f0;
      padding: 8px;
      text-align: left;
      font-size: 12px;
      border-bottom: 2px solid #cbd5e1;
    }
    td {
      padding: 8px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 11px;
    }
    .status-badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 4px;
      color: white;
      font-size: 10px;
      font-weight: bold;
      text-transform: uppercase;
    }
    @media print {
      body { margin: 20px; }
      .category { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Compliance Checklist</h1>
    <div class="meta">
      <div><strong>Opportunity:</strong> ${opportunity.title}</div>
      <div><strong>Solicitation Number:</strong> ${opportunity.solicitation_number || 'N/A'}</div>
      <div><strong>Generated:</strong> ${new Date(checklist.generated_at).toLocaleDateString()}</div>
      <div><strong>Completion:</strong> ${checklist.completion_percentage}% (${items.filter((i: any) => i.status === 'complete').length} of ${items.length} items)</div>
    </div>
  </div>
`

  categories.forEach(category => {
    const categoryItems = items.filter((item: any) => item.category === category)
    if (categoryItems.length > 0) {
      html += `
  <div class="category">
    <div class="category-header">${category}</div>
    <table>
      <thead>
        <tr>
          <th width="10%">Status</th>
          <th width="45%">Description</th>
          <th width="15%">Reference</th>
          <th width="15%">Assigned To</th>
          <th width="15%">Notes</th>
        </tr>
      </thead>
      <tbody>
`
      categoryItems.forEach((item: any) => {
        const statusText = item.status.replace('_', ' ')
        const statusColor = statusColors[item.status as keyof typeof statusColors] || '#94a3b8'
        html += `
        <tr>
          <td><span class="status-badge" style="background: ${statusColor}">${statusText}</span></td>
          <td>${item.description || ''}</td>
          <td>${item.reference_section || '-'}</td>
          <td>${item.responsible_party || 'Unassigned'}</td>
          <td>${item.notes || '-'}</td>
        </tr>
`
      })
      html += `
      </tbody>
    </table>
  </div>
`
    }
  })

  html += `
</body>
</html>
`

  return new Response(html, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/html',
      'Content-Disposition': `inline; filename="compliance-checklist-${opportunity.solicitation_number || 'export'}.html"`,
    },
  })
}
