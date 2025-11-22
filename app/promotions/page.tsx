'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Star, CheckCircle2 } from 'lucide-react'

interface HeroPromotion {
  id: string
  title: string
  subtitle: string
  image: string
  deal: string
  offer: string
  stockClearance?: string
  verified: boolean
  link?: string
}

export default function PromotionsPage() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const slideIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Sample hero promotions data
  const slidingHeros: HeroPromotion[] = [
    {
      id: '1',
      title: 'Premium Electronics Sale',
      subtitle: 'Up to 50% Off on Latest Gadgets',
      image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=1200',
      deal: 'Exclusive Deal: Save up to ₹25,000',
      offer: 'Limited time offer on smartphones, laptops, and tablets',
      stockClearance: 'Clearance sale on previous generation models',
      verified: true,
      link: '#'
    },
    {
      id: '2',
      title: 'Fashion & Apparel Mega Sale',
      subtitle: 'Trending Styles at Unbeatable Prices',
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200',
      deal: 'Special Offer: Buy 2 Get 1 Free',
      offer: 'Premium brands with exclusive discounts',
      stockClearance: 'End of season clearance - Up to 60% off',
      verified: true,
      link: '#'
    },
    {
      id: '3',
      title: 'Home & Kitchen Essentials',
      subtitle: 'Transform Your Living Space',
      image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200',
      deal: 'Bundle Deals: Save ₹5,000+',
      offer: 'Complete home solutions with amazing discounts',
      stockClearance: 'Stock clearance on select items',
      verified: true,
      link: '#'
    }
  ]

  const heroSections: HeroPromotion[] = [
    {
      id: '4',
      title: 'Beauty & Wellness Collection',
      subtitle: 'Premium Products for Your Self-Care',
      image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800',
      deal: 'Exclusive: 40% Off on All Products',
      offer: 'Premium beauty and wellness products with verified quality',
      verified: true,
      link: '#'
    },
    {
      id: '5',
      title: 'Automotive Accessories',
      subtitle: 'Upgrade Your Vehicle Experience',
      image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800',
      deal: 'Special Deal: Free Installation',
      offer: 'Premium car accessories with exclusive pricing',
      stockClearance: 'Limited stock on premium models',
      verified: true,
      link: '#'
    },
    {
      id: '6',
      title: 'Sports & Fitness Equipment',
      subtitle: 'Achieve Your Fitness Goals',
      image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
      deal: 'Bundle Offer: Save 30%',
      offer: 'Professional-grade equipment at wholesale prices',
      verified: true,
      link: '#'
    },
    {
      id: '7',
      title: 'Home Decor & Furniture',
      subtitle: 'Transform Your Living Space',
      image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800',
      deal: 'Clearance Sale: Up to 50% Off',
      offer: 'Modern furniture and decor at unbeatable prices',
      verified: true,
      link: '#'
    },
    {
      id: '8',
      title: 'Tech Gadgets & Accessories',
      subtitle: 'Latest Technology at Best Prices',
      image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800',
      deal: 'Flash Sale: Limited Time Offer',
      offer: 'Cutting-edge tech with exclusive deals',
      stockClearance: 'Previous gen models on clearance',
      verified: true,
      link: '#'
    },
    {
      id: '9',
      title: 'Fashion & Apparel',
      subtitle: 'Trending Styles & Premium Brands',
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800',
      deal: 'Buy 2 Get 1 Free',
      offer: 'Latest fashion trends with amazing discounts',
      verified: true,
      link: '#'
    }
  ]

  // Auto-slide functionality
  useEffect(() => {
    slideIntervalRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slidingHeros.length)
    }, 5000)

    return () => {
      if (slideIntervalRef.current) {
        clearInterval(slideIntervalRef.current)
      }
    }
  }, [slidingHeros.length])

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
    if (slideIntervalRef.current) {
      clearInterval(slideIntervalRef.current)
    }
    slideIntervalRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slidingHeros.length)
    }, 5000)
  }

  const nextSlide = () => {
    goToSlide((currentSlide + 1) % slidingHeros.length)
  }

  const prevSlide = () => {
    goToSlide((currentSlide - 1 + slidingHeros.length) % slidingHeros.length)
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        {/* Sliding Hero Carousel */}
        <div className="mb-16">
          <div className="relative group">
            {/* Carousel Container */}
            <div className="relative overflow-hidden rounded-2xl">
              <div 
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {slidingHeros.map((hero) => (
                  <div key={hero.id} className="min-w-full relative">
                    <div className="relative h-[400px] md:h-[500px] w-full">
                      <Image
                        src={hero.image}
                        alt={hero.title}
                        fill
                        sizes="100vw"
                        className="object-cover"
                        priority
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent flex items-center">
                        <div className="max-w-3xl px-8 md:px-12">
                          <div className="flex items-center gap-2 mb-3">
                            {hero.verified && (
                              <div className="flex items-center gap-1.5 bg-green-500/90 px-3 py-1 rounded-full">
                                <CheckCircle2 size={16} className="text-white" />
                                <span className="text-sm font-semibold text-white">Verified</span>
                        </div>
                            )}
                          </div>
                          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3">
                            {hero.title}
                          </h2>
                          <p className="text-xl md:text-2xl text-white/90 mb-4">
                            {hero.subtitle}
                          </p>
                          <div className="space-y-2 mb-6">
                            <p className="text-lg md:text-xl font-semibold text-yellow-300">
                              {hero.deal}
                            </p>
                            <p className="text-base md:text-lg text-white/90">
                              {hero.offer}
                            </p>
                            {hero.stockClearance && (
                              <p className="text-base md:text-lg text-orange-300">
                                {hero.stockClearance}
                              </p>
                        )}
                      </div>
                          {hero.link && (
                            <a
                              href={hero.link}
                              className="inline-block bg-primary-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-primary-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                              View Details →
                            </a>
              )}
            </div>
          </div>
        </div>
      </div>
            ))}
          </div>
        </div>

            {/* Navigation Arrows */}
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-3 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
              aria-label="Previous slide"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-3 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
              aria-label="Next slide"
            >
              <ChevronRight size={24} />
            </button>

            {/* Slide Indicators */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {slidingHeros.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentSlide
                      ? 'w-8 bg-white'
                      : 'w-2 bg-white/50 hover:bg-white/75'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Bento Grid Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {heroSections.map((hero, index) => {
            // Create varying sizes for bento grid effect
            // Pattern: Large (2x2), Tall (1x2), Medium (1x1), Medium (1x1), Large (2x1), Medium (1x1)
            const gridClasses = [
              'md:col-span-2 md:row-span-2', // First: Large square (2x2)
              'md:row-span-2',                // Second: Tall (1x2)
              '',                             // Third: Normal (1x1)
              '',                             // Fourth: Normal (1x1)
              'md:col-span-2',                // Fifth: Wide (2x1)
              ''                              // Sixth: Normal (1x1)
            ]
            
            const heightClasses = [
              'h-[400px] md:h-[500px] lg:h-[600px]',  // First: Large square
              'h-[400px] md:h-[500px] lg:h-[600px]',  // Second: Tall
              'h-[320px] md:h-[350px]',               // Third: Medium
              'h-[320px] md:h-[350px]',               // Fourth: Medium
              'h-[280px] md:h-[320px]',               // Fifth: Wide but shorter
              'h-[320px] md:h-[350px]'                // Sixth: Medium
            ]
            
            const textSizes = {
              title: [
                'text-3xl md:text-4xl',       // First: Large
                'text-2xl md:text-3xl',       // Second: Large
                'text-xl md:text-2xl',        // Third: Medium
                'text-xl md:text-2xl',        // Fourth: Medium
                'text-2xl md:text-3xl',       // Fifth: Large
                'text-xl md:text-2xl'         // Sixth: Medium
              ],
              subtitle: [
                'text-lg md:text-xl',         // First: Large
                'text-base md:text-lg',       // Second: Medium
                'text-sm md:text-base',       // Third: Small
                'text-sm md:text-base',       // Fourth: Small
                'text-base md:text-lg',       // Fifth: Medium
                'text-sm md:text-base'        // Sixth: Small
              ],
              deal: [
                'text-xl md:text-2xl',        // First: Large
                'text-lg md:text-xl',         // Second: Medium
                'text-base md:text-lg',       // Third: Medium
                'text-base md:text-lg',        // Fourth: Medium
                'text-lg md:text-xl',         // Fifth: Medium
                'text-base md:text-lg'        // Sixth: Medium
              ]
            }
            
            const showFullDetails = index === 0 || index === 1 || index === 4

            return (
              <div
                key={hero.id}
                className={`bg-white rounded-2xl border-2 border-gray-200 overflow-hidden hover:shadow-xl hover:border-primary-300 transition-all duration-300 group relative ${gridClasses[index] || ''}`}
              >
                <div className={`relative w-full ${heightClasses[index] || 'h-64'} min-h-[280px]`}>
                  <Image
                    src={hero.image}
                    alt={hero.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    priority={index < 2}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/30 flex flex-col justify-end">
                    {hero.verified && (
                      <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-green-500 px-3 py-1.5 rounded-full shadow-lg z-10">
                        <CheckCircle2 size={16} className="text-white" />
                        <span className="text-sm font-semibold text-white">Verified</span>
                      </div>
                    )}
                    <div className="p-4 md:p-6 w-full">
                      <h3 className={`font-bold text-white mb-2 ${textSizes.title[index]}`}>
                        {hero.title}
                      </h3>
                      <p className={`text-white/90 mb-3 ${textSizes.subtitle[index]}`}>
                        {hero.subtitle}
                      </p>
                      <div className="space-y-2 mb-4">
                        <p className={`font-semibold text-yellow-300 ${textSizes.deal[index]}`}>
                          {hero.deal}
                        </p>
                        {showFullDetails && (
                          <>
                            <p className="text-white/90 text-sm md:text-base">{hero.offer}</p>
                            {hero.stockClearance && (
                              <p className="text-orange-300 text-sm md:text-base">{hero.stockClearance}</p>
                            )}
                          </>
                        )}
                      </div>
                      {hero.link && (
                        <a
                          href={hero.link}
                          className="inline-block bg-primary-600 text-white px-4 py-2 md:px-6 md:py-3 rounded-lg font-semibold hover:bg-primary-700 transition-all duration-200 text-sm md:text-base"
                        >
                          Explore →
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
