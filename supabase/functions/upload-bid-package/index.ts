import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders, type UploadBidResponse, type ErrorResponse } from '../_shared/types.ts';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const solicitationNumber = formData.get('solicitation_number') as string;
    const title = formData.get('title') as string;
    const agency = formData.get('agency') as string;
    const dueDate = formData.get('due_date') as string | null;
    const location = formData.get('location') as string | null;
    const naicsCodes = formData.get('naics_codes') as string | null;
    const setAside = formData.get('set_aside') as string | null;
    const url = formData.get('url') as string | null;

    // Validate required fields
    if (!file || !solicitationNumber || !title || !agency) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: 'Missing required fields: file, solicitation_number, title, agency',
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate file is PDF
    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: 'File must be a PDF',
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse NAICS codes if provided
    const naicsArray = naicsCodes ? JSON.parse(naicsCodes) : null;

    // Create or update opportunity record
    const { data: opportunity, error: oppError } = await supabase
      .from('opportunities')
      .upsert({
        solicitation_number: solicitationNumber,
        title,
        agency,
        due_date: dueDate,
        location,
        naics_codes: naicsArray,
        set_aside: setAside,
        url,
        status: 'new',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'solicitation_number',
      })
      .select()
      .single();

    if (oppError) {
      throw new Error(`Failed to create opportunity: ${oppError.message}`);
    }

    const opportunityId = opportunity.id;
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `${opportunityId}/${timestamp}_${sanitizedFileName}`;

    // Upload PDF to Supabase Storage
    const fileBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from('bid-documents')
      .upload(storagePath, fileBuffer, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }

    // Create bid_documents record
    const { data: document, error: docError } = await supabase
      .from('bid_documents')
      .insert({
        opportunity_id: opportunityId,
        file_name: file.name,
        file_path: storagePath,
        file_size: file.size,
        processing_status: 'pending',
      })
      .select()
      .single();

    if (docError) {
      throw new Error(`Failed to create document record: ${docError.message}`);
    }

    const documentId = document.id;

    // Trigger OCR processor asynchronously (don't await)
    const ocrUrl = `${supabaseUrl}/functions/v1/ocr-processor`;
    fetch(ocrUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        documentId,
        opportunityId,
        filePath: storagePath,
      }),
    }).catch((error) => {
      // Log error but don't block response
      console.error('Failed to trigger OCR processor:', error);
    });

    // Return success response
    const response: UploadBidResponse = {
      success: true,
      opportunity_id: opportunityId,
      document_id: documentId,
      status: 'processing',
      message: 'Bid package uploaded successfully. OCR processing initiated.',
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorResponse: ErrorResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      details: error instanceof Error ? error.stack : undefined,
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
