'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { generateSlug } from '@/lib/utils'
import { UtensilsCrossed, Heart, Plane, Building2, Home as HomeIcon, Music, Sparkles, Laptop, Car, Building, GraduationCap } from 'lucide-react'

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

// All available categories
const allCategories = [
  'Hotels & Restaurants',
  'Health & Medical',
  'Travel & Vacation',
  'Construction & Manufacturing',
  'Home Services',
  'Events & Entertainment',
  'Beauty & Well-being',
  'Electronics & Technology',
  'Vehicles & Transportation',
  'Local Services',
  'Education & Training',
]

const getCategoryIcon = (category: string) => {
  const iconMap: Record<string, any> = {
    'Hotels & Restaurants': UtensilsCrossed,
    'Health & Medical': Heart,
    'Travel & Vacation': Plane,
    'Construction & Manufacturing': Building2,
    'Home Services': HomeIcon,
    'Events & Entertainment': Music,
    'Beauty & Well-being': Sparkles,
    'Electronics & Technology': Laptop,
    'Vehicles & Transportation': Car,
    'Local Services': Building,
    'Education & Training': GraduationCap,
  }
  const IconComponent = iconMap[category]
  return IconComponent ? <IconComponent size={24} /> : null
}

export default function AllCategoriesPage() {
  const [brandCards, setBrandCards] = useState<BrandCard[]>([])
  const [loading, setLoading] = useState(true)

  const fetchBrandCards = useCallback(async () => {
    try {
      const response = await fetch('/api/brands')
      if (response.ok) {
        const data = await response.json()
        setBrandCards(data || [])
      }
    } catch (error) {
      console.error('Error fetching brand cards:', error)
      setBrandCards([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBrandCards()
  }, [fetchBrandCards])

  const getCategoryCount = (category: string) => {
    return brandCards.filter((brand) => brand.category === category).length
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[min(1200px,95vw)] mx-auto px-[clamp(1rem,4vw,2rem)] py-[clamp(2rem,5vw,4rem)]">
        <div className="mb-[clamp(1.5rem,4vw,2rem)]">
          {/* Breadcrumb */}
          <nav className="mb-[clamp(1rem,3vw,1.5rem)]" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 text-[clamp(0.875rem,2vw,1rem)]">
              <li>
                <Link href="/" className="text-gray-600 hover:text-primary-600 transition-colors">
                  Home
                </Link>
              </li>
              <li className="text-gray-400">/</li>
              <li>
                <span className="text-gray-900 font-medium">All Categories</span>
              </li>
            </ol>
          </nav>
          <h1 className="text-[clamp(1.75rem,4vw,2.5rem)] font-bold text-gray-900 mb-[clamp(0.5rem,1.5vw,1rem)]">All Categories</h1>
          <p className="text-[clamp(0.875rem,2vw,1.125rem)] text-gray-600">
            Browse all available categories and discover businesses in each category
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[clamp(0.75rem,2vw,1rem)]">
          {allCategories
            .filter((category) => {
              const categoryCount = getCategoryCount(category)
              return categoryCount > 0
            })
            .map((category) => {
            const categoryCount = getCategoryCount(category)
            const IconComponent = getCategoryIcon(category)
            
            return (
              <Link
                key={category}
                href={`/category/${generateSlug(category)}`}
                className="bg-white rounded-[clamp(0.75rem,2vw,1rem)] border border-gray-200 p-[clamp(1rem,3vw,1.5rem)] hover:shadow-md hover:border-primary-300 transition-all duration-200 cursor-pointer shadow-sm"
              >
                <div className="flex items-start gap-[clamp(0.75rem,2vw,1rem)]">
                  <div className="flex-shrink-0 text-gray-600">
                    {IconComponent}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[clamp(1rem,2.5vw,1.125rem)] font-bold text-gray-900 mb-1 break-words">
                      {category}
                    </h3>
                    <p className="text-[clamp(0.75rem,1.5vw,0.875rem)] text-gray-500">
                      {categoryCount} {categoryCount === 1 ? 'business' : 'businesses'}
                    </p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

