'use client'
 
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Syne, DM_Sans } from 'next/font/google'
 
const syne = Syne({ subsets: ['latin'], weight: ['700', '800'] })
const dmSans = DM_Sans({ subsets: ['latin'], weight: ['300', '400', '500'] })
 
const POSICIONES = [
  'Portero',
  'Lateral derecho', 'Lateral izquierdo', 'Central',
  'Pivote', 'Mediocentro', 'Mediapunta',
  'Extremo derecho', 'Extremo izquierdo',
  'Delantero centro', 'Segunda punta',
]
 
export default function NuevoJugadorPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
 
  const [nombre, setNombre] = useState('')
  const [posicion, setPosicion] = useState('')
  const [equipoActual, setEquipoActual] = useState('')
  const [edad, setEdad] = useState('')
  const [nacionalidad, setNacionalidad] = useState('')
  const [valoracion, setValoracion] = useState(5)
  const [notas, setNotas] = useState('')
 
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
 
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('No hay sesión activa'); setLoading(false); return }
 
    const { error: err } = await supabase.from('jugadores').insert({
      user_id: user.id,
      nombre: nombre.trim(),
      posicion: posicion.trim(),
      equipo_actual: equipoActual.trim(),
      edad: edad ? parseInt(edad) : null,
      nacionalidad: nacionalidad.trim(),
      valoracion,
      notas: notas.trim(),
    })
 
    if (err) {
      setError('Error al guardar: ' + err.message)
      setLoading(false)
      return
    }
 
    router.push('/jugadores')
  }
 
  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .nj-root { max-width: 680px; margin: 0 auto; padding: 0 0 60px; }
        .nj-header { margin-bottom: 32px; }
        .nj-title { font-size: 26px; font-weight: 800; color: white; letter-spacing: -0.03em; margin-bottom: 6px; }
        .nj-sub { color: #4b5563; font-size: 13px; }
        .nj-card {
          background: rgba(17,24,39,0.8);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 20px; padding: 32px;
          box-shadow: 0 16px 48px rgba(0,0,0,0.3);
        }
        .nj-section { margin-bottom: 28px; }
        .nj-section-title {
          font-size: 11px; font-weight: 700; color: #4b5563;
          text-transform: uppercase; letter-spacing: 0.1em;
          margin-bottom: 16px; padding-bottom: 8px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .nj-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .nj-field { display: flex; flex-direction: column; gap: 6px; }
        .nj-label { font-size: 12px; font-weight: 600; color: #6b7280; }
        .nj-input {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px; padding: 11px 14px;
          color: white; font-size: 14px; outline: none;
          transition: border-color 0.2s, background 0.2s;
          width: 100%;
        }
        .nj-input::placeholder { color: #374151; }
        .nj-input:focus { border-color: rgba(59,130,246,0.4); background: rgba(59,130,246,0.03); }
        .nj-select {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px; padding: 11px 14px;
          color: white; font-size: 14px; outline: none;
          width: 100%; cursor: pointer;
          transition: border-color 0.2s;
        }
        .nj-select:focus { border-color: rgba(59,130,246,0.4); }
        .nj-textarea {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px; padding: 11px 14px;
          color: white; font-size: 14px; outline: none;
          width: 100%; resize: vertical; min-height: 100px;
          font-family: inherit;
          transition: border-color 0.2s, background 0.2s;
        }
        .nj-textarea::placeholder { color: #374151; }
        .nj-textarea:focus { border-color: rgba(59,130,246,0.4); background: rgba(59,130,246,0.03); }
 
        /* Valoración */
        .nj-val-display {
          text-align: center; margin-bottom: 12px;
        }
        .nj-val-num {
          font-size: 48px; font-weight: 800; line-height: 1;
        }
        .nj-val-sub { font-size: 12px; color: #4b5563; margin-top: 4px; }
        .nj-slider {
          width: 100%; height: 6px; border-radius: 3px;
          cursor: pointer; margin-bottom: 10px;
          outline: none; border: none;
        }
        .nj-val-dots {
          display: flex; justify-content: space-between;
        }
        .nj-val-dot {
          width: 28px; height: 28px; border-radius: 50%;
          border: none; font-size: 11px; font-weight: 700;
          cursor: pointer; transition: all 0.15s;
        }
 
        .nj-error {
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.2);
          border-radius: 10px; padding: 12px 16px;
          color: #f87171; font-size: 13px; margin-bottom: 20px;
        }
 
        .nj-actions { display: flex; gap: 12px; margin-top: 8px; }
        .nj-btn-cancel {
          flex: 1; padding: 13px; border-radius: 10px;
          background: transparent; border: 1px solid rgba(255,255,255,0.08);
          color: #6b7280; font-size: 14px; font-weight: 600;
          cursor: pointer; transition: all 0.15s;
        }
        .nj-btn-cancel:hover { border-color: rgba(255,255,255,0.15); color: white; }
        .nj-btn-save {
          flex: 2; padding: 13px; border-radius: 10px;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          border: none; color: white; font-size: 14px; font-weight: 600;
          cursor: pointer; box-shadow: 0 4px 16px rgba(59,130,246,0.3);
          transition: opacity 0.15s, transform 0.1s;
        }
        .nj-btn-save:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
        .nj-btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
 
        @media (max-width: 600px) {
          .nj-grid { grid-template-columns: 1fr; }
          .nj-card { padding: 20px; }
        }
      `}</style>
 
      <div className={`nj-root ${dmSans.className}`}>
        <div className="nj-header">
          <h1 className={`nj-title ${syne.className}`}>Añadir jugador</h1>
          <p className="nj-sub">Los datos se guardarán en tu base privada de scouting</p>
        </div>
 
        <div className="nj-card">
          <form onSubmit={handleSubmit}>
 
            {/* Datos básicos */}
            <div className="nj-section">
              <div className="nj-section-title">Datos básicos</div>
              <div className="nj-grid">
                <div className="nj-field" style={{ gridColumn: '1 / -1' }}>
                  <label className="nj-label">Nombre completo *</label>
                  <input
                    className="nj-input"
                    placeholder="Ej: Lamine Yamal"
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
                    required
                  />
                </div>
                <div className="nj-field">
                  <label className="nj-label">Posición *</label>
                  <select
                    className="nj-select"
                    value={posicion}
                    onChange={e => setPosicion(e.target.value)}
                    required
                  >
                    <option value="" disabled>Selecciona posición</option>
                    {POSICIONES.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div className="nj-field">
                  <label className="nj-label">Equipo actual</label>
                  <input
                    className="nj-input"
                    placeholder="Ej: FC Barcelona"
                    value={equipoActual}
                    onChange={e => setEquipoActual(e.target.value)}
                  />
                </div>
                <div className="nj-field">
                  <label className="nj-label">Edad</label>
                  <input
                    className="nj-input"
                    type="number"
                    placeholder="Ej: 21"
                    min={14} max={45}
                    value={edad}
                    onChange={e => setEdad(e.target.value)}
                  />
                </div>
                <div className="nj-field">
                  <label className="nj-label">Nacionalidad</label>
                  <input
                    className="nj-input"
                    placeholder="Ej: España"
                    value={nacionalidad}
                    onChange={e => setNacionalidad(e.target.value)}
                  />
                </div>
              </div>
            </div>
 
            {/* Valoración */}
            <div className="nj-section">
              <div className="nj-section-title">Valoración del ojeador</div>
              <div className="nj-val-display">
                <div className="nj-val-num" style={{
                  color: valoracion >= 8 ? '#10b981' : valoracion >= 6 ? '#f59e0b' : '#ef4444'
                }}>
                  {valoracion}
                </div>
                <div className="nj-val-sub">
                  {valoracion >= 8 ? 'Excelente' : valoracion >= 6 ? 'Notable' : valoracion >= 4 ? 'Regular' : 'Bajo'}
                </div>
              </div>
              <input
                type="range" min={1} max={10} step={1}
                value={valoracion}
                onChange={e => setValoracion(parseInt(e.target.value))}
                className="nj-slider"
                style={{
                  accentColor: valoracion >= 8 ? '#10b981' : valoracion >= 6 ? '#f59e0b' : '#ef4444'
                }}
              />
              <div className="nj-val-dots">
                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                  <button
                    key={n} type="button"
                    onClick={() => setValoracion(n)}
                    className="nj-val-dot"
                    style={{
                      background: valoracion === n
                        ? (n >= 8 ? '#10b981' : n >= 6 ? '#f59e0b' : '#ef4444')
                        : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${valoracion === n ? 'transparent' : 'rgba(255,255,255,0.08)'}`,
                      color: valoracion === n ? '#fff' : '#4b5563',
                    }}
                  >{n}</button>
                ))}
              </div>
            </div>
 
            {/* Notas */}
            <div className="nj-section">
              <div className="nj-section-title">Notas de scouting</div>
              <textarea
                className="nj-textarea"
                placeholder="Observaciones, características técnicas, situación contractual..."
                value={notas}
                onChange={e => setNotas(e.target.value)}
              />
            </div>
 
            {error && <div className="nj-error">{error}</div>}
 
            <div className="nj-actions">
              <button
                type="button"
                className="nj-btn-cancel"
                onClick={() => router.push('/jugadores')}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="nj-btn-save"
                disabled={loading}
              >
                {loading ? 'Guardando...' : '+ Añadir jugador'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}