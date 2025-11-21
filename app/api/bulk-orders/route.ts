import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

interface BulkOrder {
  id: string
  title: string
  description: string
  category: string
  deadline: string
  status: 'featured' | 'inprogress' | 'development'
  created_at: string
}

export async function GET() {
  try {
    const ordersDirectory = path.join(process.cwd(), 'content', 'bulk-orders')
    
    // Check if directory exists
    if (!fs.existsSync(ordersDirectory)) {
      return NextResponse.json([])
    }

    const files = fs.readdirSync(ordersDirectory)
    const orders: BulkOrder[] = []

    for (const file of files) {
      if (file.endsWith('.md')) {
        const filePath = path.join(ordersDirectory, file)
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

        orders.push({
          id: file.replace('.md', ''),
          title: data.title || '',
          description: content || data.description || '',
          category: data.category || '',
          deadline: data.deadline || '',
          status: (data.status || 'featured') as 'featured' | 'inprogress' | 'development',
          created_at: data.created_at || new Date().toISOString(),
        })
      }
    }

    // Sort by created_at descending
    orders.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Error reading bulk orders:', error)
    return NextResponse.json([], { status: 500 })
  }
}

