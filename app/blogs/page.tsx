'use client'

import { useState, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, User, Tag, ArrowLeft, ExternalLink } from 'lucide-react'
import CustomSelect from '@/components/CustomSelect'

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

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [filteredBlogs, setFilteredBlogs] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const fetchBlogs = useCallback(async () => {
    try {
      const response = await fetch('/api/blogs')
      if (response.ok) {
        const data = await response.json()
        setBlogs(data)
        setFilteredBlogs(data)
      }
    } catch (error) {
      console.error('Error fetching blogs:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBlogs()
  }, [fetchBlogs])

  useEffect(() => {
    let filtered = [...blogs]

    if (selectedCategory) {
      filtered = filtered.filter((blog) => blog.category === selectedCategory)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (blog) =>
          blog.title.toLowerCase().includes(query) ||
          blog.excerpt.toLowerCase().includes(query) ||
          blog.content.toLowerCase().includes(query) ||
          blog.tags?.some((tag) => tag.toLowerCase().includes(query))
      )
    }

    setFilteredBlogs(filtered)
  }, [blogs, selectedCategory, searchQuery])

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const categories = Array.from(new Set(blogs.map((blog) => blog.category))).filter(Boolean)

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-16 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">Blogs</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">Insights, tips, and trusted advice</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        {/* Filters */}
        <div className="mb-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <div className="w-full sm:w-auto sm:flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search blogs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all"
            />
          </div>
          <div className="w-full sm:w-auto sm:min-w-[200px]">
            <CustomSelect
              value={selectedCategory}
              onChange={(value) => setSelectedCategory(String(value))}
              options={[
                { value: '', label: 'All Categories' },
                ...categories.map((category) => ({ value: category, label: category })),
              ]}
              minWidth="100%"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-16">
            <div className="text-gray-600">Loading blogs...</div>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredBlogs.length === 0 && (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No Blogs Found</h3>
              <p className="text-gray-600">
                {searchQuery || selectedCategory
                  ? 'No blogs match your search criteria. Try adjusting your filters.'
                  : 'No blogs have been published yet.'}
              </p>
            </div>
          </div>
        )}

        {/* Blogs Grid */}
        {!loading && filteredBlogs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredBlogs.map((blog) => (
              <Link
                key={blog.id}
                href={`/blogs/${blog.id}`}
                className="bg-white rounded-xl border-2 border-gray-300 p-3 sm:p-4 hover:shadow-lg hover:border-primary-400 transition-all duration-200 flex flex-col cursor-pointer"
              >
                {blog.featured_image && (
                  <div className="mb-2 -mx-3 -mt-3 sm:-mx-4 sm:-mt-4 relative w-full h-32 sm:h-40">
                    <Image
                      src={blog.featured_image}
                      alt={blog.title}
                      fill
                      className="object-cover rounded-t-xl"
                    />
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-500 mb-2">
                  <span className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-primary-100 text-primary-700 rounded-lg font-medium text-xs">
                    {blog.category}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {formatDate(blog.date)}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1.5 line-clamp-2">{blog.title}</h3>
                <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-600 mb-2">
                  <User size={12} />
                  <span>{blog.author}</span>
                </div>
                <p className="text-gray-700 leading-relaxed text-xs sm:text-sm line-clamp-2 flex-1 mb-2">
                  {blog.excerpt}
                </p>
                {blog.tags && blog.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {blog.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded"
                      >
                        <Tag size={10} />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <span className="text-primary-600 hover:text-primary-700 font-semibold text-xs sm:text-sm text-left">
                  Read More →
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
