import { useState } from "react";
import { toDisplayUrl } from "@/lib/storageProxy";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Book, Loader2, AlertTriangle, Clock, RefreshCw } from "lucide-react";
import { Book as BookType } from "@/types/database";
import { updateBookStatus } from "@/services/booksService";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface MyBooksSectionProps {
  books: BookType[];
  isLoading: boolean;
  onRefresh: () => void;
}

type BookStatus = 'available' | 'sold' | 'rented';

const BOOK_EXPIRY_DAYS = 15;
const EXPIRY_WARNING_DAYS = 3; // Warn when 3 or fewer days left

const getDaysRemaining = (createdAt: string): number => {
  const created = new Date(createdAt);
  const now = new Date();
  const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.ceil(BOOK_EXPIRY_DAYS - diffDays));
};

const isExpiringSoon = (createdAt: string): boolean => {
  const daysRemaining = getDaysRemaining(createdAt);
  return daysRemaining <= EXPIRY_WARNING_DAYS && daysRemaining > 0;
};

const isExpired = (createdAt: string): boolean => {
  return getDaysRemaining(createdAt) === 0;
};

const getStatusBadge = (status: BookStatus, listingType?: string | null) => {
  switch (status) {
    case 'sold':
      return <Badge variant="destructive">Sold Out</Badge>;
    case 'rented':
      return <Badge className="bg-yellow-500 hover:bg-yellow-600">Rented</Badge>;
    case 'available':
    default:
      return <Badge className="bg-green-600 hover:bg-green-700">Available</Badge>;
  }
};

const getPrice = (book: BookType) => {
  if (book.listing_type === 'donate') return 'Free';
  if (book.listing_type === 'exchange') return 'Exchange';
  if (book.price) {
    return `₹${book.price}${book.listing_type === 'rent' ? '/mo' : ''}`;
  }
  return 'N/A';
};

const MyBooksSection = ({ books, isLoading, onRefresh }: MyBooksSectionProps) => {
  const [selectedBook, setSelectedBook] = useState<BookType | null>(null);
  const [newStatus, setNewStatus] = useState<BookStatus | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [actionType, setActionType] = useState<'mark' | 'relist'>('mark');

  const handleStatusChange = async () => {
    if (!selectedBook || !newStatus) return;
    
    setIsUpdating(true);
    const { error } = await updateBookStatus(selectedBook.id, newStatus);
    setIsUpdating(false);
    
    if (error) {
      toast.error("Failed to update book status");
    } else {
      toast.success(
        actionType === 'relist' 
          ? "Book is now available again!" 
          : `Book marked as ${newStatus}`
      );
      onRefresh();
    }
    
    setSelectedBook(null);
    setNewStatus(null);
  };

  const openStatusDialog = (book: BookType, status: BookStatus, type: 'mark' | 'relist' = 'mark') => {
    setSelectedBook(book);
    setNewStatus(status);
    setActionType(type);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Book className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium text-foreground mb-2">No books listed</h3>
          <p className="text-muted-foreground mb-4">
            Start by listing your first book for sale, rent, or exchange
          </p>
          <Link to="/sell-book">
            <Button>List a Book</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4">
        {books.map((book) => {
          const status = (book as any).book_status as BookStatus || 'available';
          const isAvailable = status === 'available';
          const daysRemaining = getDaysRemaining(book.created_at);
          const expiringSoon = isExpiringSoon(book.created_at);
          const expired = isExpired(book.created_at);
          
          return (
            <Card key={book.id} className={!isAvailable || expired ? "opacity-75" : ""}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* Book Cover */}
                  <div className="w-20 h-28 flex-shrink-0 bg-secondary rounded overflow-hidden relative">
                    {book.image_urls && book.image_urls.length > 0 ? (
                      <img
                        src={toDisplayUrl(book.image_urls[0], { forceImage: true }) || book.image_urls[0]}
                        alt={book.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Book className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    
                    {/* Expiry warning overlay */}
                    {isAvailable && expiringSoon && !expired && (
                      <div className="absolute inset-0 bg-yellow-500/20 flex items-center justify-center">
                        <Clock className="w-6 h-6 text-yellow-600" />
                      </div>
                    )}
                    {expired && (
                      <div className="absolute inset-0 bg-destructive/30 flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6 text-destructive" />
                      </div>
                    )}
                  </div>
                  
                  {/* Book Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-medium text-foreground truncate">{book.title}</h3>
                      {getStatusBadge(status, book.listing_type)}
                    </div>
                    
                    {/* Expiry Warning Badge */}
                    {isAvailable && (expiringSoon || expired) && (
                      <div className="mb-2">
                        {expired ? (
                          <Badge variant="destructive" className="text-xs gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Expired - Hidden from buyers
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs gap-1 border-yellow-500 text-yellow-600">
                            <Clock className="w-3 h-3" />
                            {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    <p className="text-lg font-bold text-primary mb-3">
                      {getPrice(book)}
                    </p>
                    
                    {/* Actions for available books */}
                    {isAvailable && !expired && (
                      <div className="flex flex-wrap gap-2">
                        {book.listing_type === 'rent' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                            onClick={() => openStatusDialog(book, 'rented', 'mark')}
                          >
                            Mark as Rented
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive border-destructive hover:bg-destructive/10"
                            onClick={() => openStatusDialog(book, 'sold', 'mark')}
                          >
                            Mark as Sold
                          </Button>
                        )}
                      </div>
                    )}
                    
                    {/* Relist button for sold/rented books */}
                    {!isAvailable && (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-600 hover:bg-green-50"
                          onClick={() => openStatusDialog(book, 'available', 'relist')}
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Relist Book
                        </Button>
                        <p className="text-xs text-muted-foreground w-full mt-1">
                          Make this book available to buyers again
                        </p>
                      </div>
                    )}
                    
                    {/* Expired message */}
                    {isAvailable && expired && (
                      <p className="text-xs text-destructive">
                        This listing has expired. Please create a new listing.
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Status Change Dialog */}
      <AlertDialog open={!!selectedBook} onOpenChange={() => setSelectedBook(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {actionType === 'relist' ? (
                <>
                  <RefreshCw className="w-5 h-5 text-green-500" />
                  Relist Book
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  Confirm Status Change
                </>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left">
              {actionType === 'relist' ? (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 my-4">
                  <p className="text-green-800 dark:text-green-200 text-sm">
                    This will make your book visible to buyers again. They will be able to contact you on WhatsApp.
                  </p>
                </div>
              ) : (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 my-4">
                  <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                    ⚠️ Please mark this book as <strong>{newStatus?.toUpperCase()}</strong> only if it has been successfully {newStatus === 'sold' ? 'sold' : 'rented'} via WhatsApp.
                  </p>
                  <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-2">
                    Once marked, buyers will no longer be able to contact you for this book.
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStatusChange}
              disabled={isUpdating}
              className={actionType === 'relist' 
                ? "bg-green-600 hover:bg-green-700" 
                : "bg-destructive hover:bg-destructive/90"
              }
            >
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : actionType === 'relist' ? (
                "Yes, Relist Book"
              ) : (
                `Yes, Mark as ${newStatus === 'sold' ? 'Sold' : 'Rented'}`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default MyBooksSection;
