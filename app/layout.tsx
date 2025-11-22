import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TrustReach.in - Trusted Reviews and Offers',
  description: 'Find trusted company reviews and community offers',
  icons: {
    icon: '/images/favicon.png',
    apple: '/images/favicon.png',
  },
  openGraph: {
    title: 'TrustReach.in - Trusted Reviews and Offers',
    description: 'Find trusted company reviews and community offers',
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
    title: 'TrustReach.in - Trusted Reviews and Offers',
    description: 'Find trusted company reviews and community offers',
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
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <Navbar />
          <main className="min-h-screen flex flex-col">
            {children}
          </main>
          <Footer />
        </body>
      </html>
    </ClerkProvider>
  )
}

