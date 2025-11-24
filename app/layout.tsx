import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TrustReach.in - Trusted Reviews',
  description: 'Find trusted company reviews from real customers',
  icons: {
    icon: '/images/favicon.png',
    apple: '/images/favicon.png',
  },
  openGraph: {
    title: 'TrustReach.in - Trusted Reviews',
    description: 'Find trusted company reviews from real customers',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TrustReach.in',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TrustReach.in - Trusted Reviews',
    description: 'Find trusted company reviews from real customers',
    images: ['/images/og-image.png'],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navbar />
        <main className="min-h-screen flex flex-col">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}

