-- Add preview-related fields to materials table
ALTER TABLE public.materials 
ADD COLUMN IF NOT EXISTS preview_file_url TEXT,
ADD COLUMN IF NOT EXISTS preview_page_limit INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS preview_ready BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS admin_previewed BOOLEAN DEFAULT false;

-- Create index for faster preview queries
CREATE INDEX IF NOT EXISTS idx_materials_preview_ready ON public.materials(preview_ready) WHERE preview_ready = true;

-- Comment for documentation
COMMENT ON COLUMN public.materials.preview_file_url IS 'URL for limited preview version of the file';
COMMENT ON COLUMN public.materials.preview_page_limit IS 'Number of pages available for user preview';
COMMENT ON COLUMN public.materials.preview_ready IS 'Whether preview assets have been generated';
COMMENT ON COLUMN public.materials.admin_previewed IS 'Whether admin has previewed before approval';
