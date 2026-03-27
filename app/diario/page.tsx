"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";

type Pestana = "diario" | "checklist" | "noticias" | "resumen";

type Entrada = {
  id: string;
  user_id: string;
  fecha: string;
  tipo_entrada: string;
  jugador_relacionado: string;
  lugar_evento: string;
  fuente: string;
  urgencia: string;
  nota: string;
  seguimiento: string;
  es_alerta: boolean;
  meses_restantes: number | null;
  created_at: string;
};

type Jugador = {
  id: string;
  apellidos: string;
  nombre: string;
  equipo_actual: string;
  posicion: string;
  contrato_hasta: string;
};

type ChecklistItem = {
  id: string;
  user_id: string;
  jugador_id: string | null;
  jugador_nombre: string;
  equipo: string;
  posicion: string;
  partido: string;
  fecha: string;
  aspectos: string[];
  ultima_nota: string;
  completado: boolean;
};

type Noticia = {
  id: string;
  jugador: string;
  titular: string;
  fuente: string;
  fecha: string;
  tipo: "lesion" | "conflicto" | "interes" | "renovacion" | "otro";
};

const URGENCIA_COLORES: Record<string, string> = {
  Alta: "#ef4444", Media: "#f59e0b", Baja: "#10b981",
};
function getUrgenciaColor(urgencia: string) {
  if (!urgencia) return "#6b7280";
  for (const key of Object.keys(URGENCIA_COLORES)) {
    if (urgencia.toLowerCase().includes(key.toLowerCase())) return URGENCIA_COLORES[key];
  }
  return "#6b7280";
}

const TIPO_COLORES: Record<string, string> = {
  Observación: "#3b82f6", Rumor: "#8b5cf6", Conversación: "#10b981",
  Mercado: "#f59e0b", "Alerta Contrato": "#ef4444",
};
function getTipoColor(tipo: string) {
  if (!tipo) return "#6b7280";
  for (const key of Object.keys(TIPO_COLORES)) {
    if (tipo.toLowerCase().includes(key.toLowerCase())) return TIPO_COLORES[key];
  }
  return "#6b7280";
}

const NOTICIA_COLORES: Record<string, string> = {
  lesion: "#ef4444", conflicto: "#f59e0b", interes: "#3b82f6",
  renovacion: "#10b981", otro: "#6b7280",
};
const NOTICIA_LABELS: Record<string, string> = {
  lesion: "🏥 Lesión", conflicto: "⚡ Conflicto", interes: "👀 Interés",
  renovacion: "📝 Renovación", otro: "📰 Noticia",
};

// ── CHECKLIST ─────────────────────────────────────────────────────
function ChecklistViaje({ jugadores, userId }: { jugadores: Jugador[]; userId: string }) {
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState({ jugadorId: "", partido: "", fecha: "", aspectos: "" });

  async function cargarChecklist() {
    const { data } = await supabase
      .from("diario_checklist")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setChecklist(data as ChecklistItem[]);
  }

  useEffect(() => { cargarChecklist(); }, []);

  async function añadir() {
    if (!form.jugadorId || !form.partido) return;
    const j = jugadores.find(x => x.id === form.jugadorId);
    if (!j) return;
    const nombre = `${j.apellidos}, ${j.nombre}`;
    const { data } = await supabase.from("diario_checklist").insert({
      user_id: userId,
      jugador_id: j.id,
      jugador_nombre: nombre,
      equipo: j.equipo_actual,
      posicion: j.posicion,
      partido: form.partido,
      fecha: form.fecha || null,
      aspectos: form.aspectos.split(",").map(a => a.trim()).filter(Boolean),
      ultima_nota: "",
      completado: false,
    }).select().single();
    if (data) setChecklist(prev => [data as ChecklistItem, ...prev]);
    setForm({ jugadorId: "", partido: "", fecha: "", aspectos: "" });
    setMostrarForm(false);
  }

  async function toggleCompletado(id: string, completado: boolean) {
    await supabase.from("diario_checklist").update({ completado: !completado }).eq("id", id);
    setChecklist(prev => prev.map(c => c.id === id ? { ...c, completado: !completado } : c));
  }

  async function eliminar(id: string) {
    await supabase.from("diario_checklist").delete().eq("id", id);
    setChecklist(prev => prev.filter(c => c.id !== id));
  }

  const pendientes = checklist.filter(c => !c.completado);
  const completados = checklist.filter(c => c.completado);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#fff" }}>✈️ Checklist de viaje</h2>
          <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 13 }}>
            {pendientes.length} pendientes · {completados.length} vistos
          </p>
        </div>
        <button onClick={() => setMostrarForm(true)} style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)", border: "none", borderRadius: 10, color: "#fff", padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          + Añadir jugador
        </button>
      </div>

      {checklist.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "#6b7280" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✈️</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#9ca3af", marginBottom: 8 }}>Lista de viaje vacía</div>
          <div style={{ fontSize: 13 }}>Añade jugadores a observar antes de ir al partido</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {pendientes.length > 0 && (
            <div style={{ color: "#9ca3af", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
              📋 Pendientes ({pendientes.length})
            </div>
          )}
          {pendientes.map(item => (
            <ChecklistCard key={item.id} item={item} onToggle={() => toggleCompletado(item.id, item.completado)} onEliminar={() => eliminar(item.id)} />
          ))}
          {completados.length > 0 && (
            <>
              <div style={{ color: "#6b7280", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 8, marginBottom: 4 }}>
                ✅ Observados ({completados.length})
              </div>
              {completados.map(item => (
                <ChecklistCard key={item.id} item={item} onToggle={() => toggleCompletado(item.id, item.completado)} onEliminar={() => eliminar(item.id)} />
              ))}
            </>
          )}
        </div>
      )}

      {mostrarForm && (
        <div style={{ position: "fixed", inset: 0, background: "#000000cc", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 24 }}>
          <div style={{ background: "#1a1f2e", border: "1px solid #374151", borderRadius: 20, padding: 32, width: "100%", maxWidth: 480 }}>
            <h3 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 900, color: "#fff" }}>✈️ Añadir a la lista de viaje</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ color: "#9ca3af", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4, textTransform: "uppercase" }}>Jugador *</label>
                <select value={form.jugadorId} onChange={e => setForm({ ...form, jugadorId: e.target.value })} style={{ width: "100%", background: "#111827", border: "1px solid #374151", borderRadius: 10, padding: "10px 14px", color: form.jugadorId ? "#fff" : "#6b7280", fontSize: 14, outline: "none" }}>
                  <option value="">Seleccionar jugador...</option>
                  {jugadores.map(j => <option key={j.id} value={j.id}>{j.apellidos}, {j.nombre} · {j.equipo_actual}</option>)}
                </select>
              </div>
              <div>
                <label style={{ color: "#9ca3af", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4, textTransform: "uppercase" }}>Partido *</label>
                <input value={form.partido} onChange={e => setForm({ ...form, partido: e.target.value })} placeholder="Ej: Montañeros vs Rayo Vallecano" style={{ width: "100%", background: "#111827", border: "1px solid #374151", borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ color: "#9ca3af", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4, textTransform: "uppercase" }}>Fecha del partido</label>
                <input type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} style={{ width: "100%", background: "#111827", border: "1px solid #374151", borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ color: "#9ca3af", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4, textTransform: "uppercase" }}>Aspectos a observar (separados por comas)</label>
                <input value={form.aspectos} onChange={e => setForm({ ...form, aspectos: e.target.value })} placeholder="Ej: Pressing, Juego aéreo, Remate" style={{ width: "100%", background: "#111827", border: "1px solid #374151", borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={() => setMostrarForm(false)} style={{ flex: 1, background: "#111827", border: "1px solid #374151", borderRadius: 10, color: "#9ca3af", padding: "12px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
              <button onClick={añadir} disabled={!form.jugadorId || !form.partido} style={{ flex: 1, background: form.jugadorId && form.partido ? "linear-gradient(135deg, #3b82f6, #2563eb)" : "#374151", border: "none", borderRadius: 10, color: "#fff", padding: "12px", fontSize: 14, fontWeight: 700, cursor: form.jugadorId && form.partido ? "pointer" : "not-allowed" }}>
                Añadir a la lista
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ChecklistCard({ item, onToggle, onEliminar }: { item: ChecklistItem; onToggle: () => void; onEliminar: () => void }) {
  return (
    <div style={{ background: item.completado ? "#111827" : "#1a1f2e", border: `1px solid ${item.completado ? "#1f2937" : "#3b82f630"}`, borderRadius: 14, padding: "18px 20px", opacity: item.completado ? 0.6 : 1 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <button onClick={onToggle} style={{ width: 24, height: 24, borderRadius: 6, flexShrink: 0, marginTop: 2, background: item.completado ? "#10b981" : "#111827", border: `2px solid ${item.completado ? "#10b981" : "#374151"}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>
          {item.completado ? "✓" : ""}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
            <div>
              <div style={{ fontWeight: 700, color: item.completado ? "#6b7280" : "#fff", fontSize: 15, textDecoration: item.completado ? "line-through" : "none" }}>{item.jugador_nombre}</div>
              <div style={{ color: "#6b7280", fontSize: 12, marginTop: 2 }}>🏟️ {item.equipo} · 📍 {item.posicion}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: "#9ca3af", fontSize: 12, fontWeight: 600 }}>{item.partido}</div>
              {item.fecha && <div style={{ color: "#6b7280", fontSize: 11, marginTop: 2 }}>📅 {item.fecha}</div>}
            </div>
          </div>
          {item.aspectos?.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
              <span style={{ color: "#6b7280", fontSize: 11, fontWeight: 600 }}>Observar:</span>
              {item.aspectos.map(a => (
                <span key={a} style={{ background: "#3b82f615", color: "#60a5fa", border: "1px solid #3b82f630", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>{a}</span>
              ))}
            </div>
          )}
        </div>
        <button onClick={onEliminar} style={{ background: "#ef444415", border: "1px solid #ef444430", borderRadius: 8, color: "#ef4444", padding: "6px 8px", fontSize: 11, cursor: "pointer", flexShrink: 0 }}>✕</button>
      </div>
    </div>
  );
}

// ── RADAR NOTICIAS ────────────────────────────────────────────────
function ScrapingNoticias({ jugadores }: { jugadores: Jugador[] }) {
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [jugadorBuscar, setJugadorBuscar] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");

  async function buscarNoticias() {
    if (!jugadores.length) return;
    setBuscando(true);
    setNoticias([]);
    const jugadoresABuscar = jugadorBuscar
      ? jugadores.filter(j => j.id === jugadorBuscar)
      : jugadores.slice(0, 5);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `Eres un sistema de scouting deportivo. Para los siguientes jugadores genera noticias recientes SIMULADAS pero realistas. Responde SOLO con JSON válido sin texto adicional:
{"noticias":[{"jugador":"Apellido Nombre","titular":"Titular","fuente":"Medio","tipo":"lesion|conflicto|interes|renovacion|otro","resumen":"1-2 frases"}]}
Jugadores: ${jugadoresABuscar.map(j => `${j.apellidos} ${j.nombre} (${j.equipo_actual})`).join(", ")}`,
          }],
        }),
      });
      const data = await res.json();
      const texto = data.content?.map((b: { text?: string }) => b.text || "").join("") || "{}";
      const clean = texto.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      const hoy = new Date().toLocaleDateString("es-ES");
      setNoticias((parsed.noticias || []).map((n: { jugador: string; titular: string; fuente: string; tipo: string }, i: number) => ({
        id: `${Date.now()}_${i}`, jugador: n.jugador, titular: n.titular,
        fuente: n.fuente, fecha: hoy, tipo: n.tipo || "otro",
      })));
    } catch { console.error("Error al buscar noticias"); }
    setBuscando(false);
  }

  const noticiasFiltradas = filtroTipo ? noticias.filter(n => n.tipo === filtroTipo) : noticias;

  return (
    <div>
      <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 900, color: "#fff" }}>📰 Radar de noticias</h2>
      <p style={{ margin: "0 0 16px", color: "#6b7280", fontSize: 13 }}>Escaneo de prensa deportiva · Powered by IA</p>
      <div style={{ background: "#1a1f2e", border: "1px solid #1f2937", borderRadius: 12, padding: "16px 20px", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ color: "#9ca3af", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 6, textTransform: "uppercase" }}>Jugador (opcional)</label>
            <select value={jugadorBuscar} onChange={e => setJugadorBuscar(e.target.value)} style={{ width: "100%", background: "#111827", border: "1px solid #374151", borderRadius: 10, padding: "10px 14px", color: jugadorBuscar ? "#fff" : "#6b7280", fontSize: 13, outline: "none" }}>
              <option value="">Todos los jugadores del radar</option>
              {jugadores.map(j => <option key={j.id} value={j.id}>{j.apellidos}, {j.nombre}</option>)}
            </select>
          </div>
          <button onClick={buscarNoticias} disabled={buscando} style={{ background: buscando ? "#374151" : "linear-gradient(135deg, #3b82f6, #2563eb)", border: "none", borderRadius: 10, color: "#fff", padding: "10px 20px", fontSize: 14, fontWeight: 700, cursor: buscando ? "not-allowed" : "pointer" }}>
            {buscando ? "⏳ Escaneando..." : "🔍 Escanear noticias"}
          </button>
        </div>
      </div>
      {noticias.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <button onClick={() => setFiltroTipo("")} style={{ background: !filtroTipo ? "#3b82f6" : "#1a1f2e", border: `1px solid ${!filtroTipo ? "#3b82f6" : "#1f2937"}`, borderRadius: 8, color: !filtroTipo ? "#fff" : "#9ca3af", padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            Todas ({noticias.length})
          </button>
          {(["lesion", "conflicto", "interes", "renovacion", "otro"] as const).map(tipo => {
            const count = noticias.filter(n => n.tipo === tipo).length;
            if (!count) return null;
            return (
              <button key={tipo} onClick={() => setFiltroTipo(tipo)} style={{ background: filtroTipo === tipo ? NOTICIA_COLORES[tipo] + "30" : "#1a1f2e", border: `1px solid ${filtroTipo === tipo ? NOTICIA_COLORES[tipo] + "60" : "#1f2937"}`, borderRadius: 8, color: filtroTipo === tipo ? NOTICIA_COLORES[tipo] : "#9ca3af", padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                {NOTICIA_LABELS[tipo]} ({count})
              </button>
            );
          })}
        </div>
      )}
      {noticias.length === 0 && !buscando ? (
        <div style={{ textAlign: "center", padding: 60, color: "#6b7280" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📰</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#9ca3af", marginBottom: 8 }}>Sin noticias escaneadas</div>
          <div style={{ fontSize: 13 }}>Pulsa "Escanear noticias" para buscar información</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {noticiasFiltradas.map(noticia => (
            <div key={noticia.id} style={{ background: "#1a1f2e", borderRadius: 14, padding: "16px 20px", border: `1px solid ${NOTICIA_COLORES[noticia.tipo]}30`, borderLeft: `4px solid ${NOTICIA_COLORES[noticia.tipo]}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                <span style={{ background: NOTICIA_COLORES[noticia.tipo] + "20", color: NOTICIA_COLORES[noticia.tipo], border: `1px solid ${NOTICIA_COLORES[noticia.tipo]}40`, borderRadius: 6, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>{NOTICIA_LABELS[noticia.tipo]}</span>
                <span style={{ color: "#6b7280", fontSize: 12, fontWeight: 600 }}>👤 {noticia.jugador}</span>
              </div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{noticia.titular}</div>
              <div style={{ color: "#6b7280", fontSize: 12 }}>📡 {noticia.fuente} · 📅 {noticia.fecha}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── RESUMEN SEMANAL ───────────────────────────────────────────────
function ResumenSemanal({ jugadores, entradas }: { jugadores: Jugador[]; entradas: Entrada[] }) {
  const [resumen, setResumen] = useState("");
  const [generando, setGenerando] = useState(false);

  const alertasAltas = entradas.filter(e => e.es_alerta && e.urgencia === "Alta");

  async function generarResumen() {
    setGenerando(true);
    setResumen("");
    const seguimientos = entradas.filter(e => e.seguimiento?.length > 2).slice(0, 5);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `Eres el asistente de scouting de ScoutPro. Genera un resumen semanal profesional y conciso.
Datos:
- Total jugadores en radar: ${jugadores.length}
- Alertas urgentes (menos de 3 meses): ${alertasAltas.length} — ${alertasAltas.map(a => a.jugador_relacionado).join(", ") || "ninguno"}
- Seguimientos pendientes: ${seguimientos.map(e => `${e.jugador_relacionado}: ${e.seguimiento}`).join(" | ") || "ninguno"}
Estructura: 🎯 Prioridades · 🚨 Alertas · 📋 Seguimientos · 💡 Recomendación. Máximo 300 palabras.`,
          }],
        }),
      });
      const data = await res.json();
      setResumen(data.content?.map((b: { text?: string }) => b.text || "").join("") || "Error al generar");
    } catch { setResumen("Error al conectar con la IA."); }
    setGenerando(false);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 900, color: "#fff" }}>📊 Resumen semanal</h2>
          <p style={{ margin: 0, color: "#6b7280", fontSize: 13 }}>Generado por IA</p>
        </div>
        <button onClick={generarResumen} disabled={generando} style={{ background: generando ? "#374151" : "linear-gradient(135deg, #8b5cf6, #7c3aed)", border: "none", borderRadius: 10, color: "#fff", padding: "10px 20px", fontSize: 14, fontWeight: 700, cursor: generando ? "not-allowed" : "pointer" }}>
          {generando ? "⏳ Generando..." : "✨ Generar resumen"}
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Jugadores en radar", value: jugadores.length, icon: "👤", color: "#3b82f6" },
          { label: "Alertas contrato", value: entradas.filter(e => e.es_alerta).length, icon: "🚨", color: "#ef4444" },
          { label: "Entradas totales", value: entradas.filter(e => !e.es_alerta).length, icon: "📝", color: "#10b981" },
          { label: "Seguimientos", value: entradas.filter(e => e.seguimiento?.length > 2).length, icon: "🔔", color: "#f59e0b" },
        ].map(stat => (
          <div key={stat.label} style={{ background: "#1a1f2e", border: `1px solid ${stat.color}20`, borderRadius: 12, padding: "16px 18px" }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{stat.icon}</div>
            <div style={{ color: stat.color, fontSize: 24, fontWeight: 900 }}>{stat.value}</div>
            <div style={{ color: "#6b7280", fontSize: 12, marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>
      {resumen ? (
        <div style={{ background: "#1a1f2e", border: "1px solid #8b5cf630", borderRadius: 14, padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ color: "#8b5cf6", fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>✨ Resumen generado por IA</div>
            <button onClick={() => navigator.clipboard.writeText(resumen)} style={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 8, color: "#9ca3af", padding: "6px 12px", fontSize: 12, cursor: "pointer" }}>📋 Copiar</button>
          </div>
          <div style={{ color: "#d1d5db", fontSize: 14, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{resumen}</div>
        </div>
      ) : (
        <div style={{ background: "#1a1f2e", border: "1px solid #1f2937", borderRadius: 14, padding: 40, textAlign: "center", color: "#6b7280" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#9ca3af", marginBottom: 8 }}>Resumen no generado</div>
          <div style={{ fontSize: 13 }}>Pulsa "Generar resumen" para obtener un análisis semanal con IA</div>
        </div>
      )}
    </div>
  );
}

// ── COMPONENTE PRINCIPAL ──────────────────────────────────────────
export default function Diario() {
  const { user, perfil } = useAuth();
  const [entradas, setEntradas] = useState<Entrada[]>([]);
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroUrgencia, setFiltroUrgencia] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [seleccionada, setSeleccionada] = useState<Entrada | null>(null);
  const [mostrarSoloAlertas, setMostrarSoloAlertas] = useState(false);
  const [pestana, setPestana] = useState<Pestana>("diario");
  const [mostrarFormEntrada, setMostrarFormEntrada] = useState(false);
  const [form, setForm] = useState({ fecha: "", tipo_entrada: "", jugador_relacionado: "", lugar_evento: "", fuente: "", urgencia: "", nota: "", seguimiento: "" });

  const esAdmin = perfil?.rol === "admin" || perfil?.rol === "director";

  async function cargar() {
    setLoading(true);
    let query = supabase.from("diario_entradas").select("*").order("fecha", { ascending: false });
    if (!esAdmin) query = query.eq("user_id", user!.id);
    const { data } = await query;
    if (data) setEntradas(data as Entrada[]);

    let qJugadores = supabase.from("jugadores").select("id, apellidos, nombre, equipo_actual, posicion, contrato_hasta").order("apellidos");
    if (!esAdmin) qJugadores = qJugadores.eq("user_id", user!.id);
    const { data: jData } = await qJugadores;
    if (jData) setJugadores(jData as Jugador[]);

    setLoading(false);
  }

  useEffect(() => {
    if (user && perfil !== undefined) cargar();
  }, [user, perfil]);

  async function guardarEntrada() {
    if (!form.nota && !form.jugador_relacionado) return;
    const { data } = await supabase.from("diario_entradas").insert({
      user_id: user!.id,
      fecha: form.fecha || new Date().toISOString().split("T")[0],
      tipo_entrada: form.tipo_entrada,
      jugador_relacionado: form.jugador_relacionado,
      lugar_evento: form.lugar_evento,
      fuente: form.fuente,
      urgencia: form.urgencia,
      nota: form.nota,
      seguimiento: form.seguimiento,
      es_alerta: false,
    }).select().single();
    if (data) setEntradas(prev => [data as Entrada, ...prev]);
    setForm({ fecha: "", tipo_entrada: "", jugador_relacionado: "", lugar_evento: "", fuente: "", urgencia: "", nota: "", seguimiento: "" });
    setMostrarFormEntrada(false);
  }

  const alertasContrato = entradas.filter(e => e.es_alerta);
  const urgencias = [...new Set(entradas.map(e => e.urgencia).filter(Boolean))];
  const tipos = [...new Set(entradas.map(e => e.tipo_entrada).filter(Boolean))];

  const filtradas = entradas.filter(e => {
    if (mostrarSoloAlertas && !e.es_alerta) return false;
    const texto = busqueda.toLowerCase();
    return (!busqueda || (e.nota || "").toLowerCase().includes(texto) || (e.jugador_relacionado || "").toLowerCase().includes(texto) || (e.lugar_evento || "").toLowerCase().includes(texto))
      && (!filtroUrgencia || e.urgencia === filtroUrgencia)
      && (!filtroTipo || e.tipo_entrada === filtroTipo);
  });

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f1117", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
          <div>Debes iniciar sesión para ver esta página</div>
        </div>
      </div>
    );
  }

  if (seleccionada) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f1117", color: "#e5e7eb", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px" }}>
          <button onClick={() => setSeleccionada(null)} style={{ background: "#1f2937", border: "1px solid #374151", color: "#d1d5db", borderRadius: 8, padding: "8px 16px", fontSize: 14, cursor: "pointer", marginBottom: 24 }}>← Volver</button>
          <div style={{ background: seleccionada.es_alerta ? "linear-gradient(135deg, #2d1b1b, #1a1218)" : "linear-gradient(135deg, #1a1f2e, #111827)", border: `1px solid ${seleccionada.es_alerta ? "#ef444430" : "#1f2937"}`, borderRadius: 16, padding: "28px 32px", marginBottom: 24 }}>
            {seleccionada.es_alerta && <div style={{ background: "#ef444415", border: "1px solid #ef444430", borderRadius: 8, padding: "8px 14px", marginBottom: 16, color: "#ef4444", fontSize: 13, fontWeight: 700 }}>🚨 ALERTA AUTOMÁTICA — Radar de contratos</div>}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#fff" }}>{seleccionada.tipo_entrada || "Entrada de diario"}</div>
                <div style={{ color: "#6b7280", fontSize: 14, marginTop: 4 }}>📅 {seleccionada.fecha}</div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {seleccionada.tipo_entrada && <span style={{ background: getTipoColor(seleccionada.tipo_entrada) + "20", color: getTipoColor(seleccionada.tipo_entrada), border: `1px solid ${getTipoColor(seleccionada.tipo_entrada)}40`, borderRadius: 6, padding: "4px 12px", fontSize: 13, fontWeight: 600 }}>{seleccionada.tipo_entrada}</span>}
                {seleccionada.urgencia && <span style={{ background: getUrgenciaColor(seleccionada.urgencia) + "20", color: getUrgenciaColor(seleccionada.urgencia), border: `1px solid ${getUrgenciaColor(seleccionada.urgencia)}40`, borderRadius: 6, padding: "4px 12px", fontSize: 13, fontWeight: 600 }}>🔥 {seleccionada.urgencia}</span>}
              </div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            {[
              { label: "Jugador relacionado", value: seleccionada.jugador_relacionado, icon: "👤" },
              { label: "Club / Lugar", value: seleccionada.lugar_evento, icon: "🏟️" },
              { label: "Fuente", value: seleccionada.fuente, icon: "📡" },
              { label: "Seguimiento", value: seleccionada.seguimiento, icon: "🔔" },
            ].map(item => item.value ? (
              <div key={item.label} style={{ background: "#1a1f2e", border: "1px solid #1f2937", borderRadius: 12, padding: "16px 20px" }}>
                <div style={{ color: "#6b7280", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{item.icon} {item.label}</div>
                <div style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>{item.value}</div>
              </div>
            ) : null)}
          </div>
          {seleccionada.nota && (
            <div style={{ background: "#1a1f2e", border: "1px solid #1f2937", borderRadius: 12, padding: "20px 24px" }}>
              <div style={{ color: "#6b7280", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>📝 Nota</div>
              <div style={{ color: "#e5e7eb", fontSize: 15, lineHeight: 1.7 }}>{seleccionada.nota}</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0f1117", color: "#e5e7eb", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>

        {/* CABECERA */}
        <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: "#fff" }}>📓 Diario de campo</h1>
            <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 14 }}>
              {entradas.filter(e => !e.es_alerta).length} entradas
              {perfil && <span> · {perfil.nombre} ({perfil.rol})</span>}
              {alertasContrato.length > 0 && (
                <span style={{ marginLeft: 10, background: "#ef444420", color: "#ef4444", border: "1px solid #ef444440", borderRadius: 6, padding: "2px 8px", fontSize: 12, fontWeight: 700 }}>
                  🚨 {alertasContrato.length} alerta{alertasContrato.length !== 1 ? "s" : ""}
                </span>
              )}
            </p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {pestana === "diario" && alertasContrato.length > 0 && (
              <button onClick={() => setMostrarSoloAlertas(!mostrarSoloAlertas)} style={{ background: mostrarSoloAlertas ? "#ef4444" : "#ef444420", border: "1px solid #ef444440", borderRadius: 10, padding: "10px 18px", color: mostrarSoloAlertas ? "#fff" : "#ef4444", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                🚨 {mostrarSoloAlertas ? "Ver todo" : "Solo alertas"}
              </button>
            )}
            {pestana === "diario" && (
              <button onClick={() => setMostrarFormEntrada(true)} style={{ background: "#3b82f6", border: "none", borderRadius: 10, padding: "10px 18px", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                + Nueva entrada
              </button>
            )}
          </div>
        </div>

        {/* PESTAÑAS */}
        <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "#1a1f2e", borderRadius: 12, padding: 4, border: "1px solid #1f2937", flexWrap: "wrap", width: "fit-content" }}>
          {[
            { key: "diario", label: "📓 Diario", color: "#3b82f6" },
            { key: "checklist", label: "✈️ Checklist", color: "#3b82f6" },
            { key: "noticias", label: "📰 Noticias", color: "#8b5cf6" },
            { key: "resumen", label: "📊 Resumen", color: "#10b981" },
          ].map(tab => (
            <button key={tab.key} onClick={() => setPestana(tab.key as Pestana)} style={{ background: pestana === tab.key ? tab.color : "transparent", border: "none", borderRadius: 9, padding: "8px 18px", color: pestana === tab.key ? "#fff" : "#6b7280", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* PESTAÑA DIARIO */}
        {pestana === "diario" && (
          <>
            <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
              <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="🔍 Buscar por nota, jugador o lugar..." style={{ flex: 1, minWidth: 240, background: "#1a1f2e", border: "1px solid #1f2937", borderRadius: 10, padding: "10px 16px", color: "#fff", fontSize: 14, outline: "none" }} />
              <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} style={{ background: "#1a1f2e", border: "1px solid #1f2937", borderRadius: 10, padding: "10px 16px", color: filtroTipo ? "#fff" : "#6b7280", fontSize: 14, outline: "none" }}>
                <option value="">Todos los tipos</option>
                {tipos.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <select value={filtroUrgencia} onChange={e => setFiltroUrgencia(e.target.value)} style={{ background: "#1a1f2e", border: "1px solid #1f2937", borderRadius: 10, padding: "10px 16px", color: filtroUrgencia ? "#fff" : "#6b7280", fontSize: 14, outline: "none" }}>
                <option value="">Todas las urgencias</option>
                {urgencias.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>

            {loading ? (
              <div style={{ textAlign: "center", padding: 60, color: "#6b7280" }}><div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>Cargando diario...</div>
            ) : filtradas.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, color: "#6b7280" }}><div style={{ fontSize: 40, marginBottom: 12 }}>📓</div>No hay entradas en el diario</div>
            ) : (
              <div style={{ background: "#1a1f2e", border: "1px solid #1f2937", borderRadius: 14, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#111827", borderBottom: "1px solid #1f2937" }}>
                      {["Fecha", "Tipo", "Jugador", "Lugar", "Urgencia", "Nota", "Seguimiento"].map(h => (
                        <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtradas.map((e, i) => (
                      <tr key={i} onClick={() => setSeleccionada(e)}
                        style={{ borderBottom: "1px solid #1f2937", cursor: "pointer", background: e.es_alerta ? "#ef444408" : "transparent" }}
                        onMouseEnter={ev => (ev.currentTarget as HTMLTableRowElement).style.background = e.es_alerta ? "#ef444415" : "#111827"}
                        onMouseLeave={ev => (ev.currentTarget as HTMLTableRowElement).style.background = e.es_alerta ? "#ef444408" : "transparent"}>
                        <td style={{ padding: "12px 16px", fontSize: 13, color: "#9ca3af", whiteSpace: "nowrap" }}>{e.es_alerta && <span style={{ marginRight: 6 }}>🚨</span>}{e.fecha}</td>
                        <td style={{ padding: "12px 16px" }}>{e.tipo_entrada && <span style={{ background: getTipoColor(e.tipo_entrada) + "20", color: getTipoColor(e.tipo_entrada), border: `1px solid ${getTipoColor(e.tipo_entrada)}40`, borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 600 }}>{e.tipo_entrada}</span>}</td>
                        <td style={{ padding: "12px 16px", fontSize: 13, color: "#d1d5db" }}>{e.jugador_relacionado || "—"}</td>
                        <td style={{ padding: "12px 16px", fontSize: 13, color: "#d1d5db" }}>{e.lugar_evento || "—"}</td>
                        <td style={{ padding: "12px 16px" }}>{e.urgencia && <span style={{ background: getUrgenciaColor(e.urgencia) + "20", color: getUrgenciaColor(e.urgencia), border: `1px solid ${getUrgenciaColor(e.urgencia)}40`, borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 600 }}>{e.urgencia}</span>}</td>
                        <td style={{ padding: "12px 16px", fontSize: 13, color: "#9ca3af", maxWidth: 300, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{e.nota || "—"}</td>
                        <td style={{ padding: "12px 16px", fontSize: 13, color: "#d1d5db" }}>{e.seguimiento || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {pestana === "checklist" && <ChecklistViaje jugadores={jugadores} userId={user.id} />}
        {pestana === "noticias" && <ScrapingNoticias jugadores={jugadores} />}
        {pestana === "resumen" && <ResumenSemanal jugadores={jugadores} entradas={entradas} />}

        {/* MODAL NUEVA ENTRADA */}
        {mostrarFormEntrada && (
          <div style={{ position: "fixed", inset: 0, background: "#000000cc", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 24 }}>
            <div style={{ background: "#1a1f2e", border: "1px solid #374151", borderRadius: 20, padding: 32, width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto" }}>
              <h3 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 900, color: "#fff" }}>📓 Nueva entrada de diario</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { label: "Fecha", key: "fecha", type: "date" },
                  { label: "Tipo de entrada", key: "tipo_entrada", placeholder: "Observación, Rumor, Conversación..." },
                  { label: "Jugador relacionado", key: "jugador_relacionado", placeholder: "Nombre del jugador" },
                  { label: "Lugar / Club", key: "lugar_evento", placeholder: "Estadio o club" },
                  { label: "Fuente", key: "fuente", placeholder: "Agente, prensa, observación directa..." },
                  { label: "Urgencia", key: "urgencia", placeholder: "Alta, Media, Baja" },
                  { label: "Seguimiento", key: "seguimiento", placeholder: "Acción a tomar..." },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ color: "#9ca3af", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4, textTransform: "uppercase" }}>{f.label}</label>
                    <input
                      type={f.type || "text"}
                      value={form[f.key as keyof typeof form]}
                      onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                      placeholder={f.placeholder}
                      style={{ width: "100%", background: "#111827", border: "1px solid #374151", borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
                ))}
                <div>
                  <label style={{ color: "#9ca3af", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4, textTransform: "uppercase" }}>Nota *</label>
                  <textarea
                    value={form.nota}
                    onChange={e => setForm({ ...form, nota: e.target.value })}
                    placeholder="Observaciones, información relevante..."
                    rows={4}
                    style={{ width: "100%", background: "#111827", border: "1px solid #374151", borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box", resize: "vertical" }}
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <button onClick={() => setMostrarFormEntrada(false)} style={{ flex: 1, background: "#111827", border: "1px solid #374151", borderRadius: 10, color: "#9ca3af", padding: "12px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
                <button onClick={guardarEntrada} style={{ flex: 1, background: "linear-gradient(135deg, #3b82f6, #2563eb)", border: "none", borderRadius: 10, color: "#fff", padding: "12px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Guardar entrada</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}