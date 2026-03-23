"use client"
import { useState, useEffect } from 'react';
import { es } from 'date-fns/locale';
import { format, addDays, startOfWeek, addWeeks, subWeeks } from 'date-fns';
 
type PartidoCalendario = {
  id: number;
  fecha: string; // toDateString()
  hora: string;
  equipos: string;
  estado: string;
  competicion?: string;
  estadio?: string;
};
 
function cargarDesdeStorage(): PartidoCalendario[] {
  try {
    const data = localStorage.getItem("calendario_partidos");
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}
 
function guardarEnStorage(partidos: PartidoCalendario[]) {
  try {
    localStorage.setItem("calendario_partidos", JSON.stringify(partidos));
  } catch {}
}
 
export default function CalendarioHorizontal() {
  const [fechaInicio, setFechaInicio] = useState(startOfWeek(new Date(), { locale: es }));
  const [partidos, setPartidos] = useState<PartidoCalendario[]>([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [cargado, setCargado] = useState(false);
 
  // Cargar desde localStorage al montar
  useEffect(() => {
    setPartidos(cargarDesdeStorage());
    setCargado(true);
  }, []);
 
  const diasSemana = Array.from({ length: 7 }, (_, i) => addDays(fechaInicio, i));
 
  const añadirPartido = (e: any) => {
    e.preventDefault();
    const nuevaFecha = new Date(e.target.fecha.value + "T12:00:00");
    const nuevo: PartidoCalendario = {
      id: Date.now(),
      fecha: nuevaFecha.toDateString(),
      hora: e.target.hora.value,
      equipos: e.target.equipos.value,
      estado: e.target.estado.value,
    };
    const actualizados = [...partidos, nuevo];
    setPartidos(actualizados);
    guardarEnStorage(actualizados);
    setMostrarForm(false);
  };
 
  const eliminarPartido = (id: number) => {
    const actualizados = partidos.filter(p => p.id !== id);
    setPartidos(actualizados);
    guardarEnStorage(actualizados);
  };
 
  const cambiarEstado = (id: number, estado: string) => {
    const actualizados = partidos.map(p => p.id === id ? { ...p, estado } : p);
    setPartidos(actualizados);
    guardarEnStorage(actualizados);
  };
 
  if (!cargado) return null;
 
  return (
    <div className="min-h-screen bg-[#0b0d17] text-white p-4 md:p-8">
 
      {/* CABECERA Y NAVEGACIÓN */}
      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter">PLANIFICACIÓN SEMANAL</h1>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">ScoutPro Agenda · {partidos.length} partido{partidos.length !== 1 ? "s" : ""} guardado{partidos.length !== 1 ? "s" : ""}</p>
        </div>
 
        <div className="flex gap-3 items-center flex-wrap">
          {/* Navegación semanas */}
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setFechaInicio(subWeeks(fechaInicio, 1))}
              className="bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg font-bold text-sm transition-all"
            >←</button>
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider px-2">
              {format(fechaInicio, "d MMM", { locale: es })} – {format(addDays(fechaInicio, 6), "d MMM", { locale: es })}
            </span>
            <button
              onClick={() => setFechaInicio(addWeeks(fechaInicio, 1))}
              className="bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg font-bold text-sm transition-all"
            >→</button>
          </div>
          <button
            onClick={() => setFechaInicio(startOfWeek(new Date(), { locale: es }))}
            className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg font-bold text-xs transition-all text-slate-300"
          >Hoy</button>
          <button
            onClick={() => setMostrarForm(true)}
            className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-xl font-bold text-sm transition-all"
          >+ Añadir Partido</button>
        </div>
      </div>
 
      {/* GRID HORIZONTAL (7 COLUMNAS) */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4 min-h-[600px]">
        {diasSemana.map((dia, index) => {
          const partidosDelDia = partidos.filter(p => p.fecha === dia.toDateString());
          const esHoy = dia.toDateString() === new Date().toDateString();
 
          return (
            <div key={index} className={`flex flex-col rounded-[24px] border transition-all ${esHoy ? 'bg-[#1a1c2e] border-blue-500/50' : 'bg-[#111423] border-slate-800'}`}>
 
              {/* Header del día */}
              <div className={`p-4 text-center border-b ${esHoy ? 'border-blue-500/20' : 'border-slate-800'}`}>
                <p className={`text-[10px] font-black uppercase tracking-widest ${esHoy ? 'text-blue-400' : 'text-slate-500'}`}>
                  {format(dia, 'eee', { locale: es })}
                </p>
                <h3 className="text-2xl font-black mt-1">{format(dia, 'd')}</h3>
                {esHoy && <span className="text-[9px] text-blue-400 font-bold uppercase tracking-widest">Hoy</span>}
              </div>
 
              {/* Partidos del día */}
              <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[500px]">
                {partidosDelDia.map((p) => (
                  <div key={p.id} className="bg-[#0b0d17] p-3 rounded-2xl border border-slate-800 group relative hover:border-blue-500/50 transition-all">
                    <button
                      onClick={() => eliminarPartido(p.id)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-500 text-xs"
                    >✕</button>
 
                    <span className="text-[10px] font-bold text-blue-500">{p.hora}</span>
                    {p.competicion && (
                      <span className="text-[9px] text-slate-500 ml-2">{p.competicion}</span>
                    )}
                    <h4 className="text-xs font-bold leading-tight mt-1 mb-2 uppercase pr-4">{p.equipos}</h4>
                    {p.estadio && p.estadio !== "—" && (
                      <p className="text-[9px] text-slate-600 mb-2">🏟️ {p.estadio}</p>
                    )}
 
                    {/* Selector de estado */}
                    <select
                      value={p.estado}
                      onChange={e => cambiarEstado(p.id, e.target.value)}
                      className={`text-[9px] font-black px-2 py-0.5 rounded uppercase border-0 cursor-pointer w-full
                        ${p.estado === 'Visto' ? 'bg-green-500/10 text-green-500' :
                          p.estado === 'Diferido' ? 'bg-blue-500/10 text-blue-500' : 'bg-yellow-500/10 text-yellow-500'}`}
                      style={{ background: "transparent" }}
                    >
                      <option value="Pendiente">Pendiente</option>
                      <option value="Visto">Visto</option>
                      <option value="Diferido">En Diferido</option>
                    </select>
                  </div>
                ))}
 
                {partidosDelDia.length === 0 && (
                  <div className="h-full flex items-center justify-center opacity-10">
                    <span className="text-[10px] font-bold uppercase rotate-90 whitespace-nowrap tracking-[0.5em]">Sin partidos</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
 
      {/* MODAL FORMULARIO */}
      {mostrarForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={añadirPartido} className="bg-[#1a1c2e] p-8 rounded-[32px] border border-slate-700 w-full max-w-md shadow-2xl space-y-4">
            <h2 className="text-xl font-black mb-4">NUEVO PARTIDO</h2>
 
            <input name="equipos" placeholder="Equipos (Ej: Real Madrid vs Barça)" className="w-full bg-[#0b0d17] p-4 rounded-xl border border-slate-800 outline-none" required />
 
            <div className="grid grid-cols-2 gap-4">
              <input name="fecha" type="date" className="w-full bg-[#0b0d17] p-4 rounded-xl border border-slate-800 text-xs" required />
              <input name="hora" type="time" className="w-full bg-[#0b0d17] p-4 rounded-xl border border-slate-800 text-xs" required />
            </div>
 
            <select name="estado" className="w-full bg-[#0b0d17] p-4 rounded-xl border border-slate-800 text-xs">
              <option value="Pendiente">Pendiente</option>
              <option value="Visto">Visto</option>
              <option value="Diferido">En Diferido</option>
            </select>
 
            <div className="flex gap-4 pt-4">
              <button type="button" onClick={() => setMostrarForm(false)} className="flex-1 text-slate-500 font-bold uppercase text-xs">Cerrar</button>
              <button type="submit" className="flex-1 bg-blue-600 py-4 rounded-xl font-bold uppercase text-xs">Guardar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}