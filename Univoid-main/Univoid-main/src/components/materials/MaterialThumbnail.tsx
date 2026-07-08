import { FileText, Image, FileSpreadsheet, File } from "lucide-react";

interface MaterialThumbnailProps {
  fileType: "pdf" | "image" | "doc" | "other";
  title: string;
  thumbnailUrl?: string;
  className?: string;
}

const MaterialThumbnail = ({ fileType, title, thumbnailUrl, className = "" }: MaterialThumbnailProps) => {
  const baseClasses = `w-16 h-20 rounded-lg overflow-hidden flex-shrink-0 ${className}`;

  switch (fileType) {
    case "pdf":
      return (
        <div className={`${baseClasses} bg-gradient-to-b from-red-50 to-red-100 border border-red-200/50 flex flex-col items-center justify-center`}>
          <FileText className="w-6 h-6 text-red-500 mb-1" />
          <span className="text-[10px] font-medium text-red-600 uppercase">PDF</span>
        </div>
      );
    
    case "image":
      return (
        <div className={`${baseClasses} bg-gradient-to-b from-blue-50 to-blue-100 border border-blue-200/50`}>
          {thumbnailUrl ? (
            <img 
              src={thumbnailUrl} 
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <Image className="w-6 h-6 text-blue-500 mb-1" />
              <span className="text-[10px] font-medium text-blue-600 uppercase">IMG</span>
            </div>
          )}
        </div>
      );
    
    case "doc":
      return (
        <div className={`${baseClasses} bg-gradient-to-b from-indigo-50 to-indigo-100 border border-indigo-200/50 flex flex-col items-center justify-center`}>
          <FileSpreadsheet className="w-6 h-6 text-indigo-500 mb-1" />
          <span className="text-[10px] font-medium text-indigo-600 uppercase">DOC</span>
        </div>
      );
    
    default:
      return (
        <div className={`${baseClasses} bg-gradient-to-b from-muted to-muted/80 border border-border flex flex-col items-center justify-center`}>
          <File className="w-6 h-6 text-muted-foreground mb-1" />
          <span className="text-[10px] font-medium text-muted-foreground uppercase">FILE</span>
        </div>
      );
  }
};

export default MaterialThumbnail;
