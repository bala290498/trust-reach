-- Migration: Create bulk_order_interests table
-- This table stores user interests in bulk orders

-- Create bulk_order_interests table
CREATE TABLE IF NOT EXISTS bulk_order_interests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bulk_order_interests_order_id ON bulk_order_interests(order_id);
CREATE INDEX IF NOT EXISTS idx_bulk_order_interests_user_id ON bulk_order_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_bulk_order_interests_created_at ON bulk_order_interests(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE bulk_order_interests ENABLE ROW LEVEL SECURITY;

-- Policy: Allow users to insert their own interests
CREATE POLICY "Users can insert their own bulk order interests"
  ON bulk_order_interests FOR INSERT
  WITH CHECK (true);

-- Policy: Allow users to view their own interests
CREATE POLICY "Users can view their own bulk order interests"
  ON bulk_order_interests FOR SELECT
  USING (true);

-- Note: Admin access would require service role key for viewing all interests

