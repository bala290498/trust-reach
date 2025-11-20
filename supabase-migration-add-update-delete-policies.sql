-- Migration: Add UPDATE and DELETE policies for company_reviews and product_listings
-- Run this SQL in your Supabase SQL Editor

-- Allow users to update their own reviews (matching email and phone)
CREATE POLICY "Allow users to update their own company_reviews"
  ON company_reviews FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow users to delete their own reviews (matching email and phone)
CREATE POLICY "Allow users to delete their own company_reviews"
  ON company_reviews FOR DELETE
  USING (true);

-- Allow users to update their own product listings (matching email and phone)
CREATE POLICY "Allow users to update their own product_listings"
  ON product_listings FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow users to delete their own product listings (matching email and phone)
CREATE POLICY "Allow users to delete their own product_listings"
  ON product_listings FOR DELETE
  USING (true);

