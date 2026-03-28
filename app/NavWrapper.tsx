'use client'
 
import { usePathname } from 'next/navigation'
import Nav from '@/app/Nav'
 
const RUTAS_SIN_NAV = ['/', '/login', '/registro']
 
export default function NavWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const mostrarNav = !RUTAS_SIN_NAV.includes(pathname)
 
  return (
    <>
      {mostrarNav && <Nav />}
      {children}
    </>
  )
}
 