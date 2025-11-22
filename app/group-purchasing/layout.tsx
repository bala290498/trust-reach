import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Group Purchasing - TrustReach.in',
  description: 'Express your interest in Group Purchasing. Our team will reach out to you shortly.',
}

export default function GroupPurchasingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
