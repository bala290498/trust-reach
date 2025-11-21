/**
 * Generate a URL-friendly slug from a company name
 * @param name - The company name to convert to a slug
 * @returns A URL-friendly slug
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

/**
 * Decode a slug back to a company name (approximate)
 * Note: This is a best-effort reconstruction since slugs lose some information
 * @param slug - The slug to decode
 * @returns The decoded company name (approximate)
 */
export function decodeSlug(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

