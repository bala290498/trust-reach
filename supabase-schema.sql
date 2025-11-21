-- TrustReach.in Database Schema - Reviews Only
-- Run this SQL in your Supabase SQL Editor
-- WARNING: This will drop existing tables and all data. Make sure to backup if needed.

-- Drop existing tables if they exist (in reverse order of dependencies)
-- Drop policies first
DROP POLICY IF EXISTS "Allow public read access on company_reviews" ON company_reviews;
DROP POLICY IF EXISTS "Allow public insert on company_reviews" ON company_reviews;
DROP POLICY IF EXISTS "Allow authenticated insert on company_reviews" ON company_reviews;
DROP POLICY IF EXISTS "Allow users to update own reviews" ON company_reviews;
DROP POLICY IF EXISTS "Allow public update on company_reviews" ON company_reviews;
DROP POLICY IF EXISTS "Allow users to delete own reviews" ON company_reviews;
DROP POLICY IF EXISTS "Allow public delete on company_reviews" ON company_reviews;
DROP POLICY IF EXISTS "Allow public read access on product_listings" ON product_listings;
DROP POLICY IF EXISTS "Allow public insert on product_listings" ON product_listings;
DROP POLICY IF EXISTS "Allow public insert on bulk_order_interests" ON bulk_order_interests;

-- Drop tables
DROP TABLE IF EXISTS company_reviews CASCADE;
DROP TABLE IF EXISTS product_listings CASCADE;
DROP TABLE IF EXISTS bulk_order_interests CASCADE;

-- Company Reviews Table (Simplified - No phone, website_url, or category)
CREATE TABLE company_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT,
  email TEXT NOT NULL,
  company_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_company_reviews_company_name ON company_reviews(company_name);
CREATE INDEX idx_company_reviews_rating ON company_reviews(rating);
CREATE INDEX idx_company_reviews_created_at ON company_reviews(created_at DESC);
CREATE INDEX idx_company_reviews_user_id ON company_reviews(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE company_reviews ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to read reviews
CREATE POLICY "Allow public read access on company_reviews"
  ON company_reviews FOR SELECT
  USING (true);

-- Policy: Allow anyone to insert reviews (Clerk handles authentication)
CREATE POLICY "Allow public insert on company_reviews"
  ON company_reviews FOR INSERT
  WITH CHECK (true);

-- Policy: Allow users to update their own reviews (checked via API)
CREATE POLICY "Allow public update on company_reviews"
  ON company_reviews FOR UPDATE
  USING (true);

-- Policy: Allow users to delete their own reviews (checked via API)
CREATE POLICY "Allow public delete on company_reviews"
  ON company_reviews FOR DELETE
  USING (true);

-- Bulk Order Interests Table (Only email and phone)
CREATE TABLE bulk_order_interests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better query performance
CREATE INDEX idx_bulk_order_interests_email ON bulk_order_interests(email);
CREATE INDEX idx_bulk_order_interests_created_at ON bulk_order_interests(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE bulk_order_interests ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public insert on bulk_order_interests
CREATE POLICY "Allow public insert on bulk_order_interests"
  ON bulk_order_interests FOR INSERT
  WITH CHECK (true);
