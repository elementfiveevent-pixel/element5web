import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toDisplayUrl } from "@/lib/storageProxy";

interface BookCarouselProps {
  images: string[];
  title: string;
}

const BookCarousel = ({ images, title }: BookCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Convert stored paths (e.g. "book-images:userId/file.jpg") to proxy URLs
  const resolvedImages = useMemo(() => {
    return (images || [])
      .map(img => toDisplayUrl(img, { forceImage: true }))
      .filter((url): url is string => url !== null);
  }, [images]);

  if (!resolvedImages || resolvedImages.length === 0) {
    return (
      <div className="w-full aspect-[4/3] bg-accent flex items-center justify-center rounded-xl">
        <BookOpen className="w-16 h-16 text-primary" />
      </div>
    );
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? resolvedImages.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === resolvedImages.length - 1 ? 0 : prev + 1));
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div className="relative">
      {/* Main Image */}
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-accent">
        <img
          src={resolvedImages[currentIndex]}
          alt={`${title} - Image ${currentIndex + 1}`}
          className="w-full h-full object-contain"
        />

        {/* Navigation Arrows */}
        {resolvedImages.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full shadow-lg opacity-80 hover:opacity-100"
              onClick={goToPrevious}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full shadow-lg opacity-80 hover:opacity-100"
              onClick={goToNext}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </>
        )}

        {/* Image Counter */}
        {resolvedImages.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-background/80 backdrop-blur-sm text-foreground text-sm px-3 py-1 rounded-full">
            {currentIndex + 1} / {resolvedImages.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {resolvedImages.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
          {resolvedImages.map((img, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                index === currentIndex
                  ? "border-primary shadow-md"
                  : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <img
                src={img}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookCarousel;
