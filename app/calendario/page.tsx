"use client";
import { useState, useEffect } from "react";
import { es } from "date-fns/locale";
import { format, addDays, startOfWeek, addWeeks, subWeeks } from "date-fns";
import { supabase } from "@/lib/supabaseClient";
import { Syne, DM_Sans } from "next/font/google";
 
const syne = Syne({ subsets: ["latin"], weight: ["700", "800"] });
const dmSans = DM_Sans({ subsets: ["latin"], weight: ["300", "400", "500"] });
 
type PartidoCalendario = {
  id: string;
  partido_id?: number | null;
  fecha: string;
  hora: string;
  equipos: string;
  estado: string;
  competicion?: string;
  estadio?: string;
  es_manual: boolean;
};
 
const ESTADO_COLORS: Record<string, { bg: string; color: string; dot: string }> = {
  Pendiente: { bg: "rgba(245,158,11,0.1)", color: "#f59e0b", dot: "#f59e0b" },
  Visto: { bg: "rgba(16,185,129,0.1)", color: "#10b981", dot: "#10b981" },
  Diferido: { bg: "rgba(59,130,246,0.1)", color: "#3b82f6", dot: "#3b82f6" },
};
 
export default function CalendarioPage() {
  const [fechaInicio, setFechaInicio] = useState(startOfWeek(new Date(), { locale: es }));
  const [partidos, setPartidos] = useState<PartidoCalendario[]>([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null);
 
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      await cargarPartidos(user.id);
    }
    init();
  }, []);
 
  async function cargarPartidos(uid: string) {
    setCargando(true);
    const { data, error } = await supabase
      .from("calendario_partidos")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: true });
 
    if (!error && data) {
      setPartidos(data.map((p: any) => ({
        id: p.id,
        partido_id: p.partido_id,
        fecha: p.fecha,
        hora: p.hora || "",
        equipos: p.equipos || "",
        estado: p.estado || "Pendiente",
        competicion: p.competicion || "",
        estadio: p.estadio || "",
        es_manual: p.es_manual ?? false,
      })));
    }
    setCargando(false);
  }
 
  async function añadirPartido(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!userId) return;
    const form = e.currentTarget;
    const fechaInput = (form.elements.namedItem("fecha") as HTMLInputElement).value;
    const horaInput = (form.elements.namedItem("hora") as HTMLInputElement).value;
    const equiposInput = (form.elements.namedItem("equipos") as HTMLInputElement).value;
    const estadoInput = (form.elements.namedItem("estado") as HTMLSelectElement).value;
    const nuevaFecha = new Date(fechaInput + "T12:00:00").toDateString();
 
    const { data, error } = await supabase.from("calendario_partidos").insert({
      user_id: userId,
      partido_id: null,
      fecha: nuevaFecha,
      hora: horaInput,
      equipos: equiposInput,
      estado: estadoInput,
      es_manual: true,
    }).select().single();
 
    if (!error && data) {
      setPartidos(prev => [...prev, {
        id: data.id, partido_id: null,
        fecha: nuevaFecha, hora: horaInput,
        equipos: equiposInput, estado: estadoInput, es_manual: true,
      }]);
    }
    setMostrarForm(false);
  }
 
  async function eliminarPartido(id: string) {
    const { error } = await supabase.from("calendario_partidos").delete().eq("id", id);
    if (!error) setPartidos(prev => prev.filter(p => p.id !== id));
  }
 
  async function cambiarEstado(id: string, estado: string) {
    const { error } = await supabase.from("calendario_partidos").update({ estado }).eq("id", id);
    if (!error) setPartidos(prev => prev.map(p => p.id === id ? { ...p, estado } : p));
  }
 
  const diasSemana = Array.from({ length: 7 }, (_, i) => addDays(fechaInicio, i));
  const hoy = new Date().toDateString();
 
  if (cargando) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 36, height: 36, border: "2px solid #3b82f6", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
          <p style={{ color: "#6b7280", fontSize: 13 }}>Cargando calendario...</p>
        </div>
      </div>
    );
  }
 
  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
 
        .cal-root { animation: fadeIn 0.4s ease; }
 
        .cal-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 28px; flex-wrap: wrap; gap: 16px;
        }
        .cal-title { font-size: 26px; font-weight: 800; color: white; letter-spacing: -0.03em; margin-bottom: 4px; }
        .cal-sub { color: #4b5563; font-size: 12px; letter-spacing: 0.05em; text-transform: uppercase; }
 
        .cal-nav { display: flex; align-items: center; gap: 8px; }
        .cal-nav-btn {
          width: 34px; height: 34px; border-radius: 10px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          color: white; font-size: 14px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.15s;
        }
        .cal-nav-btn:hover { background: rgba(255,255,255,0.08); }
        .cal-range { color: #9ca3af; font-size: 13px; font-weight: 500; padding: 0 4px; }
        .cal-today-btn {
          padding: 8px 16px; border-radius: 10px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          color: #9ca3af; font-size: 12px; font-weight: 600; cursor: pointer;
          transition: all 0.15s;
        }
        .cal-today-btn:hover { background: rgba(255,255,255,0.08); color: white; }
        .cal-add-btn {
          padding: 9px 20px; border-radius: 10px;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          border: none; color: white; font-size: 13px; font-weight: 600;
          cursor: pointer; box-shadow: 0 4px 16px rgba(59,130,246,0.3);
          transition: opacity 0.15s, transform 0.1s;
        }
        .cal-add-btn:hover { opacity: 0.9; transform: translateY(-1px); }
 
        .cal-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 10px;
        }
 
        .cal-col {
          background: rgba(17,24,39,0.6);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 16px;
          overflow: hidden;
          transition: border-color 0.2s;
          min-height: 500px;
          display: flex; flex-direction: column;
        }
        .cal-col:hover { border-color: rgba(255,255,255,0.1); }
        .cal-col.hoy { border-color: rgba(59,130,246,0.3); background: rgba(59,130,246,0.04); }
 
        .cal-col-header {
          padding: 14px 10px;
          text-align: center;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .cal-col-dia { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #4b5563; margin-bottom: 4px; }
        .cal-col-num { font-size: 22px; font-weight: 800; color: white; }
        .cal-col-hoy-badge { font-size: 9px; color: #3b82f6; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 2px; }
        .cal-col.hoy .cal-col-dia { color: #3b82f6; }
 
        .cal-col-body { flex: 1; padding: 8px; display: flex; flex-direction: column; gap: 8px; overflow-y: auto; }
 
        .cal-partido {
          background: rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 10px; padding: 10px;
          position: relative; cursor: default;
          transition: border-color 0.2s, transform 0.15s;
        }
        .cal-partido:hover { border-color: rgba(255,255,255,0.15); transform: translateY(-1px); }
 
        .cal-partido-hora { font-size: 10px; font-weight: 700; color: #3b82f6; margin-bottom: 4px; }
        .cal-partido-equipos { font-size: 11px; font-weight: 600; color: white; line-height: 1.3; margin-bottom: 8px; }
 
        .cal-estado-select {
          width: 100%; border: none; outline: none; border-radius: 6px;
          padding: 4px 8px; font-size: 10px; font-weight: 700;
          cursor: pointer; text-transform: uppercase; letter-spacing: 0.05em;
        }
 
        .cal-delete-btn {
          position: absolute; top: 6px; right: 6px;
          width: 18px; height: 18px; border-radius: 50%;
          background: rgba(239,68,68,0.1); border: none;
          color: #ef4444; font-size: 10px; cursor: pointer;
          display: none; align-items: center; justify-content: center;
          transition: background 0.15s;
        }
        .cal-partido:hover .cal-delete-btn { display: flex; }
        .cal-delete-btn:hover { background: rgba(239,68,68,0.2); }
 
        .cal-empty {
          flex: 1; display: flex; align-items: center; justify-content: center;
          opacity: 0.15;
        }
        .cal-empty-text { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: #6b7280; writing-mode: vertical-rl; }
 
        /* Modal */
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.7);
          backdrop-filter: blur(8px); z-index: 500;
          display: flex; align-items: center; justify-content: center; padding: 24px;
          animation: fadeIn 0.2s ease;
        }
        .modal-card {
          background: #111827; border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px; padding: 32px; width: 100%; max-width: 420px;
          box-shadow: 0 32px 80px rgba(0,0,0,0.5);
        }
        .modal-title { font-size: 20px; font-weight: 800; color: white; margin-bottom: 24px; letter-spacing: -0.02em; }
        .modal-input {
          width: 100%; background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08); border-radius: 10px;
          padding: 12px 14px; color: white; font-size: 13px; outline: none;
          transition: border-color 0.2s; margin-bottom: 12px;
        }
        .modal-input::placeholder { color: #4b5563; }
        .modal-input:focus { border-color: rgba(59,130,246,0.4); }
        .modal-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
        .modal-actions { display: flex; gap: 12px; margin-top: 24px; }
        .modal-cancel {
          flex: 1; padding: 12px; border-radius: 10px;
          background: transparent; border: 1px solid rgba(255,255,255,0.08);
          color: #6b7280; font-size: 13px; font-weight: 600; cursor: pointer;
          transition: all 0.15s;
        }
        .modal-cancel:hover { border-color: rgba(255,255,255,0.15); color: white; }
        .modal-save {
          flex: 1; padding: 12px; border-radius: 10px;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          border: none; color: white; font-size: 13px; font-weight: 600;
          cursor: pointer; box-shadow: 0 4px 16px rgba(59,130,246,0.3);
          transition: opacity 0.15s;
        }
        .modal-save:hover { opacity: 0.9; }
 
        @media (max-width: 900px) {
          .cal-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 500px) {
          .cal-grid { grid-template-columns: 1fr; }
        }
      `}</style>
 
      <div className={`cal-root ${dmSans.className}`}>
        {/* Header */}
        <div className="cal-header">
          <div>
            <h1 className={`cal-title ${syne.className}`}>Calendario</h1>
            <p className="cal-sub">{partidos.length} partido{partidos.length !== 1 ? "s" : ""} guardado{partidos.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="cal-nav">
            <button className="cal-nav-btn" onClick={() => setFechaInicio(subWeeks(fechaInicio, 1))}>←</button>
            <span className="cal-range">
              {format(fechaInicio, "d MMM", { locale: es })} — {format(addDays(fechaInicio, 6), "d MMM", { locale: es })}
            </span>
            <button className="cal-nav-btn" onClick={() => setFechaInicio(addWeeks(fechaInicio, 1))}>→</button>
            <button className="cal-today-btn" onClick={() => setFechaInicio(startOfWeek(new Date(), { locale: es }))}>Hoy</button>
            <button className="cal-add-btn" onClick={() => setMostrarForm(true)}>+ Añadir partido</button>
          </div>
        </div>
 
        {/* Grid semanal */}
        <div className="cal-grid">
          {diasSemana.map((dia, i) => {
            const esHoy = dia.toDateString() === hoy;
            const partidosDelDia = partidos.filter(p => p.fecha === dia.toDateString());
            return (
              <div key={i} className={`cal-col${esHoy ? " hoy" : ""}`}>
                <div className="cal-col-header">
                  <div className="cal-col-dia">{format(dia, "eee", { locale: es })}</div>
                  <div className="cal-col-num">{format(dia, "d")}</div>
                  {esHoy && <div className="cal-col-hoy-badge">● Hoy</div>}
                </div>
                <div className="cal-col-body">
                  {partidosDelDia.length === 0 ? (
                    <div className="cal-empty">
                      <span className="cal-empty-text">Sin partidos</span>
                    </div>
                  ) : (
                    partidosDelDia.map(p => {
                      const colores = ESTADO_COLORS[p.estado] || ESTADO_COLORS["Pendiente"];
                      return (
                        <div key={p.id} className="cal-partido">
                          <button className="cal-delete-btn" onClick={() => eliminarPartido(p.id)}>✕</button>
                          {p.hora && <div className="cal-partido-hora">{p.hora}</div>}
                          <div className="cal-partido-equipos">{p.equipos}</div>
                          <select
                            className="cal-estado-select"
                            value={p.estado}
                            onChange={e => cambiarEstado(p.id, e.target.value)}
                            style={{ background: colores.bg, color: colores.color }}
                          >
                            <option value="Pendiente">Pendiente</option>
                            <option value="Visto">Visto</option>
                            <option value="Diferido">Diferido</option>
                          </select>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
 
      {/* Modal */}
      {mostrarForm && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setMostrarForm(false); }}>
          <div className="modal-card">
            <h2 className={`modal-title ${syne.className}`}>Nuevo partido</h2>
            <form onSubmit={añadirPartido}>
              <input className="modal-input" name="equipos" placeholder="Equipos (ej: Real Madrid vs Barça)" required />
              <div className="modal-row">
                <input className="modal-input" name="fecha" type="date" required style={{ marginBottom: 0 }} />
                <input className="modal-input" name="hora" type="time" required style={{ marginBottom: 0 }} />
              </div>
              <select className="modal-input" name="estado">
                <option value="Pendiente">Pendiente</option>
                <option value="Visto">Visto</option>
                <option value="Diferido">Diferido</option>
              </select>
              <div className="modal-actions">
                <button type="button" className="modal-cancel" onClick={() => setMostrarForm(false)}>Cancelar</button>
                <button type="submit" className="modal-save">Guardar partido</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}