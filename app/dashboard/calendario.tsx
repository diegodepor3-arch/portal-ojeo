'use client'
 
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
 
type Evento = {
  id: string
  titulo: string
  fecha: string
  hora: string | null
  tipo: string
  notas: string | null
  created_at: string
}
 
const TIPOS = ['partido', 'viaje', 'reunión', 'formación', 'otro']
 
const coloresTipo: Record<string, string> = {
  partido: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  viaje: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  reunión: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  formación: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  otro: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
}
 
export default function CalendarioPage() {
  const { user } = useAuth()
  const [eventos, setEventos] = useState<Evento[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState<Evento | null>(null)
  const [submitting, setSubmitting] = useState(false)
 
  const [form, setForm] = useState({
    titulo: '',
    fecha: '',
    hora: '',
    tipo: 'partido',
    notas: '',
  })
 
  useEffect(() => { if (user) cargar() }, [user])
 
  async function cargar() {
    setLoading(true)
    const { data } = await supabase
      .from('calendario')
      .select('*')
      .order('fecha', { ascending: true })
    setEventos(data ?? [])
    setLoading(false)
  }
 
  function abrirFormNuevo() {
    setEditando(null)
    setForm({ titulo: '', fecha: '', hora: '', tipo: 'partido', notas: '' })
    setShowForm(true)
  }
 
  function abrirFormEditar(e: Evento) {
    setEditando(e)
    setForm({
      titulo: e.titulo,
      fecha: e.fecha,
      hora: e.hora ?? '',
      tipo: e.tipo,
      notas: e.notas ?? '',
    })
    setShowForm(true)
  }
 
  async function guardar() {
    if (!form.titulo.trim() || !form.fecha || !user) return
    setSubmitting(true)
 
    const payload = {
      titulo: form.titulo.trim(),
      fecha: form.fecha,
      hora: form.hora || null,
      tipo: form.tipo,
      notas: form.notas || null,
    }
 
    if (editando) {
      await supabase.from('calendario').update(payload).eq('id', editando.id)
    } else {
      await supabase.from('calendario').insert({ ...payload, ojeador_id: user.id })
    }
 
    setShowForm(false)
    setSubmitting(false)
    cargar()
  }
 
  async function eliminar(id: string) {
    if (!confirm('¿Eliminar este evento?')) return
    await supabase.from('calendario').delete().eq('id', id)
    cargar()
  }
 
  const hoy = new Date().toISOString().split('T')[0]
  const proximos = eventos.filter(e => e.fecha >= hoy)
  const pasados = eventos.filter(e => e.fecha < hoy)
 
  const formatFecha = (f: string) =>
    new Date(f + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' })
 
  const diasRestantes = (f: string) => {
    const diff = Math.ceil((new Date(f + 'T12:00:00').getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    if (diff === 0) return 'Hoy'
    if (diff === 1) return 'Mañana'
    if (diff > 0) return `En ${diff} días`
    return `Hace ${Math.abs(diff)} días`
  }
 
  const EventoCard = ({ e, pasado = false }: { e: Evento; pasado?: boolean }) => (
    <div className={`bg-[#111827] border rounded-2xl p-4 transition-colors ${pasado ? 'border-slate-800 opacity-60' : 'border-slate-700/50 hover:border-slate-600'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3 flex-1 min-w-0">
          <div className="flex-shrink-0 text-center w-12">
            <p className="text-white font-bold text-lg leading-none">{new Date(e.fecha + 'T12:00:00').getDate()}</p>
            <p className="text-slate-500 text-xs uppercase">{new Date(e.fecha + 'T12:00:00').toLocaleDateString('es-ES', { month: 'short' })}</p>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 rounded-md text-xs border ${coloresTipo[e.tipo] ?? coloresTipo['otro']}`}>{e.tipo}</span>
              {!pasado && <span className="text-slate-500 text-xs">{diasRestantes(e.fecha)}</span>}
            </div>
            <p className="text-white font-medium text-sm truncate">{e.titulo}</p>
            {e.hora && <p className="text-slate-500 text-xs mt-0.5">{e.hora.slice(0, 5)}</p>}
            {e.notas && <p className="text-slate-600 text-xs mt-1 line-clamp-1">{e.notas}</p>}
          </div>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button onClick={() => abrirFormEditar(e)} className="p-1.5 text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button onClick={() => eliminar(e.id)} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
 
  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Calendario</h1>
          <p className="text-slate-400 text-sm mt-1">{proximos.length} próximos eventos</p>
        </div>
        <button
          onClick={abrirFormNuevo}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Añadir evento
        </button>
      </div>
 
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : eventos.length === 0 ? (
        <div className="text-center py-20">
          <svg className="w-12 h-12 text-slate-700 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-slate-500">No hay eventos programados</p>
          <button onClick={abrirFormNuevo} className="mt-4 text-emerald-400 hover:text-emerald-300 text-sm">
            Añadir el primero →
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {proximos.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Próximos</p>
              <div className="space-y-2">
                {proximos.map(e => <EventoCard key={e.id} e={e} />)}
              </div>
            </div>
          )}
          {pasados.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">Pasados</p>
              <div className="space-y-2">
                {pasados.slice(0, 5).map(e => <EventoCard key={e.id} e={e} pasado />)}
              </div>
            </div>
          )}
        </div>
      )}
 
      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] border border-slate-700 rounded-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
              <h2 className="text-white font-semibold">{editando ? 'Editar evento' : 'Añadir evento'}</h2>
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
                  placeholder="Partido Deportivo vs Lugo" />
              </div>
 
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 text-xs block mb-1.5">Fecha *</label>
                  <input type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/50" />
                </div>
                <div>
                  <label className="text-slate-400 text-xs block mb-1.5">Hora</label>
                  <input type="time" value={form.hora} onChange={e => setForm(f => ({ ...f, hora: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/50" />
                </div>
              </div>
 
              <div>
                <label className="text-slate-400 text-xs block mb-1.5">Tipo</label>
                <div className="flex flex-wrap gap-2">
                  {TIPOS.map(t => (
                    <button key={t} onClick={() => setForm(f => ({ ...f, tipo: t }))}
                      className={`px-3 py-1 rounded-lg text-xs border capitalize transition-colors ${
                        form.tipo === t ? coloresTipo[t] : 'border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-400'
                      }`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
 
              <div>
                <label className="text-slate-400 text-xs block mb-1.5">Notas</label>
                <textarea value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                  rows={2} className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/50 resize-none"
                  placeholder="Detalles adicionales..." />
              </div>
            </div>
 
            <div className="flex gap-3 p-6 border-t border-slate-700/50">
              <button onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm transition-colors">Cancelar</button>
              <button onClick={guardar} disabled={submitting || !form.titulo.trim() || !form.fecha}
                className="flex-1 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-colors">
                {submitting ? 'Guardando...' : editando ? 'Guardar cambios' : 'Añadir evento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}