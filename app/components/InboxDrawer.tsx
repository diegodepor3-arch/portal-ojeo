'use client';

import { useState, useEffect } from 'react';

// --- Interfaces ---
interface JugadorPendiente { id: string; nombre: string; posicion: string; diasSinActualizar: number; }
interface PartidoRadar { id: string; equipoLocal: string; equipoVisitante: string; fecha: string; hora: string; jugadoresEnRadar: number; competicion: string; }
interface AlertaContrato { id: string; jugador: string; club: string; mesesRestantes: number; tipo: 'critico' | 'aviso' | 'info'; }
interface MensajeEquipo { id: string; autor: string; mensaje: string; hace: string; leido: boolean; }

function Iniciales({ nombre }: { nombre: string }) {
  const partes = nombre.split(' ');
  const ini = partes.length >= 2 ? partes[0][0] + partes[1][0] : partes[0][0];
  return (
    <div style={{ 
      width: 32, height: 32, borderRadius: '8px', 
      background: 'linear-gradient(135deg, #1e293b, #0f172a)', 
      border: '1px solid rgba(255,255,255,0.1)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', 
      fontSize: 10, fontWeight: 700, color: '#94a3b8', flexShrink: 0 
    }}>
      {ini.toUpperCase()}
    </div>
  );
}

export default function InboxDrawer() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'todo' | 'jugadores' | 'partidos' | 'contratos' | 'mensajes'>('todo');

  // --- ESTADO REAL (Vacío, sin datos demo) ---
  const [jugadoresPendientes] = useState<JugadorPendiente[]>([]);
  const [partidosRadar] = useState<PartidoRadar[]>([]);
  const [alertasContrato] = useState<AlertaContrato[]>([]);
  const [mensajesEquipo] = useState<MensajeEquipo[]>([]);

  const totalNotifs = jugadoresPendientes.length + partidosRadar.length + 
                     alertasContrato.filter(a => a.tipo === 'critico').length + 
                     mensajesEquipo.filter(m => !m.leido).length;

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, []);

  return (
    <>
      {/* Botón Disparador - AJUSTADO PARA SUBIR POSICIÓN */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{ 
          position: 'relative', 
          background: 'rgba(255,255,255,0.03)', 
          border: '1px solid rgba(255,255,255,0.1)', 
          borderRadius: '12px', 
          cursor: 'pointer', 
          width: 42, 
          height: 42, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          transition: 'all 0.2s',
          // MODIFICACIÓN PARA SUBIR EL SÍMBOLO
          transform: 'translateY(-6px)', 
          zIndex: 10
        }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)'}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
        </svg>
        
        {totalNotifs > 0 && (
          <span style={{ 
            position: 'absolute', top: -2, right: -2, background: '#3b82f6', 
            color: '#fff', fontSize: 10, fontWeight: 900, borderRadius: 999, 
            width: 18, height: 18, display: 'flex', alignItems: 'center', 
            justifyContent: 'center', border: '2px solid #020617' 
          }}>
            {totalNotifs}
          </span>
        )}
      </button>

      {/* Overlay */}
      {open && <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 10000, backdropFilter: 'blur(4px)' }} />}

      {/* Panel Lateral */}
      <div style={{ 
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 380, 
        background: '#020617', borderLeft: '1px solid rgba(255,255,255,0.05)', 
        zIndex: 10001, transform: open ? 'translateX(0)' : 'translateX(100%)', 
        transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)', 
        display: 'flex', flexDirection: 'column', boxShadow: '-20px 0 50px rgba(0,0,0,0.5)'
      }}>
        
        <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#f8fafc', margin: 0, letterSpacing: '-0.02em' }}>Bandeja de entrada</h2>
              <p style={{ fontSize: 11, color: '#475569', margin: '4px 0 0', fontWeight: 600 }}>{totalNotifs} PENDIENTES</p>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#94a3b8', padding: '8px', fontSize: 12 }}>✕</button>
          </div>

          <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.02)', padding: 4, borderRadius: 10 }}>
            {(['todo', 'jugadores', 'partidos', 'contratos', 'mensajes'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ 
                flex: 1, padding: '8px 2px', borderRadius: '7px', cursor: 'pointer', fontSize: 10, fontWeight: 700,
                transition: 'all 0.2s', border: 'none',
                background: tab === t ? '#1e293b' : 'transparent',
                color: tab === t ? '#3b82f6' : '#475569',
                textTransform: 'uppercase'
              }}>
                {t === 'todo' ? 'Ver todo' : t.charAt(0)}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {totalNotifs === 0 ? (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.4 }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>📩</div>
              <p style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>No hay notificaciones</p>
            </div>
          ) : (
             <div className="space-y-4">
                {/* Aquí se renderizarán los datos reales cuando los conectes */}
             </div>
          )}
        </div>

        <div style={{ padding: '20px', background: '#020617', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 10 }}>
          <button style={{ flex: 1, padding: '12px', background: '#3b82f6', border: 'none', borderRadius: '12px', color: '#fff', fontSize: 11, fontWeight: 800, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Ir al centro de control
          </button>
        </div>
      </div>
    </>
  );
}