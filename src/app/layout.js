import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ClientOnly from '@/components/ui/ClientOnly'
import ToasterProvider from '@/components/ui/ToasterProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'EdTech Learning Platform',
  description: 'A modern online learning platform for students and tutors',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
          <ClientOnly>
            <ToasterProvider />
          </ClientOnly>
        </div>
      </body>
    </html>
  )
}
