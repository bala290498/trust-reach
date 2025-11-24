# TrustReach.in

A platform for trusted company reviews and promotions.

## Features

- **Sticky Navigation Bar** with logo and menu items
- **Homepage Review Section** - Add and view company reviews
- **Promotions/Stock Clearances** - Manually updated offers via markdown
- **Category-wise Carousels** with filtering options
- **Supabase Integration** for reviews
- **Clerk Authentication** - User authentication for adding/modifying/deleting reviews

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env.local` file (copy from `env.example`):
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: For server-side operations only
# Get from: Supabase Dashboard > Project Settings > API > Secret Keys
# SUPABASE_SERVICE_ROLE_SECRET=your_service_role_secret_key

# Clerk Authentication Configuration
# Get your keys from: https://dashboard.clerk.com/
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
```

**Note:** Supabase has changed from `SUPABASE_SERVICE_ROLE_KEY` to `SUPABASE_SERVICE_ROLE_SECRET`. 
The service role secret key is only needed for server-side operations that bypass RLS policies.

3. Set up Clerk Authentication:
   - Sign up for a free account at [Clerk](https://clerk.com/)
   - Create a new application
   - Copy your Publishable Key and Secret Key from the dashboard
   - Add them to your `.env.local` file

4. Set up Supabase tables:
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Run the SQL script from `supabase-schema.sql` file
   - This will create the necessary tables, indexes, and security policies

4. For Promotions, create markdown files in `content/offers/` directory:

Example: `content/offers/example-offer.md`
```markdown
---
business_name: Example Business
url: https://example.com
category: Electronics & Technology
services: "Premium electronics and gadgets"
offer_deals: "50% off on all products"
quantity_left: "100 products"
verified: true
created_at: 2024-01-01T00:00:00Z
---

Additional details about the offer can be written here in markdown format.
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

- `app/` - Next.js app router pages
- `components/` - Reusable React components
- `lib/` - Utility functions and Supabase client
- `content/offers/` - Markdown files for promotions

## Supabase Client Usage

### Client-Side (Default)
Use `lib/supabase.ts` for client-side operations:
```typescript
import { supabase } from '@/lib/supabase'
// Uses NEXT_PUBLIC_SUPABASE_ANON_KEY
// Respects Row Level Security (RLS) policies
```

### Server-Side (Optional)
Use `lib/supabase-server.ts` for server-side operations that need to bypass RLS:
```typescript
import { supabaseServer } from '@/lib/supabase-server'
// Uses SUPABASE_SERVICE_ROLE_SECRET
// Bypasses RLS policies - use with caution!
// Only use in API routes, Server Components, or server-side code
```

**Important:** Never expose `SUPABASE_SERVICE_ROLE_SECRET` in client-side code!

## Technologies

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Supabase
- React Markdown

