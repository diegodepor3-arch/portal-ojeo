'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function RegistroPage() {
  const router = useRouter()
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [exito, setExito] = useState('')

  const handleRegistro = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setExito('')

    // 1. Crear usuario en Supabase Auth
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nombre } // metadata inicial
      }
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    const userId = data.user?.id
    if (!userId) {
      setError('Error al crear usuario')
      setLoading(false)
      return
    }

    // 2. Crear perfil en tabla perfiles
    const { error: perfilError } = await supabase
      .from('perfiles')
      .insert({
        id: userId,
        nombre,
        email,
        rol: 'ojeador',  // siempre ojeador por defecto
        club: null,
        avatar_url: null,
      })

    if (perfilError) {
      setError('Error al crear perfil: ' + perfilError.message)
      setLoading(false)
      return
    }

    setExito('✅ Registro completado. Guarda tu contraseña: ' + password)
    setTimeout(() => router.push('/dashboard'), 3000)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center p-4">
      <div className="bg-[#111827] border border-slate-700/50 rounded-2xl p-8 w-full max-w-md">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <div>
            <p className="text-white font-bold text-sm">Portal Ojeadores</p>
            <p className="text-slate-500 text-xs">Nuevo registro</p>
          </div>
        </div>

        <h1 className="text-white text-2xl font-bold mb-2">Crear cuenta</h1>
        <p className="text-slate-400 text-sm mb-6">
          Elige un email y contraseña. Con esas credenciales podrás volver a entrar siempre.
        </p>

        <form onSubmit={handleRegistro} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Tu nombre"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            required
            className="bg-[#0a0f1e] border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="bg-[#0a0f1e] border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <input
            type="password"
            placeholder="Contraseña (mínimo 6 caracteres)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            className="bg-[#0a0f1e] border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {exito && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3">
              <p className="text-emerald-400 text-sm font-bold">{exito}</p>
              <p className="text-emerald-300 text-xs mt-1">Redirigiendo al dashboard...</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-colors"
          >
            {loading ? 'Creando cuenta...' : 'Crear cuenta de ojeador'}
          </button>

          <p className="text-slate-500 text-sm text-center">
            ¿Ya tienes cuenta?{' '}
            <a href="/login" className="text-blue-400 hover:text-blue-300">
              Iniciar sesión
            </a>
          </p>
        </form>
      </div>
    </div>
  )
}