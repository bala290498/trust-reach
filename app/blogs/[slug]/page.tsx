'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import { Calendar, User, Tag, ArrowLeft } from 'lucide-react'

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

export default function BlogDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [blog, setBlog] = useState<Blog | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const response = await fetch(`/api/blogs/${params.slug}`)
        if (response.ok) {
          const data = await response.json()
          setBlog(data)
        } else {
          console.error('Failed to fetch blog')
        }
      } catch (error) {
        console.error('Error fetching blog:', error)
      } finally {
        setLoading(false)
      }
    }

    if (params.slug) {
      fetchBlog()
    }
  }, [params.slug])

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
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

  if (!blog) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Blog Not Found</h1>
            <Link
              href="/blogs"
              className="text-primary-600 hover:text-primary-700 font-semibold"
            >
              ← Back to Blogs
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <nav className="mb-8" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-sm">
            <li>
              <Link href="/" className="text-gray-600 hover:text-primary-600 transition-colors">
                Home
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            <li>
              <Link href="/blogs" className="text-gray-600 hover:text-primary-600 transition-colors">
                Blogs
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            <li>
              <span className="text-gray-900 font-medium">{blog.title}</span>
            </li>
          </ol>
        </nav>

        {/* Back Button */}
        <Link
          href="/blogs"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors mb-8"
        >
          <ArrowLeft size={18} />
          <span>Back to Blogs</span>
        </Link>

        {/* Featured Image */}
        {blog.featured_image && (
          <div className="mb-8 -mx-6 lg:-mx-8">
            <div className="relative w-full h-64 md:h-96">
              <Image
                src={blog.featured_image}
                alt={blog.title}
                fill
                className="object-cover"
              />
            </div>
          </div>
        )}

        {/* Header Section */}
        <div className="mb-8 pb-8 border-b-2 border-gray-200">
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
            <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-lg font-medium">
              {blog.category}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar size={16} />
              {formatDate(blog.date)}
            </span>
            <span className="flex items-center gap-1.5">
              <User size={16} />
              {blog.author}
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            {blog.title}
          </h1>

          {blog.tags && blog.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {blog.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1.5 text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg"
                >
                  <Tag size={14} />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="prose prose-lg max-w-none mb-12">
          <div className="blog-content">
            <ReactMarkdown
              components={{
                h1: ({node, ...props}) => (
                  <h1 {...props} className="text-4xl font-bold text-gray-900 mt-8 mb-4" />
                ),
                h2: ({node, ...props}) => (
                  <h2 {...props} className="text-3xl font-bold text-gray-900 mt-8 mb-4" />
                ),
                h3: ({node, ...props}) => (
                  <h3 {...props} className="text-2xl font-bold text-gray-800 mt-6 mb-3" />
                ),
                h4: ({node, ...props}) => (
                  <h4 {...props} className="text-xl font-bold text-gray-800 mt-4 mb-2" />
                ),
                p: ({node, ...props}) => (
                  <p {...props} className="text-gray-700 text-base leading-relaxed mb-4" />
                ),
                ul: ({node, ...props}) => (
                  <ul {...props} className="list-disc list-inside mb-4 space-y-2" />
                ),
                ol: ({node, ...props}) => (
                  <ol {...props} className="list-decimal list-inside mb-4 space-y-2" />
                ),
                li: ({node, ...props}) => (
                  <li {...props} className="text-gray-700 text-base" />
                ),
                strong: ({node, ...props}) => (
                  <strong {...props} className="text-gray-900 font-semibold" />
                ),
                a: ({node, ...props}) => (
                  <a {...props} className="text-primary-600 hover:text-primary-700 underline" />
                ),
                blockquote: ({node, ...props}) => (
                  <blockquote {...props} className="border-l-4 border-primary-500 pl-4 italic text-gray-600 my-4" />
                ),
                code: ({node, ...props}) => (
                  <code {...props} className="bg-gray-100 px-2 py-1 rounded text-sm font-mono" />
                ),
                pre: ({node, ...props}) => (
                  <pre {...props} className="bg-gray-100 p-4 rounded-lg overflow-x-auto my-4" />
                ),
              }}
            >
              {blog.content}
            </ReactMarkdown>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t-2 border-gray-200 my-12"></div>

        {/* Footer Section */}
        <div className="pt-8">
          <Link
            href="/blogs"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold transition-colors"
          >
            <ArrowLeft size={18} />
            <span>Back to All Blogs</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

