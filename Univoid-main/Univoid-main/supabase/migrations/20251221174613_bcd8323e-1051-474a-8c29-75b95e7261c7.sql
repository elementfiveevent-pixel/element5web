-- First migration: Add the admin_assistant enum value
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin_assistant';