import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useVerification } from "@/hooks/useVerification";
import { supabase } from "@/integrations/supabase/client";
import { getDownloadUrl } from "@/services/materialsService";
import { forceDownloadFile } from "@/lib/downloadUtils";
import { Material } from "@/types/database";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FileText, Download, Eye, Heart, Share2, ArrowLeft, 
  User, Calendar, BookOpen, GraduationCap, Globe, Building
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import PageBreadcrumb from "@/components/common/PageBreadcrumb";
import SEOHead from "@/components/common/SEOHead";
import EnhancedMaterialPreview from "@/components/materials/EnhancedMaterialPreview";
import AuthModal from "@/components/auth/AuthModal";

const MaterialDetail = () => {
  const { materialId } = useParams<{ materialId: string }>();
  const { user } = useAuth();
  const { canDownload } = useVerification();
  const [material, setMaterial] = useState<Material | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  useEffect(() => {
    const fetchMaterial = async () => {
      if (!materialId) return;
      
      try {
        const { data, error } = await supabase
          .from('materials')
          .select('*')
          .eq('id', materialId)
          .eq('status', 'approved')
          .single();

        if (error) throw error;
        
        // Get contributor name
        if (data) {
          const { data: contributorData } = await supabase
            .rpc('get_contributor_name', { user_id: data.created_by });
          
          setMaterial({
            ...data,
            contributor_name: contributorData || 'Anonymous',
          } as Material);

          // Increment view count
          supabase.rpc('increment_material_views', { material_id: materialId });
        }
      } catch (error) {
        console.error('Error fetching material:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMaterial();
  }, [materialId]);

  const handleDownload = useCallback(async () => {
    if (!material) return;
    
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (!canDownload) {
      toast.error("Please verify your account to download materials");
      return;
    }

    try {
      supabase.rpc('increment_material_downloads', { material_id: material.id });
      const url = await getDownloadUrl(material.id);
      if (url) {
        const filename = `${material.title}.${material.file_type}`;
        await forceDownloadFile(url, filename);
        setMaterial(prev => prev ? { ...prev, downloads_count: (prev.downloads_count || 0) + 1 } : prev);
      } else {
        toast.error('Download link not available');
      }
    } catch (error) {
      toast.error('Failed to get download link');
    }
  }, [material, user, canDownload]);

  const handleLike = useCallback(async () => {
    if (!material || !user) {
      if (!user) setShowAuthModal(true);
      return;
    }

    if (isLiking) return;
    setIsLiking(true);

    try {
      const { data: newLikeState, error } = await supabase.rpc('toggle_material_like', {
        p_material_id: material.id,
      });

      if (error) throw error;

      setMaterial(prev => prev ? {
        ...prev,
        user_has_liked: newLikeState,
        likes_count: newLikeState 
          ? (prev.likes_count || 0) + 1 
          : Math.max(0, (prev.likes_count || 0) - 1)
      } : prev);
    } catch (error) {
      toast.error('Failed to update like');
    } finally {
      setIsLiking(false);
    }
  }, [material, user, isLiking]);

  const handleShare = useCallback(async () => {
    if (!material) return;
    
    const url = `${window.location.origin}/materials/${material.id}`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: material.title,
          text: `Check out this study material: ${material.title}`,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard');
      }
      
      supabase.rpc('increment_material_shares', { material_id: material.id });
      setMaterial(prev => prev ? { ...prev, shares_count: (prev.shares_count || 0) + 1 } : prev);
    } catch (error) {
      // User cancelled share
    }
  }, [material]);

  if (isLoading) {
    return (
      <div className="py-8">
        <div className="container-wide max-w-4xl">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <Skeleton className="h-12 w-3/4 mb-4" />
              <Skeleton className="h-6 w-full mb-2" />
              <Skeleton className="h-6 w-2/3" />
            </div>
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  if (!material) {
    return (
      <div className="py-10">
        <div className="container-wide text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Material Not Found</h1>
          <p className="text-muted-foreground mb-6">This material doesn't exist or has been removed.</p>
          <Link to="/materials">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Materials
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isPdf = material.file_type?.toLowerCase() === 'pdf';

  // SEO structured data
  const materialStructuredData = {
    "@type": "CreativeWork",
    name: material.title,
    description: material.description || `Study material for ${material.subject || material.course || "students"}`,
    author: {
      "@type": "Person",
      name: material.contributor_name || "Anonymous",
    },
    datePublished: material.created_at,
    educationalLevel: material.course || "University",
    learningResourceType: material.file_type?.toUpperCase() || "Document",
    inLanguage: material.language || "en",
  };

  const seoDescription = material.description 
    ? material.description.substring(0, 155) 
    : `${material.title} - ${material.subject || material.course || "Study material"} shared by ${material.contributor_name || "a student"}. Download free study materials on UniVoid.`;

  return (
    <div className="py-8">
      <SEOHead
        title={material.title}
        description={seoDescription}
        image={material.thumbnail_url}
        url={`/materials/${materialId}`}
        type="article"
        structuredData={materialStructuredData}
        author={material.contributor_name}
        keywords={[
          material.subject || "study material",
          material.course || "notes",
          material.branch || "education",
          "free download",
          "college notes",
        ].filter(Boolean) as string[]}
      />
      
      <div className="container-wide max-w-4xl">
        <PageBreadcrumb 
          items={[
            { label: "Materials", href: "/materials" },
            { label: material.title }
          ]} 
        />

        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4">{material.title}</h1>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="secondary">{material.file_type?.toUpperCase()}</Badge>
                {material.subject && <Badge variant="outline">{material.subject}</Badge>}
                {material.course && <Badge variant="outline">{material.course}</Badge>}
                {material.language && <Badge variant="outline">{material.language}</Badge>}
              </div>

              {material.description && (
                <p className="text-muted-foreground">{material.description}</p>
              )}
            </div>

            {/* Details Card */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold">Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {material.branch && (
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-muted-foreground" />
                      <span>{material.branch}</span>
                    </div>
                  )}
                  {material.college && (
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-muted-foreground" />
                      <span>{material.college}</span>
                    </div>
                  )}
                  {material.language && (
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <span>{material.language}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>{format(new Date(material.created_at), "MMM d, yyyy")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contributor Card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{material.contributor_name || "Anonymous"}</p>
                    <p className="text-sm text-muted-foreground">Contributor</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card className="sticky top-20">
              <CardContent className="p-6 space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-secondary rounded-lg">
                    <Eye className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-sm font-medium">{material.views_count || 0}</p>
                    <p className="text-xs text-muted-foreground">Views</p>
                  </div>
                  <div className="p-2 bg-secondary rounded-lg">
                    <Download className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-sm font-medium">{material.downloads_count || 0}</p>
                    <p className="text-xs text-muted-foreground">Downloads</p>
                  </div>
                  <div className="p-2 bg-secondary rounded-lg">
                    <Heart className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-sm font-medium">{material.likes_count || 0}</p>
                    <p className="text-xs text-muted-foreground">Likes</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  {isPdf && (
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={() => setShowPreview(true)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </Button>
                  )}
                  
                  <Button className="w-full" onClick={handleDownload}>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1" 
                      onClick={handleLike}
                      disabled={isLiking}
                    >
                      <Heart className={`w-4 h-4 mr-2 ${material.user_has_liked ? 'fill-current text-red-500' : ''}`} />
                      {material.user_has_liked ? 'Liked' : 'Like'}
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={handleShare}>
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <EnhancedMaterialPreview
        material={material ? {
          id: material.id,
          title: material.title,
          description: material.description,
          file_url: material.file_url,
          file_type: material.file_type,
          file_size: material.file_size,
          subject: material.subject,
          branch: material.branch,
          course: material.course,
          college: material.college,
          language: material.language,
          downloads_count: material.downloads_count || 0,
          views_count: material.views_count || 0,
          likes_count: material.likes_count || 0,
          created_at: material.created_at,
          contributor_name: material.contributor_name || 'Anonymous',
          status: material.status,
          thumbnail_url: material.thumbnail_url,
        } : null}
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        onDownload={handleDownload}
      />

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
};

export default MaterialDetail;
