import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useVerification } from "@/hooks/useVerification";
import VerificationBanner from "@/components/common/VerificationBanner";
import { uploadMaterial } from "@/services/materialsService";
import { toast } from "sonner";
import { ArrowLeft, Loader2, FileText, AlertTriangle, Clock } from "lucide-react";
import { LANGUAGE_OPTIONS } from "@/constants/materialOptions";
import { SearchableSelect } from "@/components/common/SearchableSelect";
import { FileUploadZone } from "@/components/common/FileUploadZone";

const UploadMaterial = () => {
  const { user, profile } = useAuth();
  const { isVerified, canUpload } = useVerification();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // Form fields - pre-fill from profile where possible
  const [course, setCourse] = useState("");
  const [branch, setBranch] = useState("");
  const [branchId, setBranchId] = useState("");
  const [subject, setSubject] = useState("");
  const [language, setLanguage] = useState("");
  const [customLanguage, setCustomLanguage] = useState("");
  const [college, setCollege] = useState("");
  const [collegeId, setCollegeId] = useState("");

  // Pre-fill from profile on mount
  useEffect(() => {
    if (profile) {
      if (profile.college_name && !college) {
        setCollege(profile.college_name);
      }
      if ((profile.branch || profile.course_stream) && !branch) {
        setBranch(profile.branch || profile.course_stream || "");
      }
    }
  }, [profile, college, branch]);

  const handleFileSelect = (selectedFile: File) => {
    // Validate file
    const videoExtensions = ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm'];
    const ext = selectedFile.name.split('.').pop()?.toLowerCase() || '';
    if (videoExtensions.includes(ext)) {
      toast.error("Video files are not allowed");
      return;
    }
    // 100MB limit
    if (selectedFile.size > 100 * 1024 * 1024) {
      toast.error("File size must be less than 100MB");
      return;
    }
    setFile(selectedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canUpload) {
      toast.error("Please verify your account to upload materials");
      return;
    }
    
    if (!file) {
      toast.error("Please select a file to upload");
      return;
    }

    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    // Validate required fields
    const finalLanguage = language === 'Other' ? customLanguage : language;

    if (!course || !branch || !subject || !finalLanguage || !college) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);
    setUploadStage("Starting upload...");

    const { id, error } = await uploadMaterial(
      file, 
      title, 
      description, 
      user.id,
      {
        onProgress: (progress, stage) => {
          setUploadProgress(progress);
          setUploadStage(stage);
        },
        course,
        branch,
        subject,
        language: finalLanguage,
        college,
      }
    );

    setIsSubmitting(false);

    if (error) {
      toast.error(error.message);
      setUploadProgress(0);
      setUploadStage("");
      return;
    }

    // Success - material will appear in real-time via subscription
    setIsSuccess(true);
    toast.success("Material submitted for review! It will appear instantly after admin approval.");
  };

  if (isSuccess) {
    return (
      <main className="flex-1 py-8">
        <div className="container-wide max-w-lg">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Submitted for Review!</h2>
              <p className="text-muted-foreground mb-6">
                Your material has been submitted and is pending admin approval. You'll be notified once it's published!
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => { 
                  setIsSuccess(false); 
                  setTitle(""); 
                  setDescription(""); 
                  setFile(null); 
                  setUploadProgress(0);
                  setCourse("");
                  setBranch("");
                  setBranchId("");
                  setSubject("");
                  setLanguage("");
                  setCustomLanguage("");
                  setCollege("");
                  setCollegeId("");
                }}>
                  Upload Another
                </Button>
                <Link to="/dashboard">
                  <Button>Go to Dashboard</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 py-8">
      <div className="container-wide max-w-lg">
        <Link to="/dashboard">
          <Button variant="ghost" size="sm" className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Dashboard
            </Button>
          </Link>

          <VerificationBanner />

          {!canUpload && (
            <Card className="mb-6 border-warning bg-warning/10">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-warning" />
                <p className="text-sm text-warning-foreground">
                  You need to verify your email or phone to upload materials.
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Upload Study Material
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Calculus II Complete Notes"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    disabled={isSubmitting || !canUpload}
                  />
                </div>

                {/* College */}
                <SearchableSelect
                  label="College/University *"
                  tableName="lookup_universities"
                  placeholder="Search for your college..."
                  value={college}
                  displayValue={college}
                  onSelect={(item) => setCollege(item.name)}
                  disabled={isSubmitting || !canUpload}
                />

                {/* Branch */}
                <SearchableSelect
                  label="Branch/Stream *"
                  tableName="lookup_branches"
                  placeholder="Search for your branch..."
                  value={branch}
                  displayValue={branch}
                  onSelect={(item) => setBranch(item.name)}
                  disabled={isSubmitting || !canUpload}
                />

                {/* Subject */}
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    placeholder="e.g., Data Structures, Physics"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                    disabled={isSubmitting || !canUpload}
                  />
                </div>

                {/* Course - Free text for now */}
                <div className="space-y-2">
                  <Label htmlFor="course">Course *</Label>
                  <Input
                    id="course"
                    placeholder="e.g., B.Tech, BCA, MBA"
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    required
                    disabled={isSubmitting || !canUpload}
                  />
                </div>

                {/* Language */}
                <div className="space-y-2">
                  <Label>Language *</Label>
                  <Select value={language} onValueChange={setLanguage} disabled={isSubmitting || !canUpload}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGE_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {language === 'Other' && (
                    <Input
                      placeholder="Enter language"
                      value={customLanguage}
                      onChange={(e) => setCustomLanguage(e.target.value)}
                      required
                      disabled={isSubmitting || !canUpload}
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of the material..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    disabled={isSubmitting || !canUpload}
                  />
                </div>

                {/* File Upload - Consistent UX for mobile & desktop */}
                <FileUploadZone
                  label="File *"
                  file={file}
                  onFileSelect={handleFileSelect}
                  onClear={() => setFile(null)}
                  disabled={!canUpload}
                  isUploading={isSubmitting}
                  uploadProgress={uploadProgress}
                  maxSizeMB={100}
                  hint="PDF, DOC, PPT, images, ZIP (max 100MB, NO videos)"
                />

                <Button type="submit" className="w-full" disabled={isSubmitting || !canUpload}>
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="truncate">{uploadStage || 'Uploading...'}</span>
                      <span className="text-xs opacity-75">({uploadProgress}%)</span>
                    </div>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      Upload Material
                    </>
                  )}
                </Button>
              </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default UploadMaterial;