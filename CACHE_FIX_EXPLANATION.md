# Cache Issue Fix - Reviews Not Showing After Creation

## Problem Identified

After creating a review, it wasn't appearing in:
1. Brand pages (under review section)
2. Recent reviews section (homepage)

**Root Cause**: 
- API routes are cached for 1 minute
- After creating a review, `fetchReviews()` was called with `cache: 'force-cache'`
- This returned stale cached data that didn't include the new review
- Cache only expires after 1 minute, so new reviews were invisible until then

## Fixes Applied

### 1. **Cache Bypass After Review Creation**

**Homepage (`app/page.tsx`)**:
- Modified `fetchReviews()` to accept `bypassCache` parameter
- After review creation, calls `fetchReviews(true)` to bypass cache
- Uses `cache: 'no-store'` and adds timestamp query parameter

**Brand Pages (`app/brands/[slug]/page.tsx`)**:
- Modified `fetchReviews()` to accept `bypassCache` parameter  
- After review creation, calls `fetchReviews(brandName, true)` to bypass cache
- Uses `cache: 'no-store'` and adds timestamp query parameter

**Company Pages (`app/companies/[slug]/page.tsx`)**:
- Changed to always use `cache: 'no-store'` for fresh data
- Added timestamp query parameter to force fresh fetch

### 2. **Company Name Matching**

**API Route (`app/api/reviews/[brandName]/route.ts`)**:
- Kept `.ilike()` for case-insensitive matching
- Added comments explaining the matching behavior
- This ensures reviews match brand names regardless of case differences

## How It Works Now

### Before Fix:
```
1. User creates review → Saved to database ✅
2. fetchReviews() called → Returns cached data (old) ❌
3. User sees: No new review (until cache expires in 1 min)
```

### After Fix:
```
1. User creates review → Saved to database ✅
2. fetchReviews(true) called → Bypasses cache, fetches fresh data ✅
3. User sees: New review immediately ✅
```

## Code Changes

### Homepage Review Creation:
```typescript
// After successful review submission
fetchReviews(true) // Bypass cache to get fresh data
```

### Brand Page Review Creation:
```typescript
// After successful review submission
fetchReviews(brand?.brand_name || '', true) // Bypass cache
```

### Fetch Functions:
```typescript
const fetchReviews = useCallback(async (bypassCache = false) => {
  const cacheOption = bypassCache ? 'no-store' : 'force-cache'
  const url = bypassCache ? `/api/reviews?t=${Date.now()}` : '/api/reviews'
  
  const response = await fetch(url, {
    cache: cacheOption,
  })
  // ...
}, [])
```

## Testing

To verify the fix works:
1. Create a new review from homepage
2. Check if it appears in "Recent Reviews" section immediately ✅
3. Go to the brand page
4. Check if review appears in brand's review section immediately ✅

## Note

- Normal page loads still use caching (performance optimization)
- Only after creating/updating reviews, cache is bypassed
- This gives best of both worlds: performance + fresh data when needed


