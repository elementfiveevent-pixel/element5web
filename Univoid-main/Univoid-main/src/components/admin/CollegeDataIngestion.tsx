import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, CheckCircle, XCircle, Loader2, Database } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { validateFileUpload } from "@/lib/fileValidation";

interface IngestionStats {
  total: number;
  inserted: number;
  skipped: number;
  errors: number;
  errorDetails?: string[];
}

export default function CollegeDataIngestion() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState<IngestionStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".json")) {
      toast.error("Please upload a JSON file");
      return;
    }

    const validationError = validateFileUpload(file, 'any');
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsUploading(true);
    setProgress(10);
    setStats(null);
    setError(null);

    try {
      // Read the file
      const text = await file.text();
      setProgress(20);

      // Parse JSON
      const data = JSON.parse(text);
      setProgress(30);

      if (!Array.isArray(data)) {
        throw new Error("JSON must be an array of college records");
      }

      toast.info(`Processing ${data.length.toLocaleString()} records...`);
      setProgress(40);

      // Send to edge function in chunks
      const chunkSize = 5000;
      let totalInserted = 0;
      let totalSkipped = 0;
      let totalErrors = 0;
      const allErrorDetails: string[] = [];

      for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);
        
        const { data: result, error: funcError } = await supabase.functions.invoke(
          "ingest-colleges",
          {
            body: { colleges: chunk },
          }
        );

        if (funcError) {
          console.error("Chunk error:", funcError);
          allErrorDetails.push(`Chunk ${Math.floor(i / chunkSize) + 1}: ${funcError.message}`);
          totalErrors++;
          continue;
        }

        if (result?.stats) {
          totalInserted += result.stats.inserted || 0;
          totalSkipped += result.stats.skipped || 0;
          totalErrors += result.stats.errors || 0;
          if (result.stats.errorDetails) {
            allErrorDetails.push(...result.stats.errorDetails);
          }
        }

        // Update progress
        const progressPercent = 40 + Math.round((i / data.length) * 55);
        setProgress(progressPercent);
      }

      setProgress(100);
      setStats({
        total: data.length,
        inserted: totalInserted,
        skipped: totalSkipped,
        errors: totalErrors,
        errorDetails: allErrorDetails.slice(0, 10),
      });

      toast.success(`Successfully processed ${data.length.toLocaleString()} colleges!`);
    } catch (err) {
      console.error("Upload error:", err);
      setError(err instanceof Error ? err.message : "Failed to process file");
      toast.error("Failed to process file");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          College Data Ingestion
        </CardTitle>
        <CardDescription>
          Upload a JSON file containing college records to populate the database
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Section */}
        <div className="border-2 border-dashed rounded-lg p-6 text-center">
          <input
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="hidden"
            id="college-json-upload"
          />
          <label
            htmlFor="college-json-upload"
            className={`cursor-pointer flex flex-col items-center gap-2 ${
              isUploading ? "opacity-50" : ""
            }`}
          >
            {isUploading ? (
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
            ) : (
              <Upload className="h-10 w-10 text-muted-foreground" />
            )}
            <span className="text-sm text-muted-foreground">
              {isUploading ? "Processing..." : "Click to upload colleges.json"}
            </span>
          </label>
        </div>

        {/* Progress Bar */}
        {isUploading && (
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-xs text-muted-foreground text-center">
              {progress}% complete
            </p>
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="font-medium">Ingestion Complete</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-muted rounded-lg p-3 text-center">
                <p className="text-2xl font-bold">{stats.total.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Records</p>
              </div>
              <div className="bg-green-500/10 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-green-600">{stats.inserted.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Inserted</p>
              </div>
              <div className="bg-yellow-500/10 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-yellow-600">{stats.skipped.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Skipped</p>
              </div>
              <div className="bg-red-500/10 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-red-600">{stats.errors}</p>
                <p className="text-xs text-muted-foreground">Errors</p>
              </div>
            </div>
            {stats.errorDetails && stats.errorDetails.length > 0 && (
              <div className="text-xs text-muted-foreground bg-muted p-2 rounded max-h-24 overflow-auto">
                {stats.errorDetails.map((err, i) => (
                  <p key={i}>{err}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-destructive">
            <XCircle className="h-5 w-5" />
            <span className="text-sm">{error}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
