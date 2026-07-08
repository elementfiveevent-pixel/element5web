-- Create book_status enum type
CREATE TYPE public.book_status AS ENUM ('available', 'sold', 'rented');

-- Add book_status column to books table with default 'available'
ALTER TABLE public.books ADD COLUMN book_status public.book_status NOT NULL DEFAULT 'available';

-- Migrate existing is_sold data to new status
UPDATE public.books SET book_status = 'sold' WHERE is_sold = true;

-- Create index for faster filtering by status
CREATE INDEX idx_books_book_status ON public.books(book_status);