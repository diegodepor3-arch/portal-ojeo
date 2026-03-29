import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'
import NavWrapper from './NavWrapper'
 
const inter = Inter({ subsets: ['latin'] })
 
export const metadata: Metadata = {
  title: 'Portal Ojeadores',
  description: 'Plataforma privada de scouting',
}
 
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthProvider>
          <NavWrapper>
            {children}
          </NavWrapper>
        </AuthProvider>
      </body>
    </html>
  )
}