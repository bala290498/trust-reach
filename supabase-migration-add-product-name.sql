-- Migration: Add product_name column to product_listings table
-- Run this SQL in your Supabase SQL Editor

-- Add product_name column to product_listings table
ALTER TABLE product_listings 
ADD COLUMN IF NOT EXISTS product_name TEXT;

-- Create index for better search performance
CREATE INDEX IF NOT EXISTS idx_product_listings_product_name ON product_listings(product_name);

-- Update existing rows to have a default value (optional - you may want to update manually)
-- UPDATE product_listings SET product_name = platform_name WHERE product_name IS NULL;

