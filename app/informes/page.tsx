"use client";
import { useState, useEffect } from "react";

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwVmP41H4_j56ZqAM4lggPuch-z_l8MgGYhlhde-Ry8jZxdDbjjL3G6QxrJaTHsIVRI6g/exec";

export default function InformesPage() {
  const [ojeadores, setOjeadores] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const fetchOjeadores = async () => {
      try {
        const res = await fetch(`${APPS_SCRIPT_URL}?action=getOjeadores&t=${Date.now()}`);
        const data = await res.json();
        if (Array.isArray(data)) setOjeadores(data);
      } catch (e) {
        console.error("Error cargando ojeadores");
      } finally {
        setCargando(false);
      }
    };
    fetchOjeadores();
  }, []);

  return (
    <div className="p-8 text-white max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-black uppercase tracking-tighter text-amber-500">Gestión de Ojeadores</h1>
        <span className="bg-amber-500/10 text-amber-500 px-4 py-1 rounded-full text-[10px] font-bold border border-amber-500/20">
          {ojeadores.length} REGISTRADOS
        </span>
      </div>

      {cargando ? (
        <div className="text-center p-20 animate-pulse text-slate-500 font-bold uppercase text-xs">Conectando con la nube...</div>
      ) : (
        <div className="grid gap-4">
          {ojeadores.map((oj: any) => (
            <div key={oj.id} className="bg-[#1a1c2e] border border-slate-800 p-6 rounded-[32px] flex justify-between items-center hover:border-blue-500/50 transition-all shadow-xl">
              <div>
                <h3 className="text-lg font-black text-white">{oj.nombre}</h3>
                <p className="text-xs text-slate-500 font-medium">{oj.email}</p>
                <div className="mt-3 flex gap-2">
                  <span className="bg-blue-600/10 text-blue-400 text-[9px] px-3 py-1 rounded-lg font-bold border border-blue-500/10 uppercase">Clave: {oj.password}</span>
                </div>
              </div>
              <button className="bg-slate-800 hover:bg-blue-600 px-6 py-3 rounded-2xl text-[10px] font-bold uppercase transition-all shadow-lg">
                Ver Informes →
              </button>
            </div>
          ))}
          
          {ojeadores.length === 0 && (
            <div className="bg-[#1a1c2e] p-10 rounded-[40px] border border-dashed border-slate-800 text-center">
              <p className="text-slate-500 font-bold uppercase text-xs">No hay ojeadores en la base de datos.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}