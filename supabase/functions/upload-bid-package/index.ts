// ============================================================================
// Supabase Edge Function: upload-bid-package
// ============================================================================
// Handles PDF upload for government bid packages
// - Validates file type and size
// - Stores PDF in Supabase Storage
// - Creates opportunity and document records
// - Triggers async processing
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Parse multipart form data
    const formData = await req.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string || null
    const agency = formData.get('agency') as string || null
    const solicitationNumber = formData.get('solicitation_number') as string || null
    const deadlineDate = formData.get('deadline_date') as string || null
    const naicsCode = formData.get('naics_code') as string || null
    const setAsideType = formData.get('set_aside_type') as string || null
    const location = formData.get('location') as string || null
    const estimatedValue = formData.get('estimated_value') as string || null

    // Validate file exists
    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Validate file type (PDF only)
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return new Response(
        JSON.stringify({ error: 'Only PDF files are allowed' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({
          error: `File size exceeds maximum of ${MAX_FILE_SIZE / (1024 * 1024)}MB`
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`Uploading file: ${file.name} (${file.size} bytes)`)

    // Generate unique file path
    const timestamp = Date.now()
    const randomId = crypto.randomUUID()
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const storagePath = `${timestamp}-${randomId}-${sanitizedFileName}`

    // Upload to Supabase Storage
    const fileBuffer = await file.arrayBuffer()
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('bid-documents')
      .upload(storagePath, fileBuffer, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return new Response(
        JSON.stringify({ error: `Failed to upload file: ${uploadError.message}` }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('File uploaded to storage:', uploadData.path)

    // Create opportunity record
    const { data: opportunity, error: opportunityError } = await supabase
      .from('opportunities')
      .insert({
        title: title || `Bid Package - ${file.name}`,
        solicitation_number: solicitationNumber,
        agency: agency,
        naics_code: naicsCode,
        set_aside_type: setAsideType,
        location: location,
        deadline_date: deadlineDate,
        estimated_value: estimatedValue ? parseFloat(estimatedValue) : null,
        status: 'analyzing'
      })
      .select()
      .single()

    if (opportunityError) {
      console.error('Database error creating opportunity:', opportunityError)

      // Clean up uploaded file
      await supabase.storage.from('bid-documents').remove([storagePath])

      return new Response(
        JSON.stringify({ error: `Failed to create opportunity: ${opportunityError.message}` }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Opportunity created:', opportunity.id)

    // Create bid_documents record
    const { data: document, error: documentError } = await supabase
      .from('bid_documents')
      .insert({
        opportunity_id: opportunity.id,
        file_name: file.name,
        file_path: storagePath,
        file_size: file.size,
        mime_type: file.type,
        processing_status: 'pending'
      })
      .select()
      .single()

    if (documentError) {
      console.error('Database error creating document:', documentError)

      // Clean up
      await supabase.storage.from('bid-documents').remove([storagePath])
      await supabase.from('opportunities').delete().eq('id', opportunity.id)

      return new Response(
        JSON.stringify({ error: `Failed to create document record: ${documentError.message}` }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Document record created:', document.id)

    // Trigger async processing (fire and forget)
    fetch(`${supabaseUrl}/functions/v1/process-document`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        document_id: document.id,
        opportunity_id: opportunity.id
      })
    }).catch(err => {
      console.error('Failed to trigger processing:', err)
      // Don't fail the upload if processing trigger fails
      // Processing can be retried manually
    })

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        opportunity_id: opportunity.id,
        document_id: document.id,
        status: 'pending',
        message: 'File uploaded successfully. Processing will begin shortly.'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
