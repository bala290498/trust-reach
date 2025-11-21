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

    // Try to find the file by ID (slug)
    const filePath = path.join(brandsDirectory, `${id}.md`)
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Brand not found' },
        { status: 404 }
      )
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

    const brand: BrandCard = {
      id: id,
      brand_name: data.brand_name || data.business_name || '',
      url: data.url || data.website_url || '',
      category: data.category || '',
      email: data.email || undefined,
      phone: data.phone || undefined,
      address: data.address || undefined,
      about: about,
      created_at: data.created_at || new Date().toISOString(),
    }

    return NextResponse.json(brand)
  } catch (error) {
    console.error('Error reading brand:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


