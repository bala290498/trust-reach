import { NextRequest, NextResponse } from 'next/server'
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
  logo?: string
  about: string
  created_at: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const brandsDirectory = path.join(process.cwd(), 'content', 'brands')
    
    // Check if directory exists
    if (!fs.existsSync(brandsDirectory)) {
      return NextResponse.json(
        { error: 'Brand not found' },
        { status: 404 }
      )
    }

    // Try to find the file by ID (slug) - first try exact match
    let filePath = path.join(brandsDirectory, `${id}.md`)
    
    // If exact match not found, try to find by matching slug to brand_name
    if (!fs.existsSync(filePath)) {
      const files = fs.readdirSync(brandsDirectory)
      let foundFile: string | null = null
      
      for (const file of files) {
        if (file.endsWith('.md')) {
          const filePathToCheck = path.join(brandsDirectory, file)
          const fileContents = fs.readFileSync(filePathToCheck, 'utf8')
          
          // Parse frontmatter to get brand_name
          const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/
          const match = fileContents.match(frontmatterRegex)
          
          if (match) {
            const frontmatter = match[1]
            let brandName = ''
            frontmatter.split('\n').forEach((line) => {
              const [key, ...valueParts] = line.split(':')
              if (key && valueParts.length > 0) {
                const value = valueParts.join(':').trim().replace(/^["']|["']$/g, '')
                if (key.trim() === 'brand_name' || key.trim() === 'business_name') {
                  brandName = value
                }
              }
            })
            
            // Generate slug from brand_name and compare
            if (brandName) {
              const brandSlug = brandName
                .toLowerCase()
                .trim()
                .replace(/[^\w\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-+|-+$/g, '')
              
              if (brandSlug === id) {
                foundFile = file
                break
              }
            }
          }
        }
      }
      
      if (foundFile) {
        filePath = path.join(brandsDirectory, foundFile)
      } else {
        return NextResponse.json(
          { error: 'Brand not found' },
          { status: 404 }
        )
      }
    }

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

    // Get the actual filename (without .md) as the ID for consistency
    const actualId = path.basename(filePath, '.md')
    
    const brand: BrandCard = {
      id: actualId,
      brand_name: data.brand_name || data.business_name || '',
      url: data.url || data.website_url || '',
      category: data.category || '',
      email: data.email || undefined,
      phone: data.phone || undefined,
      address: data.address || undefined,
      logo: data.logo || undefined,
      about: about,
      created_at: data.created_at || new Date().toISOString(),
    }

    // Add caching headers - cache for 5 minutes, revalidate in background
    return NextResponse.json(brand, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (error) {
    console.error('Error reading brand:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Enable ISR (Incremental Static Regeneration)
export const revalidate = 300 // Revalidate every 5 minutes


