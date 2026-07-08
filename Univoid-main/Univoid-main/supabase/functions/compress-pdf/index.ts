import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument } from "https://esm.sh/pdf-lib@1.17.1";
import { getCorsHeaders, isCorsPreflightRequest, handleCorsPreflightRequest } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight
  if (isCorsPreflightRequest(req)) {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const { filePath, bucket = 'materials' } = await req.json();

    if (!filePath) {
      throw new Error('filePath is required');
    }

    console.log(`Starting PDF compression for: ${filePath}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Download the original PDF
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(bucket)
      .download(filePath);

    if (downloadError) {
      console.error('Download error:', downloadError);
      throw new Error(`Failed to download file: ${downloadError.message}`);
    }

    const originalSize = fileData.size;
    console.log(`Original file size: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);

    // Load and compress the PDF
    const arrayBuffer = await fileData.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, {
      ignoreEncryption: true,
      updateMetadata: false
    });

    // Remove metadata to reduce size
    pdfDoc.setTitle('');
    pdfDoc.setAuthor('');
    pdfDoc.setSubject('');
    pdfDoc.setKeywords([]);
    pdfDoc.setProducer('');
    pdfDoc.setCreator('');

    // Save with compression options
    const compressedPdfBytes = await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: 50,
    });

    const compressedSize = compressedPdfBytes.length;
    const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(1);

    console.log(`Compressed size: ${(compressedSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Compression ratio: ${compressionRatio}%`);

    // Only replace if compression achieved meaningful reduction (>5%)
    if (compressedSize < originalSize * 0.95) {
      // Generate compressed file path
      const pathParts = filePath.split('/');
      const fileName = pathParts.pop();
      const compressedFileName = `compressed_${fileName}`;
      const compressedPath = [...pathParts, compressedFileName].join('/');

      // Upload compressed version
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(compressedPath, compressedPdfBytes, {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Failed to upload compressed file: ${uploadError.message}`);
      }

      // Delete original file
      const { error: deleteError } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (deleteError) {
        console.warn('Failed to delete original file:', deleteError);
      }

      // Get public URL for compressed file
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(compressedPath);

      console.log(`Compression successful! New path: ${compressedPath}`);

      return new Response(
        JSON.stringify({
          success: true,
          originalSize,
          compressedSize,
          compressionRatio: parseFloat(compressionRatio),
          newFilePath: compressedPath,
          publicUrl: urlData.publicUrl,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      console.log('Compression not beneficial, keeping original file');

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return new Response(
        JSON.stringify({
          success: true,
          originalSize,
          compressedSize: originalSize,
          compressionRatio: 0,
          newFilePath: filePath,
          publicUrl: urlData.publicUrl,
          message: 'Compression not beneficial, original file kept',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('PDF compression error:', errorMessage);
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
