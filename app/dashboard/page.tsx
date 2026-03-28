'use client'
 
import { useAuth } from '@/context/AuthContext'
import { Syne, DM_Sans } from 'next/font/google'
 
const syne = Syne({ subsets: ['latin'], weight: ['700', '800'] })
const dmSans = DM_Sans({ subsets: ['latin'], weight: ['300', '400', '500'] })
 
const CARDS = [
  { label: 'Jugadores seguidos', href: '/dashboard/jugadores', icon: '👤', color: '#10b981' },
  { label: 'Partidos analizados', href: '/dashboard/partidos', icon: '📋', color: '#3b82f6' },
  { label: 'Vídeos guardados', href: '/dashboard/videos', icon: '🎥', color: '#8b5cf6' },
  { label: 'Entradas de diario', href: '/dashboard/diario', icon: '✍️', color: '#f59e0b' },
  { label: 'Eventos en calendario', href: '/dashboard/calendario', icon: '📅', color: '#ef4444' },
]
 
export default function DashboardPage() {
  const { perfil } = useAuth()
 
  return (
    <>
      <style>{`
        .dash-root {
          padding: 0;
        }
        .dash-header {
          margin-bottom: 32px;
        }
        .dash-title {
          font-size: 28px;
          font-weight: 800;
          color: white;
          letter-spacing: -0.02em;
          margin-bottom: 6px;
        }
        .dash-subtitle {
          color: #6b7280;
          font-size: 14px;
        }
        .dash-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 16px;
        }
        .dash-card {
          background: rgba(17,24,39,0.8);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 20px;
          padding: 24px;
          text-decoration: none;
          display: block;
          transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
          cursor: pointer;
        }
        .dash-card:hover {
          border-color: rgba(255,255,255,0.15);
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.3);
        }
        .dash-card-icon {
          font-size: 32px;
          margin-bottom: 14px;
          display: block;
        }
        .dash-card-label {
          color: white;
          font-size: 15px;
          font-weight: 600;
          margin-bottom: 6px;
        }
        .dash-card-sub {
          color: #4b5563;
          font-size: 13px;
        }
        .dash-card-dot {
          display: inline-block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          margin-right: 6px;
          vertical-align: middle;
        }
      `}</style>
 
      <div className={`dash-root ${dmSans.className}`}>
        <div className="dash-header">
          <h1 className={`dash-title ${syne.className}`}>
            Bienvenido, {perfil?.nombre?.split(' ')[0]} 👋
          </h1>
          <p className="dash-subtitle">Tu panel de scouting privado</p>
        </div>
 
        <div className="dash-grid">
          {CARDS.map(item => (
            <a key={item.href} href={item.href} className="dash-card">
              <span className="dash-card-icon">{item.icon}</span>
              <p className="dash-card-label">{item.label}</p>
              <p className="dash-card-sub">
                <span className="dash-card-dot" style={{ background: item.color }} />
                Ver todos →
              </p>
            </a>
          ))}
        </div>
      </div>
    </>
  )
}