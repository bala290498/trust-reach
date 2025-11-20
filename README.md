# TrustReach.in

A platform for trusted company reviews, ecommerce product listings, and best offers.

## Features

- **Sticky Navigation Bar** with logo and menu items
- **Homepage Review Section** - Add and view company reviews
- **Ecommerce Product Listings** - Add and view product reviews
- **Best Offers/Stock Clearances** - Manually updated offers via markdown
- **Category-wise Carousels** with filtering options
- **Supabase Integration** for reviews and product listings
- **OTP Verification** - Email-based OTP verification using Brevo for adding/modifying/deleting reviews and products

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

# Brevo (formerly Sendinblue) Configuration for OTP Verification
# Get your API key from: https://app.brevo.com/settings/keys/api
BREVO_API_KEY=your_brevo_api_key_here

# Brevo Sender Configuration (Optional)
# The email address that will send OTP emails
# Must be verified in your Brevo account
BREVO_SENDER_EMAIL=noreply@trustreach.in
BREVO_SENDER_NAME=TrustReach
```

**Note:** Supabase has changed from `SUPABASE_SERVICE_ROLE_KEY` to `SUPABASE_SERVICE_ROLE_SECRET`. 
The service role secret key is only needed for server-side operations that bypass RLS policies.

5. Set up Brevo for OTP Verification:
   - Sign up for a free account at [Brevo](https://www.brevo.com/) (formerly Sendinblue)
   - Go to Settings > API Keys and create a new API key
   - Add the API key to your `.env.local` file as `BREVO_API_KEY`
   - Verify your sender email address in Brevo (Settings > Senders)
   - Update `BREVO_SENDER_EMAIL` and `BREVO_SENDER_NAME` in `.env.local` if needed
   - **Note:** In development mode, OTPs will be logged to console. In production, OTPs are sent via email only.

3. Set up Supabase tables:
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Run the SQL script from `supabase-schema.sql` file
   - This will create the necessary tables, indexes, and security policies

4. For Best Offers, create markdown files in `content/offers/` directory:

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
- `content/offers/` - Markdown files for best offers

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

