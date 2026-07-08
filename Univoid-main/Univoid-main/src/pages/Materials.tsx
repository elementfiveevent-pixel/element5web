import { useState, useCallback, useMemo, memo, useEffect } from "react";
import { useNavigate, useOutletContext, useSearchParams } from "react-router-dom";

import EnhancedMaterialPreview from "@/components/materials/EnhancedMaterialPreview";
import MaterialCard from "@/components/materials/MaterialCard";
import MaterialCardSkeleton from "@/components/materials/MaterialCardSkeleton";
import MaterialFilters, { MaterialFiltersState, initialFilters } from "@/components/materials/MaterialFilters";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useVerification } from "@/hooks/useVerification";
import { getDownloadUrl } from "@/services/materialsService";
import { getMaterialsPaginated } from "@/services/paginatedService";
import { forceDownloadFile } from "@/lib/downloadUtils";
import { EmptyState, LoadMoreButton } from "@/components/common/SectionLoader";
import { LazySection } from "@/components/common/LazySection";
import { useDeviceCapability, deferAfterPaint } from "@/hooks/useDeviceCapability";
import { Material } from "@/types/database";
import { format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import SEOHead from "@/components/common/SEOHead";

interface LayoutContext {
  onAuthClick?: () => void;
}

// Memoized header component to prevent re-renders
const MaterialsHeader = memo(function MaterialsHeader() {
  return (
    <div className="mb-6 md:mb-10">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 md:w-12 md:h-12 bg-accent rounded-xl flex items-center justify-center flex-shrink-0">
          <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-accent-foreground" />
        </div>
        <div>
          <h1 className="font-display text-xl md:text-3xl text-foreground">
            Study Materials
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Notes, past papers, and resources shared by students
          </p>
        </div>
      </div>
    </div>
  );
});

// Memoized CTA component
const MaterialsCTA = memo(function MaterialsCTA({ onUpload }: { onUpload: () => void }) {
  return (
    <Card className="mt-12 border-0 bg-secondary/50">
      <CardContent className="p-8 text-center">
        <h3 className="font-display text-xl text-foreground mb-3">Have study materials to share?</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Help fellow students by uploading your notes, past papers, or study guides.
        </p>
        <Button onClick={onUpload} className="shadow-premium-sm">
          Upload materials
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
});

const Materials = () => {
  const { user } = useAuth();
  const { canDownload } = useVerification();
  const { isLowEnd } = useDeviceCapability();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const context = useOutletContext<LayoutContext>();
  
  // Get filter values from URL for SEO
  const urlSubject = searchParams.get('subject');
  const urlCourse = searchParams.get('course');
  const urlBranch = searchParams.get('branch');
  
  const [filters, setFilters] = useState<MaterialFiltersState>(() => ({
    ...initialFilters,
    subject: urlSubject || '',
    course: urlCourse || '',
    branch: urlBranch || '',
  }));
  
  // Generate dynamic SEO meta data
  const seoData = useMemo(() => {
    const parts: string[] = [];
    if (urlSubject) parts.push(urlSubject);
    if (urlCourse) parts.push(urlCourse);
    if (urlBranch) parts.push(urlBranch);
    
    if (parts.length > 0) {
      const filterText = parts.join(' - ');
      return {
        title: `${filterText} Study Materials | UniVoid`,
        description: `Download free ${filterText} notes, previous year papers, and study guides. Shared by students for students.`,
        keywords: [...parts, 'notes', 'pdf', 'study material', 'free download', 'UniVoid'],
      };
    }
    
    return {
      title: 'Study Materials - Notes, Papers & Resources | UniVoid',
      description: 'Access thousands of free study materials, notes, previous year papers, and resources shared by students. Download PDF notes for BTech, BCA, MBA, and more.',
      keywords: ['study materials', 'notes pdf', 'previous year papers', 'free download', 'BTech notes', 'UniVoid'],
    };
  }, [urlSubject, urlCourse, urlBranch]);
  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null);
  const [page, setPage] = useState(0);
  // SessionStorage cache key and TTL (5 minutes)
  const MATERIALS_CACHE_KEY = 'materials_cache';
  const CACHE_TTL = 5 * 60 * 1000;

  // Helper to get cached materials from sessionStorage
  const getSessionCache = useCallback((): { data: Material[]; hasMore: boolean } | null => {
    try {
      const stored = sessionStorage.getItem(MATERIALS_CACHE_KEY);
      if (!stored) return null;
      const { data, hasMore, timestamp } = JSON.parse(stored);
      if (Date.now() - timestamp < CACHE_TTL) {
        return { data, hasMore };
      }
      sessionStorage.removeItem(MATERIALS_CACHE_KEY);
    } catch {
      // Ignore storage errors
    }
    return null;
  }, []);

  // Helper to set sessionStorage cache
  const setSessionCache = useCallback((data: Material[], hasMore: boolean) => {
    try {
      sessionStorage.setItem(MATERIALS_CACHE_KEY, JSON.stringify({ data, hasMore, timestamp: Date.now() }));
    } catch {
      // Ignore storage errors (quota exceeded, etc.)
    }
  }, []);

  // Initialize state from sessionStorage if available
  const [allMaterials, setAllMaterials] = useState<Material[]>(() => {
    const cached = getSessionCache();
    return cached?.data || [];
  });
  const [hasMore, setHasMore] = useState(() => {
    const cached = getSessionCache();
    return cached?.hasMore ?? true;
  });
  const [loadingMore, setLoadingMore] = useState(false);
  const [isLoading, setIsLoading] = useState(() => {
    const cached = getSessionCache();
    return !cached; // Don't show loading if we have cached data
  });
  const [isFiltering, setIsFiltering] = useState(false);
  const [likingIds, setLikingIds] = useState<Set<string>>(new Set());

  // Adjust batch size based on device capability
  const batchSize = isLowEnd ? 9 : 15;

  const fetchMaterials = useCallback(async () => {
    try {
      const result = await getMaterialsPaginated(0, batchSize);
      setAllMaterials(result.data);
      setHasMore(result.hasMore);
      // Cache to sessionStorage
      setSessionCache(result.data, result.hasMore);
    } catch (error) {
      console.error('Failed to fetch materials:', error);
      // Don't clear existing data on error - keep showing what we have
    } finally {
      setIsLoading(false);
    }
  }, [batchSize, setSessionCache]);

  // Initial fetch + real-time subscription
  useEffect(() => {
    fetchMaterials();

    // Real-time subscription for instant updates
    const channel = supabase
      .channel('materials-page-realtime')
      .on(
        'postgres_changes' as any,
        { event: '*', schema: 'public', table: 'materials' },
        (payload: any) => {
          const newData = payload.new as Material;
          
          if (payload.eventType === 'INSERT' && newData?.status === 'approved') {
            // New approved material inserted
            setAllMaterials(prev => {
              if (prev.some(m => m.id === newData.id)) return prev;
              return [newData, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            if (newData?.status === 'approved') {
              // Material is approved or counter updated - update in place or add
              setAllMaterials(prev => {
                if (prev.some(m => m.id === newData.id)) {
                  return prev.map(m => m.id === newData.id ? { ...m, ...newData } : m);
                }
                // Newly approved material - add to top
                return [newData, ...prev];
              });
            } else if (newData?.status === 'rejected' || newData?.status === 'pending') {
              // Only remove if status is EXPLICITLY set to rejected/pending
              // This prevents removal when status field is missing from partial updates
              setAllMaterials(prev => prev.filter(m => m.id !== newData.id));
            }
            // If status is undefined/null in the payload, do nothing (counter updates etc.)
          } else if (payload.eventType === 'DELETE') {
            setAllMaterials(prev => prev.filter(m => m.id !== payload.old?.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMaterials]);

  const applyFilters = useCallback(async (newFilters: MaterialFiltersState) => {
    setFilters(newFilters);
    setIsFiltering(true);
    setPage(0);
    try {
      const apiFilters = {
        search: newFilters.search || undefined,
        course: newFilters.course || undefined,
        branch: newFilters.branch || undefined,
        subject: newFilters.subject || undefined,
        language: newFilters.language || undefined,
        college: newFilters.college || undefined,
      };
      const result = await getMaterialsPaginated(0, batchSize, apiFilters);
      setAllMaterials(result.data);
      setHasMore(result.hasMore);
    } catch (error) {
      toast.error('Failed to filter materials');
    } finally {
      setIsFiltering(false);
    }
  }, [batchSize]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const apiFilters = {
        search: filters.search || undefined,
        course: filters.course || undefined,
        branch: filters.branch || undefined,
        subject: filters.subject || undefined,
        language: filters.language || undefined,
        college: filters.college || undefined,
      };
      const result = await getMaterialsPaginated(nextPage, batchSize, apiFilters);
      setAllMaterials(prev => {
        const combined = [...prev, ...result.data];
        // Update sessionStorage with combined data (only for unfiltered)
        const hasActiveFilters = filters.search || filters.course || filters.branch || filters.subject || filters.language || filters.college;
        if (!hasActiveFilters) {
          setSessionCache(combined, result.hasMore);
        }
        return combined;
      });
      setHasMore(result.hasMore);
      setPage(nextPage);
    } catch (error) {
      toast.error('Failed to load more materials');
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, page, filters, batchSize, setSessionCache]);

  const handleDownload = useCallback(async (material: Material) => {
    if (!user) {
      context?.onAuthClick?.();
      return;
    }
    if (!canDownload) {
      toast.error("Please verify your account to download materials");
      return;
    }
    try {
      // Defer non-critical update to after animation frame
      deferAfterPaint(() => {
        supabase.rpc('increment_material_downloads', { material_id: material.id });
      });
      
      const url = await getDownloadUrl(material.id);
      if (url) {
        // Force download instead of opening in new tab
        const filename = `${material.title}.${material.file_type}`;
        await forceDownloadFile(url, filename);
        setAllMaterials(prev => prev.map(m => 
          m.id === material.id 
            ? { ...m, downloads_count: (m.downloads_count || 0) + 1 }
            : m
        ));
      } else {
        toast.error('Download link not available');
      }
    } catch (error) {
      toast.error('Failed to get download link');
    }
  }, [user, canDownload, context]);

  const handleLike = useCallback(async (material: Material) => {
    if (!user) {
      context?.onAuthClick?.();
      return;
    }

    if (likingIds.has(material.id)) return;
    
    setLikingIds(prev => new Set(prev).add(material.id));
    
    try {
      const { data: newLikeState, error } = await supabase.rpc('toggle_material_like', {
        p_material_id: material.id,
      });
      
      if (error) throw error;
      
      setAllMaterials(prev => prev.map(m => 
        m.id === material.id 
          ? { 
              ...m, 
              user_has_liked: newLikeState,
              likes_count: newLikeState 
                ? (m.likes_count || 0) + 1 
                : Math.max(0, (m.likes_count || 0) - 1)
            }
          : m
      ));
    } catch (error) {
      toast.error('Failed to update like');
    } finally {
      setLikingIds(prev => {
        const next = new Set(prev);
        next.delete(material.id);
        return next;
      });
    }
  }, [user, likingIds, context]);

  const handleShare = useCallback(async (material: Material) => {
    const url = `${window.location.origin}/materials?id=${material.id}`;
    
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
      
      // Defer analytics update
      deferAfterPaint(() => {
        supabase.rpc('increment_material_shares', { material_id: material.id });
      });
      
      setAllMaterials(prev => prev.map(m => 
        m.id === material.id 
          ? { ...m, shares_count: (m.shares_count || 0) + 1 }
          : m
      ));
    } catch (error) {
      // User cancelled share or error
    }
  }, []);

  const handleUpload = useCallback(() => {
    if (user) {
      navigate("/upload-material");
    } else {
      context?.onAuthClick?.();
    }
  }, [user, navigate, context]);

  const handlePreview = useCallback(async (material: Material) => {
    // Only allow preview for approved PDFs
    const isPdf = material.file_type.toLowerCase() === 'pdf';
    const isApproved = material.status === 'approved';
    
    if (!isPdf) {
      toast.info('Preview available for PDF files only');
      return;
    }
    
    if (!isApproved) {
      toast.info('This material is pending approval');
      return;
    }
    
    setPreviewMaterial(material);
    // Defer view count increment
    deferAfterPaint(() => {
      supabase.rpc('increment_material_views', { material_id: material.id });
    });
    setAllMaterials(prev => prev.map(m => 
      m.id === material.id 
        ? { ...m, views_count: (m.views_count || 0) + 1 }
        : m
    ));
  }, []);

  const handleClearFilters = useCallback(() => {
    applyFilters(initialFilters);
  }, [applyFilters]);

  const handlePreviewClose = useCallback(() => setPreviewMaterial(null), []);

  // Enhanced preview modal data
  const previewModalData = useMemo(() => {
    if (!previewMaterial) return null;
    return {
      id: previewMaterial.id,
      title: previewMaterial.title,
      description: previewMaterial.description,
      file_url: previewMaterial.file_url,
      file_type: previewMaterial.file_type,
      file_size: previewMaterial.file_size,
      subject: previewMaterial.subject,
      branch: previewMaterial.branch,
      course: previewMaterial.course,
      college: previewMaterial.college,
      language: previewMaterial.language,
      downloads_count: previewMaterial.downloads_count || 0,
      views_count: previewMaterial.views_count || 0,
      likes_count: previewMaterial.likes_count || 0,
      created_at: previewMaterial.created_at,
      contributor_name: previewMaterial.contributor_name || 'Anonymous',
      status: previewMaterial.status,
      thumbnail_url: previewMaterial.thumbnail_url,
    };
  }, [previewMaterial]);

  const handlePreviewDownload = useCallback(() => {
    if (previewMaterial) {
      handleDownload(previewMaterial);
    }
    setPreviewMaterial(null);
  }, [previewMaterial, handleDownload]);

  return (
    <div className="page-enter">
      <SEOHead
        title={seoData.title}
        description={seoData.description}
        url="/materials"
        keywords={seoData.keywords}
        structuredData={{
          "@type": "CollectionPage",
          "name": seoData.title,
          "description": seoData.description,
          "url": "https://univoid.tech/materials",
          "mainEntity": {
            "@type": "ItemList",
            "numberOfItems": allMaterials.length,
            "itemListElement": allMaterials.slice(0, 10).map((m, i) => ({
              "@type": "ListItem",
              "position": i + 1,
              "url": `https://univoid.tech/materials/${m.id}`,
              "name": m.title,
            })),
          },
        }}
      />
      <main className="py-10 md:py-14">
        <div className="container-wide">
          {/* Header - Memoized */}
          <MaterialsHeader />

          {/* Filters */}
          <MaterialFilters 
            filters={filters} 
            onFiltersChange={applyFilters}
            onClearFilters={handleClearFilters}
          />

          {/* Content */}
          {isLoading || isFiltering ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 items-stretch">
              {Array.from({ length: 6 }).map((_, i) => (
                <MaterialCardSkeleton key={i} />
              ))}
            </div>
          ) : allMaterials.length === 0 ? (
            <EmptyState 
              message="No materials found. Try adjusting your filters or be the first to contribute!"
              action={
                <Button onClick={handleUpload} className="shadow-premium-sm">
                  Upload materials <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              }
            />
          ) : (
            <>
              {/* Materials Grid - GPU optimized with lazy loading */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 items-stretch">
                {allMaterials.map((material, index) => (
                  <LazySection 
                    key={material.id}
                    fallback={<MaterialCardSkeleton />}
                    staggerIndex={index < 6 ? index + 1 : 0}
                    rootMargin="150px"
                  >
                    <MaterialCard
                      material={material}
                      onPreview={handlePreview}
                      onDownload={handleDownload}
                      onLike={handleLike}
                      onShare={handleShare}
                      isLiking={likingIds.has(material.id)}
                    />
                  </LazySection>
                ))}
              </div>

              {/* Load More */}
              <LoadMoreButton 
                onClick={loadMore}
                isLoading={loadingMore}
                hasMore={hasMore}
              />
            </>
          )}

          {/* CTA - Memoized */}
          <MaterialsCTA onUpload={handleUpload} />
        </div>
      </main>

      

      <EnhancedMaterialPreview
        material={previewModalData}
        isOpen={!!previewMaterial}
        onClose={handlePreviewClose}
        onDownload={handlePreviewDownload}
      />
    </div>
  );
};

export default Materials;
