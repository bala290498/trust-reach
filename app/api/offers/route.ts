import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

interface Offer {
  id: string
  business_name: string
  url: string
  category: string
  services: string
  offer_deals: string
  quantity_left?: string
  verified: boolean
  created_at: string
}

export async function GET() {
  try {
    const offersDirectory = path.join(process.cwd(), 'content', 'offers')
    
    // Check if directory exists
    if (!fs.existsSync(offersDirectory)) {
      return NextResponse.json([])
    }

    const files = fs.readdirSync(offersDirectory)
    const offers: Offer[] = []

    for (const file of files) {
      if (file.endsWith('.md')) {
        const filePath = path.join(offersDirectory, file)
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
              if (key.trim() === 'verified') {
                data[key.trim()] = value === 'true'
              } else {
                data[key.trim()] = value
              }
            }
          })
        }

        offers.push({
          id: file.replace('.md', ''),
          business_name: data.business_name || '',
          url: data.url || '',
          category: data.category || '',
          services: data.services || '',
          offer_deals: data.offer_deals || content,
          quantity_left: data.quantity_left,
          verified: data.verified === true || data.verified === 'true',
          created_at: data.created_at || new Date().toISOString(),
        })
      }
    }

    // Sort by created_at descending
    offers.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    return NextResponse.json(offers)
  } catch (error) {
    console.error('Error reading offers:', error)
    return NextResponse.json([], { status: 500 })
  }
}

