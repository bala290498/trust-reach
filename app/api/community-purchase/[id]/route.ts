import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

interface CommunityPurchase {
  id: string
  title: string
  category: string
  valid_until?: string
  status: 'monthly' | 'special'
  about: string
  offer_deals?: string
  stock_clearances?: string
  market_price?: string
  community_price?: string
  dealer_email?: string
  dealer_phone?: string
  minimum_order_quantity?: string
  created_at: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const ordersDirectory = path.join(process.cwd(), 'content', 'community-purchase')
    
    // Check if directory exists
    if (!fs.existsSync(ordersDirectory)) {
      return NextResponse.json(
        { error: 'Community Purchase not found' },
        { status: 404 }
      )
    }

    // Try to find the file by ID (slug)
    const filePath = path.join(ordersDirectory, `${id}.md`)
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Community Purchase not found' },
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

    // Extract About section
    let about = ''
    const aboutMatch = content.match(/##\s*About\s*\n([\s\S]*?)(?=\n##\s*(Offer|Stock|$))/i)
    
    if (aboutMatch) {
      about = '## About\n\n' + aboutMatch[1].trim()
    } else {
      // If no About section found, use content before Offer/Stock sections
      const offerMatch = content.match(/##\s*(Offer|Stock)/i)
      if (offerMatch && offerMatch.index !== undefined) {
        about = content.substring(0, offerMatch.index).trim()
      } else {
        about = content.trim()
      }
    }

    // Extract Offer Deals section
    let offer_deals = ''
    const offerMatch = content.match(/##\s*Offer\s*Deals\s*\n([\s\S]*?)(?=\n##\s*(Stock|$))/i)
    if (offerMatch) {
      offer_deals = '## Offer Deals\n\n' + offerMatch[1].trim()
    }

    // Extract Stock Clearances section
    let stock_clearances = ''
    const stockMatch = content.match(/##\s*Stock\s*Clearances\s*\n([\s\S]*?)$/i)
    if (stockMatch) {
      stock_clearances = '## Stock Clearances\n\n' + stockMatch[1].trim()
    }

    const purchase: CommunityPurchase = {
      id: id,
      title: data.title || '',
      category: data.category || '',
      valid_until: data.valid_until || data.deadline || undefined,
      status: (data.status === 'special' || data.status === 'inprogress' ? 'special' : (data.status === 'monthly' || data.status === 'everyday' || data.status === 'featured' ? 'monthly' : 'monthly')) as 'monthly' | 'special',
      about: about,
      offer_deals: offer_deals || undefined,
      stock_clearances: stock_clearances || undefined,
      market_price: data.market_price || undefined,
      community_price: data.community_price || undefined,
      dealer_email: data.dealer_email || undefined,
      dealer_phone: data.dealer_phone || undefined,
      minimum_order_quantity: data.minimum_order_quantity || undefined,
      created_at: data.created_at || new Date().toISOString(),
    }

    return NextResponse.json(purchase)
  } catch (error) {
    console.error('Error reading community purchase:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

