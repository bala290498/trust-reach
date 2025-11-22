'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { generateSlug } from '@/lib/utils'
import { supabase, CompanyReview } from '@/lib/supabase'
import StarRating from '@/components/StarRating'

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
  const [reviews, setReviews] = useState<CompanyReview[]>([])
  const [sortBy, setSortBy] = useState<'rating' | 'date'>('rating')
  const [order, setOrder] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('highest')

  const fetchBrands = useCallback(async () => {
    try {
      const response = await fetch('/api/brands')
      if (response.ok) {
        const data = await response.json()
        setBrandCards(data || [])
        
        // Find the category name from the slug
        const slug = params.slug as string
        const allCategories = Array.from(new Set(data.map((brand: BrandCard) => brand.category).filter(Boolean))) as string[]
        const matchedCategory = allCategories.find((cat) => generateSlug(cat) === slug)
        
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

  // Fetch reviews to calculate ratings
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const { data, error } = await supabase
          .from('company_reviews')
          .select('*')

        if (error) throw error
        setReviews(data || [])
      } catch (error) {
        console.error('Error fetching reviews:', error)
        setReviews([])
      }
    }

    fetchReviews()
  }, [])

  // Sort brands based on sort options
  const getSortedBrands = useCallback((brands: BrandCard[]) => {
    const sortedBrands = [...brands]

    sortedBrands.sort((a, b) => {
      if (sortBy === 'rating') {
        // Calculate average rating for each brand
        const aReviews = reviews.filter((review) => review.company_name === a.brand_name)
        const bReviews = reviews.filter((review) => review.company_name === b.brand_name)
        const aRating = aReviews.length > 0
          ? aReviews.reduce((sum, review) => sum + review.rating, 0) / aReviews.length
          : 0
        const bRating = bReviews.length > 0
          ? bReviews.reduce((sum, review) => sum + review.rating, 0) / bReviews.length
          : 0

        if (order === 'highest') {
          return bRating - aRating
        } else {
          return aRating - bRating
        }
      } else {
        // Sort by date (created_at)
        const aDate = new Date(a.created_at || 0).getTime()
        const bDate = new Date(b.created_at || 0).getTime()

        if (order === 'newest') {
          return bDate - aDate
        } else {
          return aDate - bDate
        }
      }
    })

    return sortedBrands
  }, [sortBy, order, reviews])

  const categoryBrands = category ? brandCards.filter((brand) => brand.category === category) : []
  const sortedCategoryBrands = getSortedBrands(categoryBrands)

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

  if (!category || sortedCategoryBrands.length === 0) {
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
          <p className="text-gray-600">The category you&apos;re looking for doesn&apos;t exist or has no brands.</p>
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{category}</h1>
              <p className="text-gray-600">
                {sortedCategoryBrands.length} {sortedCategoryBrands.length === 1 ? 'brand' : 'brands'} in this category
              </p>
            </div>
            
            {/* Sort Dropdowns */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              {/* Sort By Dropdown */}
              <div className="relative inline-block">
                <label className="sr-only">Sort by</label>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    const newSortBy = e.target.value as 'rating' | 'date'
                    setSortBy(newSortBy)
                    setOrder(newSortBy === 'rating' ? 'highest' : 'newest')
                  }}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm text-gray-700 hover:border-gray-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors cursor-pointer w-full min-w-[8rem] shadow-sm"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 0.5rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.5em 1.5em',
                    paddingRight: '2.5rem'
                  }}
                >
                  <option value="rating">Rating</option>
                  <option value="date">Date</option>
                </select>
              </div>
              {/* Order Dropdown */}
              <div className="relative inline-block">
                <label className="sr-only">Order</label>
                <select
                  value={order}
                  onChange={(e) => {
                    const newOrder = e.target.value as 'newest' | 'oldest' | 'highest' | 'lowest'
                    setOrder(newOrder)
                  }}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm text-gray-700 hover:border-gray-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors cursor-pointer w-full min-w-[8rem] shadow-sm"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 0.5rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.5em 1.5em',
                    paddingRight: '2.5rem'
                  }}
                >
                  {sortBy === 'rating' ? (
                    <>
                      <option value="highest">Highest</option>
                      <option value="lowest">Lowest</option>
                    </>
                  ) : (
                    <>
                      <option value="newest">Newest</option>
                      <option value="oldest">Oldest</option>
                    </>
                  )}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Brand Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {sortedCategoryBrands.map((brand) => (
            <Link
              key={brand.id}
              href={`/brands/${brand.id}`}
              className="bg-white rounded-lg border-2 border-gray-300 p-4 hover:shadow-lg hover:border-primary-400 transition-all duration-200 flex flex-col cursor-pointer group w-full max-w-full sm:max-w-[13.75rem] lg:max-w-[15rem] flex-shrink-0"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-gray-900 mb-1 line-clamp-2 group-hover:text-primary-600 transition-colors" title={brand.brand_name}>
                    {brand.brand_name}
                  </h3>
                  {brand.category && (
                    <p className="text-xs text-gray-500 font-medium truncate" title={brand.category}>
                      {brand.category}
                    </p>
                  )}
                </div>
                {brand.url && (
                  <a
                    href={brand.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700 transition-colors flex-shrink-0 ml-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
              
              {/* Star Rating and Review Count */}
              {(() => {
                const brandReviews = reviews.filter((review) => review.company_name === brand.brand_name)
                const reviewCount = brandReviews.length
                const averageRating = reviewCount > 0
                  ? brandReviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount
                  : 0
                
                return (
                  <div className="mt-3 flex-1 flex flex-col justify-end">
                    {reviewCount > 0 ? (
                      <div className="flex items-center gap-2 mb-2">
                        <StarRating rating={Math.round(averageRating * 10) / 10} onRatingChange={() => {}} readonly />
                        <span className="text-xs font-semibold text-gray-900">{Math.round(averageRating * 10) / 10}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mb-2">
                        <StarRating rating={0} onRatingChange={() => {}} readonly />
                        <span className="text-xs text-gray-400">No reviews</span>
                      </div>
                    )}
                    {reviewCount > 0 && (
                      <p className="text-xs text-gray-500 mb-2">
                        {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
                      </p>
                    )}
                  </div>
                )
              })()}
              
              <div className="mt-3 pt-2 border-t border-gray-200">
                <p className="text-xs font-medium text-primary-600 text-center group-hover:text-primary-700 transition-colors">
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

