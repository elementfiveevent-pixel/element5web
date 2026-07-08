import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CollegeRecord {
  university: string;
  college: string;
  college_type: string;
  state: string;
  district: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { colleges } = await req.json() as { colleges: CollegeRecord[] };

    if (!colleges || !Array.isArray(colleges)) {
      return new Response(
        JSON.stringify({ error: "Invalid data format. Expected { colleges: [...] }" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${colleges.length} colleges...`);

    // Process in batches of 1000
    const batchSize = 1000;
    let inserted = 0;
    let skipped = 0;
    let errors: string[] = [];

    for (let i = 0; i < colleges.length; i += batchSize) {
      const batch = colleges.slice(i, i + batchSize);
      
      // Transform data and filter out invalid entries
      const validRecords = batch
        .filter(record => 
          record.college && 
          record.state && 
          record.district && 
          record.university
        )
        .map(record => ({
          university: record.university.trim(),
          college_name: record.college.trim(),
          college_type: record.college_type?.trim() || null,
          state: record.state.trim(),
          district: record.district.trim(),
        }));

      if (validRecords.length === 0) continue;

      // Use upsert to handle duplicates gracefully
      const { error, count } = await supabase
        .from("colleges")
        .upsert(validRecords, { 
          onConflict: "college_name,university,state,district",
          ignoreDuplicates: true 
        });

      if (error) {
        console.error(`Batch ${i / batchSize + 1} error:`, error);
        errors.push(`Batch ${i / batchSize + 1}: ${error.message}`);
      } else {
        inserted += validRecords.length;
      }

      skipped += batch.length - validRecords.length;
      
      console.log(`Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(colleges.length / batchSize)}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Ingestion complete`,
        stats: {
          total: colleges.length,
          inserted,
          skipped,
          errors: errors.length,
          errorDetails: errors.slice(0, 10) // Only first 10 errors
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Ingestion error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
