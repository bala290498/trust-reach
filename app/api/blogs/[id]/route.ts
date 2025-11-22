import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

interface Blog {
  id: string
  title: string
  author: string
  date: string
  category: string
  excerpt: string
  featured_image?: string
  tags?: string[]
  content: string
  created_at: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const filePath = path.join(process.cwd(), 'content', 'blogs', `${id}.md`)
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Blog not found' },
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
          let value = valueParts.join(':').trim().replace(/^["']|["']$/g, '')
          
          // Handle array values (tags)
          if (key.trim() === 'tags' && value.startsWith('[') && value.endsWith(']')) {
            value = value.slice(1, -1)
            data[key.trim()] = value.split(',').map((tag: string) => tag.trim().replace(/^["']|["']$/g, ''))
          } else {
            data[key.trim()] = value
          }
        }
      })
    }

    const blog: Blog = {
      id: id,
      title: data.title || '',
      author: data.author || 'Admin',
      date: data.date || data.created_at || new Date().toISOString(),
      category: data.category || 'General',
      excerpt: data.excerpt || content.substring(0, 150) + '...',
      featured_image: data.featured_image,
      tags: data.tags || [],
      content: content,
      created_at: data.created_at || data.date || new Date().toISOString(),
    }

    return NextResponse.json(blog)
  } catch (error) {
    console.error('Error reading blog:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

