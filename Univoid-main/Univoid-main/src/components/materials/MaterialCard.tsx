import { memo, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, 
  Download, 
  Heart, 
  Share2, 
  ChevronDown, 
  ChevronUp,
  User,
  Building
} from 'lucide-react';
import { Material } from '@/types/database';
import MaterialThumbnail from './MaterialThumbnail';
import ReportButton from '@/components/reports/ReportButton';
import { cn } from '@/lib/utils';

interface MaterialCardProps {
  material: Material;
  onPreview: (material: Material) => void;
  onDownload: (material: Material) => void;
  onLike: (material: Material) => void;
  onShare: (material: Material) => void;
  isLiking?: boolean;
}

// Memoized helper functions outside component to prevent recreation
const getFileTypeDisplay = (fileType: string): "pdf" | "image" | "doc" | "other" => {
  const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  const docTypes = ['doc', 'docx', 'txt', 'rtf', 'ppt', 'pptx'];
  
  if (fileType === 'pdf') return 'pdf';
  if (imageTypes.includes(fileType.toLowerCase())) return 'image';
  if (docTypes.includes(fileType.toLowerCase())) return 'doc';
  return 'other';
};

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

const MaterialCard = memo(function MaterialCard({ 
  material, 
  onPreview, 
  onDownload, 
  onLike, 
  onShare,
  isLiking 
}: MaterialCardProps) {
  const [showDescription, setShowDescription] = useState(false);

  // Check if preview is available (PDF only + approved)
  const isPdf = material.file_type.toLowerCase() === 'pdf';
  const isApproved = material.status === 'approved';
  const canPreview = isPdf && isApproved;

  // Memoized callbacks to prevent re-renders
  const handlePreviewClick = useCallback(() => {
    onPreview(material);
  }, [material, onPreview]);

  const handleDownloadClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDownload(material);
  }, [material, onDownload]);

  const handleLikeClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onLike(material);
  }, [material, onLike]);

  const handleShareClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onShare(material);
  }, [material, onShare]);

  const toggleDescription = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDescription(prev => !prev);
  }, []);

  const fileType = getFileTypeDisplay(material.file_type);

  return (
    <Card className="group overflow-hidden h-full flex flex-col border-border transform-gpu transition-all duration-300 hover:-translate-y-1.5 hover:shadow-soft-lg">
      <CardContent className="p-0 flex flex-col h-full">
        {/* Top Section - Grows to fill space */}
        <div 
          className={cn("p-6 pb-0 flex-1 flex flex-col", canPreview && "cursor-pointer")}
          onClick={canPreview ? handlePreviewClick : undefined}
        >
          {/* Thumbnail + Content */}
          <div className="flex gap-4">
            <MaterialThumbnail 
              fileType={fileType}
              title={material.title}
              thumbnailUrl={material.thumbnail_url || undefined}
              className="w-20 h-24 flex-shrink-0 transition-transform duration-200 group-hover:scale-[1.02] rounded-2xl"
            />
            
            <div className="flex-1 min-w-0 flex flex-col">
              {/* Title - max 2 lines */}
              <h3 className="font-bold text-foreground line-clamp-2 mb-2 transition-colors text-sm leading-tight font-display">
                {material.title}
              </h3>
              
              {/* Tags - Fixed minimum height for consistency */}
              <div className="flex flex-wrap gap-1.5 mb-2 min-h-[40px] content-start">
                {!isApproved && (
                  <Badge variant="outline" className="text-[10px] px-2 py-0.5 h-fit bg-amber-500/10 text-amber-700 border-amber-300">
                    Pending
                  </Badge>
                )}
                {!isPdf && (
                  <Badge variant="outline" className="text-[10px] px-2 py-0.5 h-fit">
                    {material.file_type.toUpperCase()}
                  </Badge>
                )}
                {material.course && (
                  <Badge variant="blue" className="text-[10px] px-2 py-0.5 h-fit">
                    {material.course}
                  </Badge>
                )}
                {material.subject && (
                  <Badge variant="purple" className="text-[10px] px-2 py-0.5 h-fit">
                    {material.subject}
                  </Badge>
                )}
                {material.language && (
                  <Badge variant="green" className="text-[10px] px-2 py-0.5 h-fit">
                    {material.language}
                  </Badge>
                )}
              </div>
              
              {/* Uploader info */}
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-auto">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" strokeWidth={2.5} />
                  {material.contributor_name || 'Anonymous'}
                </span>
                {material.college && (
                  <span className="flex items-center gap-1 truncate">
                    <Building className="w-3 h-3 flex-shrink-0" strokeWidth={2.5} />
                    <span className="truncate">{material.college}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Expandable description */}
          {material.description && (
            <div className="mt-3">
              <button
                type="button"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
                onClick={toggleDescription}
              >
                {showDescription ? (
                  <>
                    <ChevronUp className="w-3 h-3" strokeWidth={2.5} />
                    Hide description
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3" strokeWidth={2.5} />
                    Show description
                  </>
                )}
              </button>
              {showDescription && (
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  {material.description}
                </p>
              )}
            </div>
          )}
        </div>
        
        {/* Footer Section - Always at bottom */}
        <div className="px-6 pb-6 pt-4 mt-auto border-t border-border">
          {/* Engagement stats */}
          <div className="flex items-center gap-4 text-[11px] text-muted-foreground mb-3 font-medium">
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" strokeWidth={2.5} />
              {formatNumber(material.views_count || 0)}
            </span>
            <span className="flex items-center gap-1">
              <Download className="w-3.5 h-3.5" strokeWidth={2.5} />
              {formatNumber(material.downloads_count || 0)}
            </span>
            <span className="flex items-center gap-1">
              <Heart className={cn("w-3.5 h-3.5", material.user_has_liked && "fill-red-500 text-red-500")} strokeWidth={2.5} />
              {formatNumber(material.likes_count || 0)}
            </span>
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-9 w-9 p-0 rounded-full transition-colors",
                material.user_has_liked && "text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-900/20"
              )}
              onClick={handleLikeClick}
              disabled={isLiking}
            >
              <Heart className={cn("w-4 h-4", material.user_has_liked && "fill-current")} strokeWidth={2.5} />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 rounded-full transition-colors"
              onClick={handleShareClick}
            >
              <Share2 className="w-4 h-4" strokeWidth={2.5} />
            </Button>
            
            <div className="flex-1" />
            
            <ReportButton
              contentType="materials"
              contentId={material.id}
              contentOwnerId={material.created_by}
              contentTitle={material.title}
            />
            
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-xs font-semibold transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                if (canPreview) {
                  onPreview(material);
                }
              }}
              disabled={!canPreview}
              title={!canPreview ? (isPdf ? 'Material pending approval' : 'Preview available for PDF files only') : 'Preview material'}
            >
              <Eye className="w-3.5 h-3.5 mr-1" strokeWidth={2.5} />
              Preview
            </Button>
            
            <Button
              size="sm"
              className="h-9 text-xs font-semibold transition-colors"
              onClick={handleDownloadClick}
              disabled={!isApproved}
              title={!isApproved ? 'Material pending approval' : 'Download material'}
            >
              <Download className="w-3.5 h-3.5 mr-1" strokeWidth={2.5} />
              Download
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

export default MaterialCard;
