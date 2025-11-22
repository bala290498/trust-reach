import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'WholeSale - TrustReach.in',
  description: 'Express your interest in WholeSale. Our team will reach out to you shortly.',
}

export default function GroupPurchasingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
