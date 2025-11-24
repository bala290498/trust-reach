import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

interface BrandCard {
  id: string
  brand_name: string
  url?: string
  category: string
  email?: string
  phone?: string
  address?: string
  about: string
  created_at: string
}

export async function GET() {
  try {
    const brandsDirectory = path.join(process.cwd(), 'content', 'brands')
    
    // Check if directory exists
    if (!fs.existsSync(brandsDirectory)) {
      return NextResponse.json([])
    }

    const files = fs.readdirSync(brandsDirectory)
    const brands: BrandCard[] = []

    for (const file of files) {
      if (file.endsWith('.md')) {
        const filePath = path.join(brandsDirectory, file)
        const fileContents = fs.readFileSync(filePath, 'utf8')
        
        // Simple markdown frontmatter parser
        const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/
        const match = fileContents.match(frontmatterRegex)
        
        let data: any = {}
        let content = fileContents
        
        if (match) {
          content = match[2]
          const frontmatter = match[1]
          frontmatter.split('\n').forEach((line) => {
            const [key, ...valueParts] = line.split(':')
            if (key && valueParts.length > 0) {
              const value = valueParts.join(':').trim().replace(/^["']|["']$/g, '')
              data[key.trim()] = value
            }
          })
        }

        // Extract About section - everything from ## About until ## Reviews or end of file
        // This includes ## Contact Info if present
        let about = ''
        const aboutMatch = content.match(/##\s*About\s*\n([\s\S]*?)(?=\n##\s*Reviews|$)/i)
        
        if (aboutMatch) {
          // Include the "## About" heading in the content
          about = '## About\n\n' + aboutMatch[1].trim()
        } else {
          // If no About section found, use all content (removing any Reviews section)
          const reviewsMatch = content.match(/##\s*Reviews/i)
          if (reviewsMatch && reviewsMatch.index !== undefined) {
            about = content.substring(0, reviewsMatch.index).trim()
          } else {
            about = content.trim()
          }
        }

        brands.push({
          id: file.replace('.md', ''),
          brand_name: data.brand_name || data.business_name || '',
          url: data.url || data.website_url || '',
          category: data.category || '',
          email: data.email || undefined,
          phone: data.phone || undefined,
          address: data.address || undefined,
          about: about,
          created_at: data.created_at || new Date().toISOString(),
        })
      }
    }

    // Sort by created_at descending
    brands.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    // Add caching headers - cache for 5 minutes, revalidate in background
    return NextResponse.json(brands, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (error) {
    console.error('Error reading brands:', error)
    return NextResponse.json([], { status: 500 })
  }
}

// Enable ISR (Incremental Static Regeneration)
export const revalidate = 300 // Revalidate every 5 minutes


