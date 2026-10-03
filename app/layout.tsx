import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import './premium-polish.css'
import './culinary-intelligence.css'
import './stitch-screen-adaptation.css'
import './stitch-overview.css'
import { PlateIQProvider } from '@/components/plateiq-state'

export const metadata: Metadata = {
  title: 'PlateIQ — Kitchen intelligence, in real time',
  description: 'AI-powered kitchen intelligence for forecasting demand, preparing progressively, and reducing food waste.',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#fdfbf7',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <PlateIQProvider>{children}</PlateIQProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
