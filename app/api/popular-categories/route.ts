import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

interface PopularCategory {
  name: string
  icon: string
  description: string
}

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'content', 'popular-categories.md')
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json([])
    }

    const fileContents = fs.readFileSync(filePath, 'utf8')
    
    // Parse markdown to extract categories
    const categories: PopularCategory[] = []
    
    // Match h2 headings with icon and description
    const categoryRegex = /##\s+(.+?)\nicon:\s*(.+?)\ndescription:\s*(.+?)(?=\n##|$)/gs
    let match
    
    while ((match = categoryRegex.exec(fileContents)) !== null) {
      categories.push({
        name: match[1].trim(),
        icon: match[2].trim(),
        description: match[3].trim(),
      })
    }

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error reading popular categories:', error)
    return NextResponse.json([], { status: 500 })
  }
}

