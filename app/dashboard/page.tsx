'use client'

import { useAuth } from '@/context/AuthContext'

export default function DashboardPage() {
  const { perfil } = useAuth()

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          Bienvenido, {perfil?.nombre?.split(' ')[0]} 👋
        </h1>
        <p className="text-slate-400 mt-1">Tu panel de scouting privado</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { label: 'Jugadores seguidos', href: '/dashboard/jugadores', color: 'emerald', icon: '👤' },
          { label: 'Partidos analizados', href: '/dashboard/partidos', color: 'blue', icon: '📋' },
          { label: 'Vídeos guardados', href: '/dashboard/videos', color: 'purple', icon: '🎥' },
          { label: 'Entradas de diario', href: '/dashboard/diario', color: 'amber', icon: '✍️' },
          { label: 'Eventos en calendario', href: '/dashboard/calendario', color: 'rose', icon: '📅' },
        ].map(item => (
          <a
            key={item.href}
            href={item.href}
            className="bg-[#111827] border border-slate-700/50 rounded-2xl p-6 hover:border-slate-600 transition-all group"
          >
            <div className="text-3xl mb-3">{item.icon}</div>
            <p className="text-white font-medium group-hover:text-emerald-400 transition-colors">{item.label}</p>
            <p className="text-slate-500 text-sm mt-1">Ver todos →</p>
          </a>
        ))}
      </div>
    </div>
  )
}
