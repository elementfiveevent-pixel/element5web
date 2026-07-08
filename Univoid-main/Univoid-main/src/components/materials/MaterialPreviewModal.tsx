import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Image, File, X, User, Calendar } from "lucide-react";

interface Material {
  id: number;
  title: string;
  subject: string;
  type: string;
  fileType: "pdf" | "image" | "doc" | "other";
  downloads: number;
  date: string;
  preview: string;
  contributor: string;
  thumbnailUrl?: string;
}

interface MaterialPreviewModalProps {
  material: Material | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
}

const MaterialPreviewModal = ({ material, isOpen, onClose, onDownload }: MaterialPreviewModalProps) => {
  if (!material) return null;

  const getPreviewContent = () => {
    switch (material.fileType) {
      case "pdf":
        return (
          <div className="aspect-[3/4] bg-muted rounded-lg flex flex-col items-center justify-center border border-border">
            <div className="w-full h-full bg-gradient-to-b from-muted to-muted/50 rounded-lg p-6 flex flex-col">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
                <FileText className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-foreground truncate">{material.title}</span>
              </div>
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-muted-foreground/10 rounded w-full" />
                <div className="h-3 bg-muted-foreground/10 rounded w-11/12" />
                <div className="h-3 bg-muted-foreground/10 rounded w-10/12" />
                <div className="h-3 bg-muted-foreground/10 rounded w-full" />
                <div className="h-3 bg-muted-foreground/10 rounded w-9/12" />
                <div className="h-6" />
                <div className="h-3 bg-muted-foreground/10 rounded w-full" />
                <div className="h-3 bg-muted-foreground/10 rounded w-10/12" />
                <div className="h-3 bg-muted-foreground/10 rounded w-11/12" />
              </div>
              <div className="text-center pt-4 border-t border-border mt-auto">
                <span className="text-xs text-muted-foreground">Page 1</span>
              </div>
            </div>
          </div>
        );
      case "image":
        return (
          <div className="aspect-video bg-muted rounded-lg overflow-hidden border border-border">
            {material.thumbnailUrl ? (
              <img 
                src={material.thumbnailUrl} 
                alt={material.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
                <Image className="w-16 h-16 text-primary/40" />
              </div>
            )}
          </div>
        );
      default:
        return (
          <div className="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center border border-border">
            <File className="w-16 h-16 text-muted-foreground/40 mb-3" />
            <span className="text-sm text-muted-foreground">{material.title}</span>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-border">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl font-semibold text-foreground mb-2">
                {material.title}
              </DialogTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{material.type}</Badge>
                <Badge variant="outline">{material.subject}</Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6">
          {/* Preview Area */}
          <div className="mb-6">
            {getPreviewContent()}
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            {material.preview}
          </p>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6 pb-6 border-b border-border">
            <span className="flex items-center gap-2">
              <User className="w-4 h-4" />
              {material.contributor}
            </span>
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {material.date}
            </span>
            <span className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              {material.downloads} downloads
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Close
            </Button>
            <Button className="flex-1" onClick={onDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MaterialPreviewModal;
