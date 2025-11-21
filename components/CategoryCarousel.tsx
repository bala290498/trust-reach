'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Card {
  id?: string
  title?: string
  category: string
  rating?: number
  review?: string
  url?: string
  [key: string]: any
}

interface CategoryCarouselProps<T extends Card = Card> {
  category: string
  cards: T[]
  renderCard: (card: T) => React.ReactNode
  viewAllHref: string
}

export default function CategoryCarousel<T extends Card = Card>({
  category,
  cards,
  renderCard,
  viewAllHref,
}: CategoryCarouselProps<T>) {
  const [scrollPosition, setScrollPosition] = useState(0)

  const scroll = (direction: 'left' | 'right') => {
    const container = document.getElementById(`carousel-${category.replace(/[^a-zA-Z0-9]/g, '-')}`)
    if (container) {
      // Use rem-based scroll amount (approximately 25rem = 400px at 16px base)
      const scrollAmount = container.offsetWidth * 0.8 // Scroll 80% of container width
      const currentScroll = container.scrollLeft
      const newPosition =
        direction === 'left'
          ? currentScroll - scrollAmount
          : currentScroll + scrollAmount
      container.scrollTo({ left: newPosition, behavior: 'smooth' })
      setScrollPosition(newPosition)
    }
  }

  if (cards.length === 0) return null

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-gray-900">{category}</h2>
        <Link
          href={viewAllHref}
          className="text-primary-600 hover:text-primary-700 font-semibold text-sm transition-colors"
        >
          View All →
        </Link>
      </div>
      <div className="relative">
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition-colors"
          aria-label="Scroll left"
        >
          <ChevronLeft size={24} className="text-gray-700" />
        </button>
        <div
          id={`carousel-${category.replace(/[^a-zA-Z0-9]/g, '-')}`}
          className="flex space-x-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {cards.map((card, index) => (
            <div key={card.id || index} className="flex-shrink-0 w-full max-w-[23.75rem] sm:w-[23.75rem]">
              {renderCard(card)}
            </div>
          ))}
        </div>
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition-colors"
          aria-label="Scroll right"
        >
          <ChevronRight size={24} className="text-gray-700" />
        </button>
      </div>
    </div>
  )
}

