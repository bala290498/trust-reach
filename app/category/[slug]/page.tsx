'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { generateSlug } from '@/lib/utils'

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

export default function CategoryPage() {
  const params = useParams()
  const [brandCards, setBrandCards] = useState<BrandCard[]>([])
  const [category, setCategory] = useState<string>('')
  const [loading, setLoading] = useState(true)

  const fetchBrands = useCallback(async () => {
    try {
      const response = await fetch('/api/brands')
      if (response.ok) {
        const data = await response.json()
        setBrandCards(data || [])
        
        // Find the category name from the slug
        const slug = params.slug as string
        const allCategories = Array.from(new Set(data.map((brand: BrandCard) => brand.category).filter(Boolean)))
        const matchedCategory = allCategories.find((cat: string) => generateSlug(cat) === slug)
        
        if (matchedCategory) {
          setCategory(matchedCategory)
        }
      }
    } catch (error) {
      console.error('Error fetching brands:', error)
      setBrandCards([])
    } finally {
      setLoading(false)
    }
  }, [params.slug])

  useEffect(() => {
    fetchBrands()
  }, [fetchBrands])

  const categoryBrands = category ? brandCards.filter((brand) => brand.category === category) : []

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

  if (!category || categoryBrands.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-6 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to Home</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Category Not Found</h1>
          <p className="text-gray-600">The category you're looking for doesn't exist or has no brands.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Home</span>
        </Link>

        {/* Category Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{category}</h1>
          <p className="text-gray-600">
            {categoryBrands.length} {categoryBrands.length === 1 ? 'brand' : 'brands'} in this category
          </p>
        </div>

        {/* Brand Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {categoryBrands.map((brand) => (
            <Link
              key={brand.id}
              href={`/brands/${brand.id}`}
              className="bg-white rounded-lg border-2 border-gray-300 p-6 hover:shadow-lg hover:border-primary-400 transition-all duration-200 flex flex-col cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2 group-hover:text-primary-600 transition-colors" title={brand.brand_name}>
                    {brand.brand_name}
                  </h3>
                  {brand.category && (
                    <p className="text-sm text-gray-500 font-medium truncate" title={brand.category}>
                      {brand.category}
                    </p>
                  )}
                </div>
                {brand.url && (
                  <a
                    href={brand.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700 transition-colors flex-shrink-0 ml-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink size={18} />
                  </a>
                )}
              </div>
              
              {/* Preview of about section */}
              {brand.about && (
                <div className="mt-3 flex-1">
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {brand.about.split('\n').find((line) => line.trim() && !line.startsWith('#')) || brand.about.split('\n')[0] || ''}
                  </p>
                </div>
              )}
              
              <div className="mt-4 pt-3 border-t border-gray-200">
                <p className="text-sm font-medium text-primary-600 text-center group-hover:text-primary-700 transition-colors">
                  View Details →
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

