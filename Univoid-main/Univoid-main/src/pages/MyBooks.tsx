import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getMyBooks } from "@/services/booksService";
import { Book } from "@/types/database";
import MyBooksSection from "@/components/books/MyBooksSection";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";

const MyBooks = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBooks = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const data = await getMyBooks(user.id);
      setBooks(data);
    } catch (error) {
      console.error("Failed to fetch books:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to="/dashboard">
            <Button variant="ghost" size="sm" className="mb-2 -ml-2">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">My Books</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your listed books
          </p>
        </div>
        <Link to="/sell-book">
          <Button size="sm">
            <Plus className="w-4 h-4 mr-1" />
            List Book
          </Button>
        </Link>
      </div>

      {/* Books List */}
      <MyBooksSection 
        books={books} 
        isLoading={isLoading} 
        onRefresh={fetchBooks} 
      />
    </div>
  );
};

export default MyBooks;
