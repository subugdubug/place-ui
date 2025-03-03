import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from '@/components/providers/Providers'
import ErrorFilterSetup from '@/components/ErrorFilterSetup'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PixelPlace - Decentralized Collaborative Canvas',
  description: 'A decentralized collaborative canvas on Ethereum where users can paint pixels for a fee.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorFilterSetup />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
