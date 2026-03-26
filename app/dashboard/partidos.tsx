'use client'
 
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
 
type Partido = {
  id: string
  equipo_local: string
  equipo_visitante: string
  fecha: string
  competicion: string | null
  resultado: string | null
  notas: string | null
  created_at: string
}
 
export default function PartidosPage() {
  const { user } = useAuth()
  const [partidos, setPartidos] = useState<Partido[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState<Partido | null>(null)
  const [submitting, setSubmitting] = useState(false)
 
  const [form, setForm] = useState({
    equipo_local: '',
    equipo_visitante: '',
    fecha: '',
    competicion: '',
    resultado: '',
    notas: '',
  })
 
  useEffect(() => { if (user) cargar() }, [user])
 
  async function cargar() {
    setLoading(true)
    const { data } = await supabase
      .from('partidos')
      .select('*')
      .order('fecha', { ascending: false })
    setPartidos(data ?? [])
    setLoading(false)
  }
 
  function abrirFormNuevo() {
    setEditando(null)
    setForm({ equipo_local: '', equipo_visitante: '', fecha: '', competicion: '', resultado: '', notas: '' })
    setShowForm(true)
  }
 
  function abrirFormEditar(p: Partido) {
    setEditando(p)
    setForm({
      equipo_local: p.equipo_local,
      equipo_visitante: p.equipo_visitante,
      fecha: p.fecha,
      competicion: p.competicion ?? '',
      resultado: p.resultado ?? '',
      notas: p.notas ?? '',
    })
    setShowForm(true)
  }
 
  async function guardar() {
    if (!form.equipo_local.trim() || !form.equipo_visitante.trim() || !form.fecha || !user) return
    setSubmitting(true)
 
    const payload = {
      equipo_local: form.equipo_local.trim(),
      equipo_visitante: form.equipo_visitante.trim(),
      fecha: form.fecha,
      competicion: form.competicion || null,
      resultado: form.resultado || null,
      notas: form.notas || null,
    }
 
    if (editando) {
      await supabase.from('partidos').update(payload).eq('id', editando.id)
    } else {
      await supabase.from('partidos').insert({ ...payload, ojeador_id: user.id })
    }
 
    setShowForm(false)
    setSubmitting(false)
    cargar()
  }
 
  async function eliminar(id: string) {
    if (!confirm('¿Eliminar este partido?')) return
    await supabase.from('partidos').delete().eq('id', id)
    cargar()
  }
 
  const formatFecha = (f: string) =>
    new Date(f).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
 
  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Partidos</h1>
          <p className="text-slate-400 text-sm mt-1">{partidos.length} partidos analizados</p>
        </div>
        <button
          onClick={abrirFormNuevo}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Añadir partido
        </button>
      </div>
 
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : partidos.length === 0 ? (
        <div className="text-center py-20">
          <svg className="w-12 h-12 text-slate-700 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-slate-500">Aún no has registrado partidos</p>
          <button onClick={abrirFormNuevo} className="mt-4 text-emerald-400 hover:text-emerald-300 text-sm">
            Añadir el primero →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {partidos.map(p => (
            <div key={p.id} className="bg-[#111827] border border-slate-700/50 rounded-2xl p-5 hover:border-slate-600 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  {/* Marcador visual */}
                  <div className="flex items-center gap-4 mb-2">
                    <span className="text-white font-semibold">{p.equipo_local}</span>
                    <div className="flex items-center gap-2">
                      {p.resultado ? (
                        <span className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-sm">
                          {p.resultado}
                        </span>
                      ) : (
                        <span className="text-slate-600 text-sm">vs</span>
                      )}
                    </div>
                    <span className="text-white font-semibold">{p.equipo_visitante}</span>
                  </div>
 
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatFecha(p.fecha)}
                    </span>
                    {p.competicion && (
                      <span className="px-2 py-0.5 bg-slate-800 rounded-md text-slate-400">{p.competicion}</span>
                    )}
                  </div>
 
                  {p.notas && (
                    <p className="mt-2 text-xs text-slate-500 line-clamp-1">{p.notas}</p>
                  )}
                </div>
 
                <div className="flex gap-1 ml-4">
                  <button onClick={() => abrirFormEditar(p)} className="p-1.5 text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button onClick={() => eliminar(p.id)} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
 
      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
              <h2 className="text-white font-semibold">{editando ? 'Editar partido' : 'Añadir partido'}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
 
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 text-xs block mb-1.5">Equipo local *</label>
                  <input value={form.equipo_local} onChange={e => setForm(f => ({ ...f, equipo_local: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/50" placeholder="Deportivo" />
                </div>
                <div>
                  <label className="text-slate-400 text-xs block mb-1.5">Equipo visitante *</label>
                  <input value={form.equipo_visitante} onChange={e => setForm(f => ({ ...f, equipo_visitante: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/50" placeholder="Celta B" />
                </div>
              </div>
 
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 text-xs block mb-1.5">Fecha *</label>
                  <input type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/50" />
                </div>
                <div>
                  <label className="text-slate-400 text-xs block mb-1.5">Resultado</label>
                  <input value={form.resultado} onChange={e => setForm(f => ({ ...f, resultado: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/50" placeholder="2-1" />
                </div>
              </div>
 
              <div>
                <label className="text-slate-400 text-xs block mb-1.5">Competición</label>
                <input value={form.competicion} onChange={e => setForm(f => ({ ...f, competicion: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/50" placeholder="Segunda Federación" />
              </div>
 
              <div>
                <label className="text-slate-400 text-xs block mb-1.5">Notas</label>
                <textarea value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                  rows={3} className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/50 resize-none"
                  placeholder="Observaciones del partido..." />
              </div>
            </div>
 
            <div className="flex gap-3 p-6 border-t border-slate-700/50">
              <button onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm transition-colors">Cancelar</button>
              <button onClick={guardar} disabled={submitting || !form.equipo_local.trim() || !form.equipo_visitante.trim() || !form.fecha}
                className="flex-1 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-colors">
                {submitting ? 'Guardando...' : editando ? 'Guardar cambios' : 'Añadir partido'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}