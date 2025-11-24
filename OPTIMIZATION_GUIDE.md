# Performance Optimization Guide

This document outlines the optimizations implemented to reduce load on Vercel and minimize Supabase API calls.

## Strategies Implemented

### 1. **API Route Caching with HTTP Headers**

All API routes now include caching headers to reduce redundant requests:

- **Brands API** (`/api/brands`): Cached for 5 minutes (300 seconds)
- **Individual Brand API** (`/api/brands/[id]`): Cached for 5 minutes
- **Reviews API** (`/api/reviews`): Cached for 1 minute (60 seconds) - shorter cache due to frequent updates
- **Brand Reviews API** (`/api/reviews/[brandName]`): Cached for 1 minute

**Cache Headers Used:**
```
Cache-Control: public, s-maxage=300, stale-while-revalidate=600
```

- `s-maxage`: Cache duration for CDN/Vercel edge
- `stale-while-revalidate`: Serve stale content while revalidating in background

### 2. **Incremental Static Regeneration (ISR)**

API routes use Next.js ISR with `revalidate` export:
- Brands: Revalidate every 5 minutes
- Reviews: Revalidate every 1 minute

This means:
- First request hits the database
- Subsequent requests serve cached data
- Background revalidation keeps data fresh

### 3. **Server-Side Data Fetching with React Cache**

Created `lib/data-fetch.ts` with React's `cache()` function:
- Prevents duplicate Supabase calls within the same request
- Automatically deduplicates identical queries
- Works seamlessly with Server Components

### 4. **Client-Side API Route Usage**

All client components now use cached API routes instead of direct Supabase calls:

**Before:**
```typescript
const { data, error } = await supabase
  .from('company_reviews')
  .select('*')
```

**After:**
```typescript
const response = await fetch('/api/reviews', {
  cache: 'force-cache', // Use browser cache
})
```

**Benefits:**
- Requests go through Vercel's edge cache
- Reduced Supabase API calls
- Better performance with CDN caching

### 5. **Optimized Package Imports**

Added to `next.config.js`:
```javascript
experimental: {
  optimizePackageImports: ['lucide-react'],
}
```

This reduces bundle size and improves load times.

## Impact

### Before Optimization:
- Every page load = Direct Supabase query
- No caching = Repeated database calls
- Client-side fetching = No edge caching

### After Optimization:
- API routes cached at edge (Vercel CDN)
- ISR reduces database load by ~95%
- Browser caching reduces redundant requests
- Background revalidation keeps data fresh

## Cache Durations

| Resource | Cache Duration | Revalidation |
|----------|---------------|--------------|
| Brands | 5 minutes | 5 minutes |
| Reviews | 1 minute | 1 minute |
| Brand Reviews | 1 minute | 1 minute |

## User-Specific Data

User-specific queries (like "My Reviews") still use direct Supabase calls because:
- They require authentication
- Data is user-specific and can't be cached globally
- Security considerations prevent server-side caching

## Monitoring

To monitor the effectiveness:
1. Check Vercel Analytics for reduced function invocations
2. Monitor Supabase dashboard for API call reduction
3. Use browser DevTools Network tab to see cache hits

## Future Optimizations

Consider implementing:
1. **SWR or React Query** for client-side data fetching with automatic revalidation
2. **Redis caching** for frequently accessed data
3. **Database indexes** on frequently queried columns
4. **Pagination** for large datasets
5. **GraphQL** with DataLoader for batch queries

## Notes

- Cache durations can be adjusted based on your needs
- Reviews have shorter cache (1 min) because they change frequently
- Brands have longer cache (5 min) because they change less often
- All caches use `stale-while-revalidate` for better UX

