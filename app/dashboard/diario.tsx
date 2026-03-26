'use client'
 
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
 
type Entrada = {
  id: string
  titulo: string
  contenido: string
  etiqueta: string | null
  created_at: string
}
 
const ETIQUETAS = ['Observación', 'Reflexión', 'Reunión', 'Viaje', 'Partido', 'Otro']
 
const coloresEtiqueta: Record<string, string> = {
  'Observación': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Reflexión': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Reunión': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Viaje': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  'Partido': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Otro': 'bg-slate-500/10 text-slate-400 border-slate-500/20',
}
 
export default function DiarioPage() {
  const { user } = useAuth()
  const [entradas, setEntradas] = useState<Entrada[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState<Entrada | null>(null)
  const [viendoEntrada, setViendoEntrada] = useState<Entrada | null>(null)
  const [submitting, setSubmitting] = useState(false)
 
  const [form, setForm] = useState({ titulo: '', contenido: '', etiqueta: '' })
 
  useEffect(() => { if (user) cargar() }, [user])
 
  async function cargar() {
    setLoading(true)
    const { data } = await supabase
      .from('diario')
      .select('*')
      .order('created_at', { ascending: false })
    setEntradas(data ?? [])
    setLoading(false)
  }
 
  function abrirFormNuevo() {
    setEditando(null)
    setForm({ titulo: '', contenido: '', etiqueta: '' })
    setShowForm(true)
  }
 
  function abrirFormEditar(e: Entrada) {
    setEditando(e)
    setForm({ titulo: e.titulo, contenido: e.contenido, etiqueta: e.etiqueta ?? '' })
    setViendoEntrada(null)
    setShowForm(true)
  }
 
  async function guardar() {
    if (!form.titulo.trim() || !form.contenido.trim() || !user) return
    setSubmitting(true)
 
    const payload = {
      titulo: form.titulo.trim(),
      contenido: form.contenido.trim(),
      etiqueta: form.etiqueta || null,
    }
 
    if (editando) {
      await supabase.from('diario').update(payload).eq('id', editando.id)
    } else {
      await supabase.from('diario').insert({ ...payload, ojeador_id: user.id })
    }
 
    setShowForm(false)
    setSubmitting(false)
    cargar()
  }
 
  async function eliminar(id: string) {
    if (!confirm('¿Eliminar esta entrada?')) return
    await supabase.from('diario').delete().eq('id', id)
    setViendoEntrada(null)
    cargar()
  }
 
  const formatFecha = (f: string) =>
    new Date(f).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
 
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Diario</h1>
          <p className="text-slate-400 text-sm mt-1">{entradas.length} entradas</p>
        </div>
        <button
          onClick={abrirFormNuevo}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva entrada
        </button>
      </div>
 
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : entradas.length === 0 ? (
        <div className="text-center py-20">
          <svg className="w-12 h-12 text-slate-700 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <p className="text-slate-500">Tu diario está vacío</p>
          <button onClick={abrirFormNuevo} className="mt-4 text-emerald-400 hover:text-emerald-300 text-sm">
            Escribir primera entrada →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {entradas.map(e => (
            <div
              key={e.id}
              onClick={() => setViendoEntrada(e)}
              className="bg-[#111827] border border-slate-700/50 rounded-2xl p-5 hover:border-slate-600 cursor-pointer transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1.5">
                    <h3 className="text-white font-medium text-sm">{e.titulo}</h3>
                    {e.etiqueta && (
                      <span className={`px-2 py-0.5 rounded-md text-xs border ${coloresEtiqueta[e.etiqueta] ?? coloresEtiqueta['Otro']}`}>
                        {e.etiqueta}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500 text-xs line-clamp-2">{e.contenido}</p>
                </div>
                <span className="text-slate-600 text-xs flex-shrink-0">{formatFecha(e.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
 
      {/* Ver entrada completa */}
      {viendoEntrada && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
              <div className="flex items-center gap-3">
                <h2 className="text-white font-semibold">{viendoEntrada.titulo}</h2>
                {viendoEntrada.etiqueta && (
                  <span className={`px-2 py-0.5 rounded-md text-xs border ${coloresEtiqueta[viendoEntrada.etiqueta] ?? coloresEtiqueta['Otro']}`}>
                    {viendoEntrada.etiqueta}
                  </span>
                )}
              </div>
              <button onClick={() => setViendoEntrada(null)} className="text-slate-500 hover:text-white">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <p className="text-slate-400 text-xs mb-4">{formatFecha(viendoEntrada.created_at)}</p>
              <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{viendoEntrada.contenido}</p>
            </div>
            <div className="flex gap-3 p-6 border-t border-slate-700/50">
              <button onClick={() => eliminar(viendoEntrada.id)} className="px-4 py-2.5 text-red-400 hover:bg-red-500/10 rounded-xl text-sm transition-colors">Eliminar</button>
              <button onClick={() => abrirFormEditar(viendoEntrada)} className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm transition-colors">Editar</button>
            </div>
          </div>
        </div>
      )}
 
      {/* Formulario */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
              <h2 className="text-white font-semibold">{editando ? 'Editar entrada' : 'Nueva entrada'}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
 
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="text-slate-400 text-xs block mb-1.5">Título *</label>
                <input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/50"
                  placeholder="Título de la entrada" />
              </div>
              <div>
                <label className="text-slate-400 text-xs block mb-1.5">Etiqueta</label>
                <div className="flex flex-wrap gap-2">
                  {ETIQUETAS.map(et => (
                    <button
                      key={et}
                      onClick={() => setForm(f => ({ ...f, etiqueta: f.etiqueta === et ? '' : et }))}
                      className={`px-3 py-1 rounded-lg text-xs border transition-colors ${
                        form.etiqueta === et
                          ? coloresEtiqueta[et]
                          : 'border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-400'
                      }`}
                    >
                      {et}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-slate-400 text-xs block mb-1.5">Contenido *</label>
                <textarea value={form.contenido} onChange={e => setForm(f => ({ ...f, contenido: e.target.value }))}
                  rows={10} className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/50 resize-none"
                  placeholder="Escribe tu entrada..." />
              </div>
            </div>
 
            <div className="flex gap-3 p-6 border-t border-slate-700/50">
              <button onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm transition-colors">Cancelar</button>
              <button onClick={guardar} disabled={submitting || !form.titulo.trim() || !form.contenido.trim()}
                className="flex-1 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-colors">
                {submitting ? 'Guardando...' : editando ? 'Guardar cambios' : 'Guardar entrada'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
 