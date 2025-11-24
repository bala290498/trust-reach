import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Community Purchase - TrustReach.in',
  description: 'Express your interest in Community Purchase. Our team will reach out to you shortly.',
}

export default function GroupPurchasingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
