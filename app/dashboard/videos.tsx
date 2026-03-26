'use client'
 
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
 
type Video = {
  id: string
  titulo: string
  url: string
  jugador_nombre: string | null
  descripcion: string | null
  created_at: string
}
 
function getYoutubeId(url: string) {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^&?/]+)/)
  return match ? match[1] : null
}
 
export default function VideosPage() {
  const { user } = useAuth()
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState<Video | null>(null)
  const [submitting, setSubmitting] = useState(false)
 
  const [form, setForm] = useState({
    titulo: '',
    url: '',
    jugador_nombre: '',
    descripcion: '',
  })
 
  useEffect(() => { if (user) cargar() }, [user])
 
  async function cargar() {
    setLoading(true)
    const { data } = await supabase
      .from('videos')
      .select('*')
      .order('created_at', { ascending: false })
    setVideos(data ?? [])
    setLoading(false)
  }
 
  function abrirFormNuevo() {
    setEditando(null)
    setForm({ titulo: '', url: '', jugador_nombre: '', descripcion: '' })
    setShowForm(true)
  }
 
  function abrirFormEditar(v: Video) {
    setEditando(v)
    setForm({
      titulo: v.titulo,
      url: v.url,
      jugador_nombre: v.jugador_nombre ?? '',
      descripcion: v.descripcion ?? '',
    })
    setShowForm(true)
  }
 
  async function guardar() {
    if (!form.titulo.trim() || !form.url.trim() || !user) return
    setSubmitting(true)
 
    const payload = {
      titulo: form.titulo.trim(),
      url: form.url.trim(),
      jugador_nombre: form.jugador_nombre || null,
      descripcion: form.descripcion || null,
    }
 
    if (editando) {
      await supabase.from('videos').update(payload).eq('id', editando.id)
    } else {
      await supabase.from('videos').insert({ ...payload, ojeador_id: user.id })
    }
 
    setShowForm(false)
    setSubmitting(false)
    cargar()
  }
 
  async function eliminar(id: string) {
    if (!confirm('¿Eliminar este vídeo?')) return
    await supabase.from('videos').delete().eq('id', id)
    cargar()
  }
 
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Vídeos</h1>
          <p className="text-slate-400 text-sm mt-1">{videos.length} vídeos guardados</p>
        </div>
        <button
          onClick={abrirFormNuevo}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Añadir vídeo
        </button>
      </div>
 
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-20">
          <svg className="w-12 h-12 text-slate-700 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <p className="text-slate-500">Aún no has añadido vídeos</p>
          <button onClick={abrirFormNuevo} className="mt-4 text-emerald-400 hover:text-emerald-300 text-sm">
            Añadir el primero →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {videos.map(v => {
            const ytId = getYoutubeId(v.url)
            return (
              <div key={v.id} className="bg-[#111827] border border-slate-700/50 rounded-2xl overflow-hidden hover:border-slate-600 transition-colors">
                {/* Thumbnail */}
                {ytId ? (
                  <div className="relative aspect-video bg-slate-900">
                    <img
                      src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
                      alt={v.titulo}
                      className="w-full h-full object-cover"
                    />
                    <a
                      href={v.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/10 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center">
                        <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </a>
                  </div>
                ) : (
                  <a
                    href={v.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center aspect-video bg-slate-800 hover:bg-slate-700 transition-colors"
                  >
                    <svg className="w-10 h-10 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
 
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">{v.titulo}</p>
                      {v.jugador_nombre && (
                        <p className="text-emerald-400 text-xs mt-0.5">{v.jugador_nombre}</p>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => abrirFormEditar(v)} className="p-1.5 text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => eliminar(v.id)} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  {v.descripcion && (
                    <p className="mt-2 text-xs text-slate-500 line-clamp-2">{v.descripcion}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
 
      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] border border-slate-700 rounded-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
              <h2 className="text-white font-semibold">{editando ? 'Editar vídeo' : 'Añadir vídeo'}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
 
            <div className="p-6 space-y-4">
              <div>
                <label className="text-slate-400 text-xs block mb-1.5">Título *</label>
                <input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/50"
                  placeholder="Análisis de movimiento sin balón" />
              </div>
              <div>
                <label className="text-slate-400 text-xs block mb-1.5">URL del vídeo *</label>
                <input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/50"
                  placeholder="https://youtube.com/watch?v=..." />
              </div>
              <div>
                <label className="text-slate-400 text-xs block mb-1.5">Jugador relacionado</label>
                <input value={form.jugador_nombre} onChange={e => setForm(f => ({ ...f, jugador_nombre: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/50"
                  placeholder="Nombre del jugador" />
              </div>
              <div>
                <label className="text-slate-400 text-xs block mb-1.5">Descripción</label>
                <textarea value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                  rows={2} className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/50 resize-none"
                  placeholder="Notas sobre este vídeo..." />
              </div>
            </div>
 
            <div className="flex gap-3 p-6 border-t border-slate-700/50">
              <button onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm transition-colors">Cancelar</button>
              <button onClick={guardar} disabled={submitting || !form.titulo.trim() || !form.url.trim()}
                className="flex-1 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-colors">
                {submitting ? 'Guardando...' : editando ? 'Guardar cambios' : 'Añadir vídeo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}