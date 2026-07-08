-- Add listing_type column to books table
ALTER TABLE public.books 
ADD COLUMN listing_type text DEFAULT 'sell' CHECK (listing_type IN ('sell', 'rent', 'donate', 'exchange'));

-- Update existing books based on price
UPDATE public.books 
SET listing_type = CASE 
  WHEN price IS NULL OR price = 0 THEN 'exchange'
  ELSE 'sell'
END;