import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { createBook, canListBook } from "@/services/booksService";
import { toast } from "sonner";
import { ArrowLeft, BookOpen, Loader2, CheckCircle, DollarSign, Repeat2, Gift, Clock, AlertTriangle } from "lucide-react";
import BookImageUpload from "@/components/books/BookImageUpload";
import BookScanner from "@/components/books/BookScanner";
import { CompressedImage } from "@/lib/imageCompression";
import { BookListingType } from "@/types/database";

const MAX_BOOK_IMAGES = 1;

const LISTING_TYPES = [
  { value: 'sell', label: 'Sell', icon: DollarSign, description: 'Set a price for your book' },
  { value: 'rent', label: 'Rent', icon: Clock, description: 'Let others rent your book' },
  { value: 'donate', label: 'Donate', icon: Gift, description: 'Give away for free' },
  { value: 'exchange', label: 'Exchange', icon: Repeat2, description: 'Swap with another book' },
] as const;

const BOOK_CATEGORIES = [
  "School",
  "College / University",
  "Entrance / Competitive",
  "Fiction",
  "Non-Fiction",
  "Other"
] as const;

const ListBook = () => {
  const { user, profile, isLoading } = useAuth();
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [description, setDescription] = useState("");
  const [condition, setCondition] = useState("");
  const [category, setCategory] = useState("");
  const [listingType, setListingType] = useState<BookListingType>("sell");
  const [price, setPrice] = useState("");
  const [images, setImages] = useState<CompressedImage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [categoryError, setCategoryError] = useState(false);

  // Handle book scanned from ISBN or cover scan (title & author only, NO category)
  const handleBookScanned = (bookInfo: { title: string; author?: string }) => {
    setTitle(bookInfo.title);
    if (bookInfo.author) {
      setAuthor(bookInfo.author);
    }
  };

  // Handle image detection (title & author only, NO category)
  const handleBookDetected = useCallback((info: { title?: string; author?: string }) => {
    if (info.title && !title) {
      setTitle(info.title);
    }
    if (info.author && !author) {
      setAuthor(info.author);
    }
  }, [title, author]);

  // Check if user can list books
  const listingPermission = canListBook(profile?.mobile_number);
  
  // Check if form is valid for submission - category is now REQUIRED
  const isFormValid = title.trim().length > 0 && images.length > 0 && category !== '' && listingPermission.canList;

  // Show price field only for sell and rent
  const showPriceField = listingType === 'sell' || listingType === 'rent';

  // Route protection is handled by ProtectedRoute wrapper
  if (!user || !profile) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error("Please enter a book title");
      return;
    }

    if (images.length === 0) {
      toast.error("Please add at least one image");
      return;
    }

    // Category is REQUIRED - no auto-detection
    if (!category) {
      toast.error("Please select a category");
      setCategoryError(true);
      return;
    }

    if (showPriceField && (!price || parseFloat(price) <= 0)) {
      toast.error(`Please enter a valid ${listingType === 'rent' ? 'rent' : ''} price`);
      return;
    }

    setIsSubmitting(true);

    // Combine author into description if provided
    const fullDescription = author 
      ? `Author: ${author}${description ? '\n' + description : ''}`
      : description;

    const { id, error } = await createBook({
      title,
      description: fullDescription || undefined,
      author: author || undefined,
      category: category || undefined,
      condition: condition || undefined,
      listing_type: listingType,
      price: showPriceField && price ? parseFloat(price) : undefined,
      seller_email: profile.email,
      seller_mobile: profile.mobile_number || '',
      seller_address: profile.college_name,
      created_by: user.id,
      images: images.map(img => img.file),
    });

    setIsSubmitting(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setIsSuccess(true);
    toast.success("Book listed successfully!");
  };

  const resetForm = () => {
    setIsSuccess(false);
    setTitle("");
    setAuthor("");
    setDescription("");
    setCondition("");
    setCategory("");
    setListingType("sell");
    setPrice("");
    setImages([]);
    setCategoryError(false);
  };

  if (isSuccess) {
    return (
      <main className="flex-1 py-8">
        <div className="container-wide max-w-lg">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Book Listed!</h2>
              <p className="text-muted-foreground mb-6">
                Your book is now live in the book exchange!
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={resetForm}>
                  List Another
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
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 py-8">
        <div className="container-wide max-w-lg">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm" className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Dashboard
            </Button>
          </Link>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                List a Book
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Listing Type Selection */}
                <div className="space-y-3">
                  <Label>What do you want to do?</Label>
                  <RadioGroup
                    value={listingType}
                    onValueChange={(value) => setListingType(value as BookListingType)}
                    className="grid grid-cols-2 gap-3"
                  >
                    {LISTING_TYPES.map((type) => {
                      const Icon = type.icon;
                      return (
                        <div key={type.value}>
                          <RadioGroupItem
                            value={type.value}
                            id={type.value}
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor={type.value}
                            className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-colors"
                          >
                            <Icon className="w-5 h-5" />
                            <span className="font-medium text-sm">{type.label}</span>
                          </Label>
                        </div>
                      );
                    })}
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label>Book Cover *</Label>
                  <BookImageUpload
                    images={images}
                    onImagesChange={setImages}
                    onBookDetected={handleBookDetected}
                    maxImages={MAX_BOOK_IMAGES}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="title">Book Title *</Label>
                    <BookScanner onBookScanned={handleBookScanned} />
                  </div>
                  <Input
                    id="title"
                    placeholder="e.g., Calculus: Early Transcendentals"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Tip: Use "Scan ISBN" to auto-fill book details
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="author">Author</Label>
                  <Input
                    id="author"
                    placeholder="e.g., James Stewart"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Additional Details</Label>
                  <Textarea
                    id="description"
                    placeholder="Edition, subject, condition notes, etc..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Category - Manual Selection Only */}
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select 
                    value={category} 
                    onValueChange={(value) => {
                      setCategory(value);
                      setCategoryError(false);
                    }}
                  >
                    <SelectTrigger className={categoryError ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {BOOK_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {categoryError && (
                    <p className="text-xs text-destructive">
                      Please select a category
                    </p>
                  )}
                </div>

                <div className={showPriceField ? "grid grid-cols-2 gap-4" : ""}>
                  <div className="space-y-2">
                    <Label htmlFor="condition">Condition</Label>
                    <Select value={condition} onValueChange={setCondition}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Like New">Like New</SelectItem>
                        <SelectItem value="Good">Good</SelectItem>
                        <SelectItem value="Fair">Fair</SelectItem>
                        <SelectItem value="Poor">Poor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {showPriceField && (
                    <div className="space-y-2">
                      <Label htmlFor="price">
                        {listingType === 'rent' ? 'Rent per Month (₹)' : 'Price (₹)'}
                      </Label>
                      <Input
                        id="price"
                        type="number"
                        min="1"
                        placeholder={listingType === 'rent' ? 'Monthly rent' : 'Enter price'}
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                {/* WhatsApp number warning */}
                {!listingPermission.canList && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {listingPermission.message}{' '}
                      <Link to="/profile/edit" className="underline font-medium">
                        Update Profile
                      </Link>
                    </AlertDescription>
                  </Alert>
                )}

                {listingPermission.canList && (
                  <div className="p-4 bg-secondary/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong className="text-foreground">Contact Info:</strong> Your WhatsApp number ({profile.mobile_number}) will be used for buyer inquiries.
                    </p>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isSubmitting || !isFormValid}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <BookOpen className="w-4 h-4 mr-2" />
                      List Book
                    </>
                  )}
                </Button>
                {!isFormValid && listingPermission.canList && (
                  <p className="text-xs text-muted-foreground text-center">
                    Add at least 1 photo and enter a book title to continue
                  </p>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ListBook;
