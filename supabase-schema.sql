-- TrustReach.in Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Company Reviews Table
CREATE TABLE IF NOT EXISTS company_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  company_name TEXT NOT NULL,
  website_url TEXT,
  category TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product Listings Table
CREATE TABLE IF NOT EXISTS product_listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  platform_name TEXT NOT NULL,
  category TEXT NOT NULL,
  url TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_company_reviews_category ON company_reviews(category);
CREATE INDEX IF NOT EXISTS idx_company_reviews_rating ON company_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_company_reviews_created_at ON company_reviews(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_product_listings_category ON product_listings(category);
CREATE INDEX IF NOT EXISTS idx_product_listings_rating ON product_listings(rating);
CREATE INDEX IF NOT EXISTS idx_product_listings_platform ON product_listings(platform_name);
CREATE INDEX IF NOT EXISTS idx_product_listings_created_at ON product_listings(created_at DESC);

-- Enable Row Level Security (RLS) - Allow public read, authenticated write
ALTER TABLE company_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_listings ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to read
CREATE POLICY "Allow public read access on company_reviews"
  ON company_reviews FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access on product_listings"
  ON product_listings FOR SELECT
  USING (true);

-- Policy: Allow anyone to insert (for public submissions)
CREATE POLICY "Allow public insert on company_reviews"
  ON company_reviews FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public insert on product_listings"
  ON product_listings FOR INSERT
  WITH CHECK (true);

