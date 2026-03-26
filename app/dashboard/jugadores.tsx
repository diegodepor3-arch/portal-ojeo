'use client'
 
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
 
type Jugador = {
  id: string
  nombre: string
  posicion: string | null
  equipo_actual: string | null
  edad: number | null
  nacionalidad: string | null
  notas: string | null
  valoracion: number | null
  created_at: string
}
 
const POSICIONES = ['Portero', 'Defensa Central', 'Lateral', 'Mediocentro', 'Mediapunta', 'Extremo', 'Delantero']
 
export default function JugadoresPage() {
  const { user } = useAuth()
  const [jugadores, setJugadores] = useState<Jugador[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState<Jugador | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [busqueda, setBusqueda] = useState('')
 
  const [form, setForm] = useState({
    nombre: '',
    posicion: '',
    equipo_actual: '',
    edad: '',
    nacionalidad: '',
    notas: '',
    valoracion: '',
  })
 
  useEffect(() => {
    if (user) cargar()
  }, [user])
 
  async function cargar() {
    setLoading(true)
    const { data } = await supabase
      .from('jugadores')
      .select('*')
      .order('created_at', { ascending: false })
    setJugadores(data ?? [])
    setLoading(false)
  }
 
  function abrirFormNuevo() {
    setEditando(null)
    setForm({ nombre: '', posicion: '', equipo_actual: '', edad: '', nacionalidad: '', notas: '', valoracion: '' })
    setShowForm(true)
  }
 
  function abrirFormEditar(j: Jugador) {
    setEditando(j)
    setForm({
      nombre: j.nombre,
      posicion: j.posicion ?? '',
      equipo_actual: j.equipo_actual ?? '',
      edad: j.edad?.toString() ?? '',
      nacionalidad: j.nacionalidad ?? '',
      notas: j.notas ?? '',
      valoracion: j.valoracion?.toString() ?? '',
    })
    setShowForm(true)
  }
 
  async function guardar() {
    if (!form.nombre.trim() || !user) return
    setSubmitting(true)
 
    const payload = {
      nombre: form.nombre.trim(),
      posicion: form.posicion || null,
      equipo_actual: form.equipo_actual || null,
      edad: form.edad ? parseInt(form.edad) : null,
      nacionalidad: form.nacionalidad || null,
      notas: form.notas || null,
      valoracion: form.valoracion ? parseInt(form.valoracion) : null,
    }
 
    if (editando) {
      await supabase.from('jugadores').update(payload).eq('id', editando.id)
    } else {
      await supabase.from('jugadores').insert({ ...payload, ojeador_id: user.id })
    }
 
    setShowForm(false)
    setSubmitting(false)
    cargar()
  }
 
  async function eliminar(id: string) {
    if (!confirm('¿Eliminar este jugador?')) return
    await supabase.from('jugadores').delete().eq('id', id)
    cargar()
  }
 
  const filtrados = jugadores.filter(j =>
    j.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (j.equipo_actual ?? '').toLowerCase().includes(busqueda.toLowerCase())
  )
 
  const estrellas = (val: number | null) => {
    if (!val) return null
    return Array.from({ length: 10 }, (_, i) => (
      <span key={i} className={i < val ? 'text-amber-400' : 'text-slate-700'}>★</span>
    ))
  }
 
  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Jugadores</h1>
          <p className="text-slate-400 text-sm mt-1">{jugadores.length} jugadores registrados</p>
        </div>
        <button
          onClick={abrirFormNuevo}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Añadir jugador
        </button>
      </div>
 
      {/* Búsqueda */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Buscar por nombre o equipo..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="w-full max-w-sm px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500/50"
        />
      </div>
 
      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtrados.length === 0 ? (
        <div className="text-center py-20">
          <svg className="w-12 h-12 text-slate-700 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-slate-500">{busqueda ? 'Sin resultados' : 'Aún no has añadido jugadores'}</p>
          {!busqueda && (
            <button onClick={abrirFormNuevo} className="mt-4 text-emerald-400 hover:text-emerald-300 text-sm">
              Añadir el primero →
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtrados.map(j => (
            <div key={j.id} className="bg-[#111827] border border-slate-700/50 rounded-2xl p-5 hover:border-slate-600 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-emerald-400 font-bold text-sm">{j.nombre.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{j.nombre}</p>
                    {j.posicion && <p className="text-slate-400 text-xs">{j.posicion}</p>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => abrirFormEditar(j)} className="p-1.5 text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button onClick={() => eliminar(j.id)} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
 
              <div className="space-y-1.5 text-xs text-slate-400">
                {j.equipo_actual && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600">Equipo</span>
                    <span className="text-slate-300">{j.equipo_actual}</span>
                  </div>
                )}
                {j.edad && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600">Edad</span>
                    <span className="text-slate-300">{j.edad} años</span>
                  </div>
                )}
                {j.nacionalidad && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600">Nac.</span>
                    <span className="text-slate-300">{j.nacionalidad}</span>
                  </div>
                )}
              </div>
 
              {j.valoracion && (
                <div className="mt-3 flex items-center gap-1 text-xs">
                  {estrellas(j.valoracion)}
                  <span className="text-slate-500 ml-1">{j.valoracion}/10</span>
                </div>
              )}
 
              {j.notas && (
                <p className="mt-3 text-xs text-slate-500 line-clamp-2 border-t border-slate-800 pt-3">{j.notas}</p>
              )}
            </div>
          ))}
        </div>
      )}
 
      {/* Modal Formulario */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
              <h2 className="text-white font-semibold">{editando ? 'Editar jugador' : 'Añadir jugador'}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
 
            <div className="p-6 space-y-4">
              <div>
                <label className="text-slate-400 text-xs block mb-1.5">Nombre *</label>
                <input
                  value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/50"
                  placeholder="Nombre completo"
                />
              </div>
 
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 text-xs block mb-1.5">Posición</label>
                  <select
                    value={form.posicion}
                    onChange={e => setForm(f => ({ ...f, posicion: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="">—</option>
                    {POSICIONES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 text-xs block mb-1.5">Edad</label>
                  <input
                    type="number"
                    value={form.edad}
                    onChange={e => setForm(f => ({ ...f, edad: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/50"
                    placeholder="22"
                    min={14} max={50}
                  />
                </div>
              </div>
 
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 text-xs block mb-1.5">Equipo actual</label>
                  <input
                    value={form.equipo_actual}
                    onChange={e => setForm(f => ({ ...f, equipo_actual: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/50"
                    placeholder="Club"
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-xs block mb-1.5">Nacionalidad</label>
                  <input
                    value={form.nacionalidad}
                    onChange={e => setForm(f => ({ ...f, nacionalidad: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/50"
                    placeholder="Española"
                  />
                </div>
              </div>
 
              <div>
                <label className="text-slate-400 text-xs block mb-1.5">Valoración (1-10)</label>
                <input
                  type="number"
                  value={form.valoracion}
                  onChange={e => setForm(f => ({ ...f, valoracion: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/50"
                  placeholder="7"
                  min={1} max={10}
                />
              </div>
 
              <div>
                <label className="text-slate-400 text-xs block mb-1.5">Notas</label>
                <textarea
                  value={form.notas}
                  onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/50 resize-none"
                  placeholder="Observaciones sobre el jugador..."
                />
              </div>
            </div>
 
            <div className="flex gap-3 p-6 border-t border-slate-700/50">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={guardar}
                disabled={submitting || !form.nombre.trim()}
                className="flex-1 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-colors"
              >
                {submitting ? 'Guardando...' : editando ? 'Guardar cambios' : 'Añadir jugador'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}