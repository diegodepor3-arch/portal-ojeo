"use client"
import { useState } from 'react';

export default function PerfilScouter({ params }: { params: { id: string } }) {
  // Datos personales solicitados en el audio
  const [datosPerfil] = useState({
    nombre: "Adrián",
    apellidos: "Sáenz",
    pais: "España",
    nacionalidad: "Española",
    residencia: "Madrid",
    rol: "Ojeador / Scouter"
  });

  // Panel de rendimiento y métricas del audio
  const [rendimiento] = useState({
    informesRealizados: 124,
    jugadoresOjeados: 56,
    fichajesExitosos: 12, // Recomendaciones que acabaron en fichaje
    zonas: ["Andalucía", "Madrid", "Extremadura"]
  });

  const porcentajeExito = ((rendimiento.fichajesExitosos / rendimiento.jugadoresOjeados) * 100).toFixed(1);

  return (
    <div className="min-h-screen bg-[#0b0d17] text-white p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* CABECERA: DATOS PERSONALES */}
        <div className="bg-[#1a1c2e] p-8 rounded-[40px] border border-slate-800 flex flex-col md:flex-row gap-8 items-center shadow-2xl">
          <div className="w-32 h-32 bg-blue-600 rounded-3xl flex items-center justify-center text-4xl font-black">
            {datosPerfil.nombre[0]}
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl font-black tracking-tighter uppercase">{datosPerfil.nombre} {datosPerfil.apellidos}</h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-6 mt-4 text-slate-400 font-bold text-xs uppercase tracking-widest">
              <span>📍 {datosPerfil.residencia}, {datosPerfil.pais}</span>
              <span>🏳️ {datosPerfil.nacionalidad}</span>
              <span className="text-blue-500">🛡️ {datosPerfil.rol}</span>
            </div>
          </div>
        </div>

        {/* PANEL ADICIONAL DE RENDIMIENTO (Solicitado en audio) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#1a1c2e] p-6 rounded-[30px] border border-slate-800 text-center">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Informes Totales</p>
            <h3 className="text-4xl font-black text-white">{rendimiento.informesRealizados}</h3>
          </div>
          <div className="bg-[#1a1c2e] p-6 rounded-[30px] border border-slate-800 text-center">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Jugadores Ojeados</p>
            <h3 className="text-4xl font-black text-white">{rendimiento.jugadoresOjeados}</h3>
          </div>
          <div className="bg-[#1a1c2e] p-6 rounded-[30px] border border-slate-800 text-center border-b-green-500/50">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">% Éxito Fichaje</p>
            <h3 className="text-4xl font-black text-green-500">{porcentajeExito}%</h3>
          </div>
        </div>

        {/* ZONAS GEOGRÁFICAS Y ACTIVIDAD */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-[#1a1c2e] p-8 rounded-[40px] border border-slate-800">
            <h2 className="text-lg font-black mb-6 uppercase tracking-tight">Zonas de Cobertura</h2>
            <div className="flex flex-wrap gap-3">
              {rendimiento.zonas.map(zona => (
                <span key={zona} className="bg-[#0b0d17] px-4 py-2 rounded-xl border border-slate-700 text-xs font-bold">
                  {zona}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-[#1a1c2e] p-8 rounded-[40px] border border-slate-800 flex items-center justify-center">
             <p className="text-slate-600 text-xs font-bold uppercase tracking-widest italic">
               Gráfica de rendimiento próximamente...
             </p>
          </div>
        </div>

      </div>
    </div>
  );
}