import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dtuuysbjuafailwsffcr.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0dXV5c2JqdWFmYWlsd3NmZmNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MzA4NDksImV4cCI6MjA5MDEwNjg0OX0.HaTjc_lXwSKXu0p35b1fozg2QNeIG3SGgcpOCFWxXhE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,       // sesión persiste al cerrar/abrir
    autoRefreshToken: true,     // renueva token automáticamente
    storageKey: 'portal-ojeo-session', // clave única en localStorage
  }
})

export type Perfil = {
  id: string
  nombre: string
  email: string
  rol: 'ojeador' | 'director' | 'admin'
  club: string | null
  avatar_url: string | null
  created_at: string
}