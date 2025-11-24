# TrustReach.in

A platform for trusted company reviews.

## Features

- **Sticky Navigation Bar** with logo and menu items
- **Homepage Review Section** - Add and view company reviews
- **Category-wise Carousels** with filtering options
- **Supabase Integration** for reviews and authentication
- **Supabase Auth with Google OAuth** - User authentication for adding/modifying/deleting reviews

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

```

**Note:** Supabase has changed from `SUPABASE_SERVICE_ROLE_KEY` to `SUPABASE_SERVICE_ROLE_SECRET`. 
The service role secret key is only needed for server-side operations that bypass RLS policies.

3. Set up Supabase Authentication with Google OAuth:
   - Go to your Supabase Dashboard: https://supabase.com/dashboard/project/vmwvlrymgkcgahdgoqfo/auth/providers
   - Enable the Google provider
   - Add your Google OAuth Client ID and Secret
   - Add redirect URLs:
     - For development: `http://localhost:3000/auth/callback`
     - For production: `https://yourdomain.com/auth/callback`
   - Add site URL: `http://localhost:3000` (for development) and your production URL

4. Set up Supabase tables:
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Run the SQL script from `supabase-schema.sql` file
   - This will create the necessary tables, indexes, and security policies

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

- `app/` - Next.js app router pages
- `components/` - Reusable React components
- `lib/` - Utility functions and Supabase client

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
- Supabase (Database & Authentication)
- Supabase Auth with Google OAuth
- React Markdown

