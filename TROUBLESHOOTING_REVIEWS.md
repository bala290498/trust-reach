# Troubleshooting: Reviews Not Showing

## Quick Fixes to Try

### 1. **Hard Refresh Your Browser**
The cache fix requires a hard refresh to clear browser cache:
- **Chrome/Edge**: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
- **Firefox**: `Ctrl + F5` (Windows) or `Cmd + Shift + R` (Mac)

### 2. **Check Company Name Matching**
The review's `company_name` must **exactly match** the brand's `brand_name` (case-insensitive, but must match exactly).

**To verify:**
1. Go to "My Activity" page
2. Check the exact `company_name` of your review
3. Go to the brand page
4. Check the exact `brand_name` 
5. They must match exactly (ignoring case)

**Common mismatches:**
- "Apple" vs "Apple Inc"
- "Microsoft" vs "Microsoft Corporation"
- Extra spaces: "Apple " vs "Apple"

### 3. **Wait for Cache to Expire**
If you don't see reviews immediately:
- Cache expires after 1 minute
- Wait 1 minute and refresh the page
- Reviews should appear

### 4. **Create a New Review**
After the code changes:
1. Create a new review
2. It should appear immediately (cache bypass is active)
3. This confirms the fix is working

## What Was Fixed

1. ✅ **Cache Bypass**: After creating a review, cache is bypassed to show fresh data
2. ✅ **Company Name Matching**: Improved matching to handle case-insensitive exact matches
3. ✅ **Fresh Data Fetch**: Brand pages now fetch fresh data after review creation

## If Reviews Still Don't Show

### Check Database Directly
1. Go to Supabase Dashboard
2. Check `company_reviews` table
3. Verify:
   - Review exists ✅
   - `company_name` matches brand name exactly ✅
   - `created_at` is recent ✅

### Check Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for errors when:
   - Loading brand page
   - Creating a review
   - Fetching reviews

### Check Network Tab
1. Open browser DevTools (F12)
2. Go to Network tab
3. Filter by "reviews"
4. Check:
   - API calls are being made
   - Response contains your reviews
   - Status is 200 (success)

## Still Not Working?

If reviews still don't show after trying the above:
1. Check if `company_name` in database exactly matches `brand_name`
2. Verify the brand page is using the correct brand name
3. Check for any console errors
4. Try creating a new review to test the cache bypass


