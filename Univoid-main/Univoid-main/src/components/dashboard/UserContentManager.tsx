import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { FileText, Newspaper, BookOpen, Loader2, AlertTriangle } from "lucide-react";
import DeleteButton from "@/components/common/DeleteButton";
import { 
  getUserMaterials, 
  getUserNews, 
  getUserBooks,
  deleteMaterial,
  deleteNews,
  deleteBook
} from "@/services/contentService";
import { updateBookStatus, BookStatus } from "@/services/booksService";
import { Material, News, Book } from "@/types/database";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserContentManagerProps {
  userId: string;
}

const UserContentManager = ({ userId }: UserContentManagerProps) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("materials");
  const isMounted = useRef(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  
  // Book status change dialog state
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [newStatus, setNewStatus] = useState<BookStatus | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchAllContent = useCallback(async () => {
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Content fetch timeout')), 8000)
      );

      const fetchPromise = Promise.all([
        getUserMaterials(userId),
        getUserNews(userId),
        getUserBooks(userId),
      ]);

      const [mats, nws, bks] = await Promise.race([
        fetchPromise,
        timeoutPromise,
      ]) as Awaited<typeof fetchPromise>;

      if (isMounted.current) {
        setMaterials(mats);
        setNews(nws);
        setBooks(bks);
      }
    } catch (error) {
      console.error("Error fetching user content:", error);
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [userId]);

  useEffect(() => {
    isMounted.current = true;

    // Safety timeout
    const safetyTimeout = setTimeout(() => {
      if (isMounted.current && isLoading) {
        setIsLoading(false);
      }
    }, 10000);

    fetchAllContent();

    // Cleanup existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Single channel for all user content
    channelRef.current = supabase
      .channel(`user-content-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "materials", filter: `created_by=eq.${userId}` }, fetchAllContent)
      .on("postgres_changes", { event: "*", schema: "public", table: "news", filter: `created_by=eq.${userId}` }, fetchAllContent)
      .on("postgres_changes", { event: "*", schema: "public", table: "books", filter: `created_by=eq.${userId}` }, fetchAllContent)
      .subscribe();

    return () => {
      isMounted.current = false;
      clearTimeout(safetyTimeout);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId, fetchAllContent]);

  const handleDeleteMaterial = async (id: string) => {
    return deleteMaterial(id, userId);
  };

  const handleDeleteNews = async (id: string) => {
    return deleteNews(id, userId);
  };

  const handleDeleteBook = async (id: string) => {
    return deleteBook(id, userId);
  };

  // Handle book status update with confirmation
  const handleStatusChange = async () => {
    if (!selectedBook || !newStatus) return;
    
    setIsUpdatingStatus(true);
    const { error } = await updateBookStatus(selectedBook.id, newStatus);
    setIsUpdatingStatus(false);
    
    if (error) {
      toast.error("Failed to update book status");
    } else {
      toast.success(`Book marked as ${newStatus}`);
      fetchAllContent();
    }
    
    setSelectedBook(null);
    setNewStatus(null);
  };

  const openStatusDialog = (book: Book, status: BookStatus) => {
    setSelectedBook(book);
    setNewStatus(status);
  };

  const getBookStatusBadge = (book: Book) => {
    const status = (book as any).book_status as BookStatus || 'available';
    switch (status) {
      case 'sold':
        return <Badge variant="destructive" className="text-xs">Sold Out</Badge>;
      case 'rented':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-xs">Rented</Badge>;
      default:
        return <Badge className="bg-green-600 hover:bg-green-700 text-xs">Available</Badge>;
    }
  };

  const isBookAvailable = (book: Book) => {
    const status = (book as any).book_status as BookStatus || 'available';
    return status === 'available' && !book.is_sold;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const totalCount = materials.length + news.length + books.length;

  if (totalCount === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Your Content</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="materials" className="text-xs">
              <FileText className="w-3 h-3 mr-1" />
              {materials.length}
            </TabsTrigger>
            <TabsTrigger value="news" className="text-xs">
              <Newspaper className="w-3 h-3 mr-1" />
              {news.length}
            </TabsTrigger>
            <TabsTrigger value="books" className="text-xs">
              <BookOpen className="w-3 h-3 mr-1" />
              {books.length}
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[200px] mt-3">
            <TabsContent value="materials" className="mt-0 space-y-2">
              {materials.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No materials yet</p>
              ) : (
                materials.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.file_type?.toUpperCase()}</p>
                    </div>
                    <DeleteButton onDelete={() => handleDeleteMaterial(item.id)} />
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="news" className="mt-0 space-y-2">
              {news.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No news yet</p>
              ) : (
                news.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                      <Badge variant="secondary" className="text-xs">{item.status}</Badge>
                    </div>
                    <DeleteButton onDelete={() => handleDeleteNews(item.id)} />
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="books" className="mt-0 space-y-2">
              {books.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No books yet</p>
              ) : (
                books.map((item) => {
                  const available = isBookAvailable(item);
                  return (
                    <div key={item.id} className={`flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50 ${!available ? 'opacity-75' : ''}`}>
                      <div className="flex gap-2 flex-1 min-w-0">
                        {/* Book thumbnail */}
                        {item.image_urls && item.image_urls.length > 0 && (
                          <div className="w-10 h-14 flex-shrink-0 rounded overflow-hidden bg-secondary">
                            <img src={item.image_urls[0]} alt={item.title} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {getBookStatusBadge(item)}
                            {item.price && <Badge variant="secondary" className="text-xs">₹{item.price}</Badge>}
                          </div>
                          {/* Action buttons for available books */}
                          {available && (
                            <div className="flex gap-1 mt-1.5">
                              {item.listing_type === 'rent' ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 px-2 text-xs text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                                  onClick={() => openStatusDialog(item, 'rented')}
                                >
                                  Mark Rented
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 px-2 text-xs text-destructive border-destructive hover:bg-destructive/10"
                                  onClick={() => openStatusDialog(item, 'sold')}
                                >
                                  Mark Sold
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <DeleteButton onDelete={() => handleDeleteBook(item.id)} />
                    </div>
                  );
                })
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </CardContent>

      {/* Caution Dialog for marking as sold/rented */}
      <AlertDialog open={!!selectedBook} onOpenChange={() => setSelectedBook(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Confirm Status Change
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 my-4">
                <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                  ⚠️ Please mark this book as <strong>{newStatus?.toUpperCase()}</strong> only if it has been successfully {newStatus === 'sold' ? 'sold' : 'rented'} via WhatsApp.
                </p>
                <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-2">
                  Once marked, buyers will no longer be able to contact you for this book.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdatingStatus}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStatusChange}
              disabled={isUpdatingStatus}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isUpdatingStatus ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                `Yes, Mark as ${newStatus === 'sold' ? 'Sold' : 'Rented'}`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default UserContentManager;
