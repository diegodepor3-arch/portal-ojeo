'use client'
 
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import type { Perfil } from '@/lib/supabaseClient'
 
type OjeadorConDatos = Perfil & {
  jugadores: { id: string; nombre: string; posicion: string | null; valoracion: number | null }[]
  partidos_count: number
  videos_count: number
  diario_count: number
}
 
export default function InformesPage() {
  const { perfil, loading: authLoading } = useAuth()
  const router = useRouter()
  const [ojeadores, setOjeadores] = useState<OjeadorConDatos[]>([])
  const [loading, setLoading] = useState(true)
  const [ojeadorSeleccionado, setOjeadorSeleccionado] = useState<OjeadorConDatos | null>(null)
  const [cambiandoRol, setCambiandoRol] = useState<string | null>(null)
 
  useEffect(() => {
    if (authLoading) return
    if (!perfil || (perfil.rol !== 'admin' && perfil.rol !== 'director')) {
      router.push('/dashboard')
      return
    }
    cargar()
  }, [perfil, authLoading])
 
  async function cargar() {
    setLoading(true)
 
    // Cargar todos los perfiles con rol ojeador
    const { data: perfiles } = await supabase
      .from('perfiles')
      .select('*')
      .order('created_at', { ascending: false })
 
    if (!perfiles) { setLoading(false); return }
 
    // Para cada ojeador, cargar sus jugadores y conteos
    const ojeadoresConDatos = await Promise.all(
      perfiles.map(async (p) => {
        const [jugadoresRes, partidosRes, videosRes, diarioRes] = await Promise.all([
          supabase.from('jugadores').select('id, nombre, posicion, valoracion').eq('ojeador_id', p.id),
          supabase.from('partidos').select('id', { count: 'exact', head: true }).eq('ojeador_id', p.id),
          supabase.from('videos').select('id', { count: 'exact', head: true }).eq('ojeador_id', p.id),
          supabase.from('diario').select('id', { count: 'exact', head: true }).eq('ojeador_id', p.id),
        ])
 
        return {
          ...p,
          jugadores: jugadoresRes.data ?? [],
          partidos_count: partidosRes.count ?? 0,
          videos_count: videosRes.count ?? 0,
          diario_count: diarioRes.count ?? 0,
        } as OjeadorConDatos
      })
    )
 
    setOjeadores(ojeadoresConDatos)
    setLoading(false)
  }
 
  async function cambiarRol(userId: string, nuevoRol: 'ojeador' | 'director' | 'admin') {
    setCambiandoRol(userId)
    await supabase.from('perfiles').update({ rol: nuevoRol }).eq('id', userId)
    setCambiandoRol(null)
    cargar()
    // Actualizar panel lateral si es el seleccionado
    if (ojeadorSeleccionado?.id === userId) {
      setOjeadorSeleccionado(prev => prev ? { ...prev, rol: nuevoRol } : null)
    }
  }
 
  const totalJugadores = ojeadores.reduce((acc, o) => acc + o.jugadores.length, 0)
  const totalPartidos = ojeadores.reduce((acc, o) => acc + o.partidos_count, 0)
 
  const rolBadge = (rol: string) => {
    const clases: Record<string, string> = {
      admin: 'bg-red-500/10 text-red-400 border border-red-500/20',
      director: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      ojeador: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    }
    return `px-2 py-0.5 rounded-md text-xs capitalize ${clases[rol] ?? clases.ojeador}`
  }
 
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
 
  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Panel de informes</h1>
        </div>
        <p className="text-slate-400 text-sm">Vista global de todos los ojeadores y su actividad</p>
      </div>
 
      {/* Stats globales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Usuarios totales', value: ojeadores.length, color: 'text-white' },
          { label: 'Ojeadores activos', value: ojeadores.filter(o => o.rol === 'ojeador').length, color: 'text-emerald-400' },
          { label: 'Jugadores registrados', value: totalJugadores, color: 'text-blue-400' },
          { label: 'Partidos analizados', value: totalPartidos, color: 'text-amber-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-[#111827] border border-slate-700/50 rounded-2xl p-4">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-slate-500 text-xs mt-1">{stat.label}</p>
          </div>
        ))}
      </div>
 
      <div className="flex gap-6">
        {/* Lista de ojeadores */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Todos los usuarios ({ojeadores.length})
          </p>
 
          {ojeadores.length === 0 ? (
            <div className="text-center py-20 bg-[#111827] border border-slate-700/50 rounded-2xl">
              <p className="text-slate-500">No hay usuarios registrados</p>
            </div>
          ) : (
            <div className="space-y-2">
              {ojeadores.map(o => (
                <div
                  key={o.id}
                  onClick={() => setOjeadorSeleccionado(ojeadorSeleccionado?.id === o.id ? null : o)}
                  className={`bg-[#111827] border rounded-2xl p-4 cursor-pointer transition-all ${
                    ojeadorSeleccionado?.id === o.id
                      ? 'border-amber-500/40 bg-amber-500/5'
                      : 'border-slate-700/50 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm font-bold uppercase">{o.nombre?.charAt(0) ?? '?'}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-white font-medium text-sm truncate">{o.nombre}</p>
                          <span className={rolBadge(o.rol)}>{o.rol}</span>
                        </div>
                        <p className="text-slate-500 text-xs truncate">{o.email}</p>
                      </div>
                    </div>
 
                    {/* Mini stats */}
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-center hidden sm:block">
                        <p className="text-white text-sm font-semibold">{o.jugadores.length}</p>
                        <p className="text-slate-600 text-xs">jug.</p>
                      </div>
                      <div className="text-center hidden sm:block">
                        <p className="text-white text-sm font-semibold">{o.partidos_count}</p>
                        <p className="text-slate-600 text-xs">part.</p>
                      </div>
                      <div className="text-center hidden md:block">
                        <p className="text-white text-sm font-semibold">{o.videos_count}</p>
                        <p className="text-slate-600 text-xs">vid.</p>
                      </div>
                      <svg className={`w-4 h-4 text-slate-600 transition-transform ${ojeadorSeleccionado?.id === o.id ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
 
        {/* Panel lateral - detalle del ojeador seleccionado */}
        {ojeadorSeleccionado && (
          <div className="w-80 flex-shrink-0">
            <div className="bg-[#111827] border border-slate-700/50 rounded-2xl sticky top-6">
              {/* Cabecera del ojeador */}
              <div className="p-5 border-b border-slate-700/50">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                      <span className="text-amber-400 font-bold uppercase">
                        {ojeadorSeleccionado.nombre?.charAt(0) ?? '?'}
                      </span>
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{ojeadorSeleccionado.nombre}</p>
                      <p className="text-slate-500 text-xs">{ojeadorSeleccionado.email}</p>
                    </div>
                  </div>
                  <button onClick={() => setOjeadorSeleccionado(null)} className="text-slate-600 hover:text-slate-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
 
                {/* Stats del ojeador */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Jugadores', value: ojeadorSeleccionado.jugadores.length },
                    { label: 'Partidos', value: ojeadorSeleccionado.partidos_count },
                    { label: 'Vídeos', value: ojeadorSeleccionado.videos_count },
                  ].map(s => (
                    <div key={s.label} className="bg-slate-800/50 rounded-xl p-2.5 text-center">
                      <p className="text-white font-bold text-lg">{s.value}</p>
                      <p className="text-slate-600 text-xs">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
 
              {/* Cambiar rol (solo admin) */}
              {perfil?.rol === 'admin' && (
                <div className="p-5 border-b border-slate-700/50">
                  <p className="text-slate-500 text-xs uppercase tracking-wider mb-3">Cambiar rol</p>
                  <div className="flex gap-2">
                    {(['ojeador', 'director', 'admin'] as const).map(r => (
                      <button
                        key={r}
                        disabled={cambiandoRol === ojeadorSeleccionado.id || ojeadorSeleccionado.rol === r}
                        onClick={() => cambiarRol(ojeadorSeleccionado.id, r)}
                        className={`flex-1 py-1.5 rounded-lg text-xs capitalize transition-colors disabled:cursor-not-allowed ${
                          ojeadorSeleccionado.rol === r
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-slate-800 text-slate-500 hover:text-white hover:bg-slate-700 border border-transparent'
                        }`}
                      >
                        {cambiandoRol === ojeadorSeleccionado.id ? '...' : r}
                      </button>
                    ))}
                  </div>
                </div>
              )}
 
              {/* Jugadores del ojeador */}
              <div className="p-5">
                <p className="text-slate-500 text-xs uppercase tracking-wider mb-3">
                  Jugadores ({ojeadorSeleccionado.jugadores.length})
                </p>
                {ojeadorSeleccionado.jugadores.length === 0 ? (
                  <p className="text-slate-600 text-sm text-center py-4">Sin jugadores</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {ojeadorSeleccionado.jugadores.map(j => (
                      <div key={j.id} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                        <div>
                          <p className="text-white text-sm">{j.nombre}</p>
                          {j.posicion && <p className="text-slate-500 text-xs">{j.posicion}</p>}
                        </div>
                        {j.valoracion && (
                          <span className="text-amber-400 text-sm font-bold">{j.valoracion}/10</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
 