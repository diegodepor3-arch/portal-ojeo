"use client";
import { useEffect, useState } from "react";
import Papa from "papaparse";
 
const SHEET_ID = "1Hh982i-Mx_ytjeAONBkJtWLu7N3AaEHGZRyqBw0DS5A";
const CSV_DIARIO = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=44769068`;
const CSV_JUGADORES = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Jugadores`;
 
type Rol = "admin" | "scout" | "director" | "ojeador";
type Pestana = "diario" | "checklist" | "noticias" | "resumen";
 
type Entrada = {
  fecha: string;
  scout: string;
  tipoEntrada: string;
  jugadorRelacionado: string;
  lugarEvento: string;
  fuente: string;
  urgencia: string;
  nota: string;
  seguimiento: string;
  esAlerta?: boolean;
  mesesRestantes?: number;
};
 
type Jugador = {
  id: string;
  apellidos: string;
  nombre: string;
  equipoActual: string;
  posicion: string;
  contratoHasta: string;
  scout: string;
};
 
type ChecklistItem = {
  id: string;
  jugadorId: string;
  jugadorNombre: string;
  equipo: string;
  posicion: string;
  partido: string;
  fecha: string;
  aspectos: string[];
  ultimaNota: string;
  completado: boolean;
};
 
type Noticia = {
  id: string;
  jugador: string;
  titular: string;
  fuente: string;
  fecha: string;
  tipo: "lesion" | "conflicto" | "interes" | "renovacion" | "otro";
  url: string;
};
 
// ── localStorage helpers ──────────────────────────────────────────
function getChecklist(): ChecklistItem[] {
  try { return JSON.parse(localStorage.getItem("checklist_viaje") || "[]"); } catch { return []; }
}
function saveChecklist(lista: ChecklistItem[]) {
  try { localStorage.setItem("checklist_viaje", JSON.stringify(lista)); } catch {}
}
 
// ── Colores ───────────────────────────────────────────────────────
const URGENCIA_COLORES: Record<string, string> = {
  "Alta": "#ef4444", "Media": "#f59e0b", "Baja": "#10b981",
};
function getUrgenciaColor(urgencia: string) {
  if (!urgencia) return "#6b7280";
  for (const key of Object.keys(URGENCIA_COLORES)) {
    if (urgencia.toLowerCase().includes(key.toLowerCase())) return URGENCIA_COLORES[key];
  }
  return "#6b7280";
}
 
const TIPO_COLORES: Record<string, string> = {
  "Observación": "#3b82f6", "Rumor": "#8b5cf6", "Conversación": "#10b981",
  "Mercado": "#f59e0b", "Alerta Contrato": "#ef4444",
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
 
// ── Parsers ───────────────────────────────────────────────────────
function tieneFecha(val: string): boolean {
  return /\d{4}-\d{2}-\d{2}/.test(val) || /\d{1,2}\/\d{1,2}\/\d{4}/.test(val);
}
 
function parseEntradas(filas: string[][]): Entrada[] {
  const result: Entrada[] = [];
  for (let i = 0; i < filas.length; i++) {
    const vals = filas[i];
    if (!vals || vals.every(v => !v || v.trim() === "")) continue;
    const get = (idx: number) => vals[idx]?.trim() || "";
    const fecha = get(1);
    if (!tieneFecha(fecha)) continue;
    const scout = get(2), tipoEntrada = get(3), jugadorRelacionado = get(4), nota = get(8);
    if (!scout && !tipoEntrada && !jugadorRelacionado && !nota) continue;
    result.push({ fecha, scout, tipoEntrada, jugadorRelacionado, lugarEvento: get(5), fuente: get(6), urgencia: get(7), nota, seguimiento: get(9) });
  }
  return result;
}
 
function parseJugadores(filas: string[][]): Jugador[] {
  const result: Jugador[] = [];
  let dataStart = 0;
  for (let i = 0; i < filas.length; i++) {
    const fila = filas[i].join(" ").toLowerCase();
    if (fila.includes("apellidos") || fila.includes("id")) { dataStart = i + 1; break; }
  }
  for (let i = dataStart; i < filas.length; i++) {
    const vals = filas[i];
    if (!vals || vals.every(v => !v || v.trim() === "")) continue;
    const get = (idx: number) => vals[idx]?.trim() || "";
    const j = { id: get(1), apellidos: get(2), nombre: get(3), posicion: get(4), equipoActual: get(6), contratoHasta: get(14), scout: get(22) };
    if (j.apellidos || j.nombre) result.push(j);
  }
  return result;
}
 
function parseFechaContrato(str: string): Date | null {
  if (!str) return null;
  const m1 = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m1) return new Date(+m1[3], +m1[2] - 1, +m1[1]);
  const m2 = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m2) return new Date(+m2[1], +m2[2] - 1, +m2[3]);
  const m3 = str.match(/^(\d{2})\/(\d{4})$/);
  if (m3) return new Date(+m3[2], +m3[1] - 1, 1);
  const m4 = str.match(/^(\d{4})$/);
  if (m4) return new Date(+m4[1], 5, 30);
  return null;
}
 
function mesesHastaFin(fecha: Date): number {
  const hoy = new Date();
  return (fecha.getFullYear() - hoy.getFullYear()) * 12 + (fecha.getMonth() - hoy.getMonth());
}
 
function generarAlertasContrato(jugadores: Jugador[]): Entrada[] {
  const alertas: Entrada[] = [];
  const hoy = new Date();
  const fechaHoy = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
  for (const j of jugadores) {
    if (!j.contratoHasta) continue;
    const fechaFin = parseFechaContrato(j.contratoHasta);
    if (!fechaFin) continue;
    const meses = mesesHastaFin(fechaFin);
    if (meses < 0 || meses > 12) continue;
    const urgencia = meses <= 3 ? "Alta" : meses <= 6 ? "Media" : "Baja";
    const nombre = `${j.apellidos}${j.nombre ? ", " + j.nombre : ""}`;
    alertas.push({
      fecha: fechaHoy, scout: j.scout || "Sistema", tipoEntrada: "Alerta Contrato",
      jugadorRelacionado: nombre, lugarEvento: j.equipoActual || "—", fuente: "Radar automático", urgencia,
      nota: `⚠️ Contrato expira en ${meses <= 0 ? "menos de 1 mes" : meses + " mes" + (meses !== 1 ? "es" : "")} (${j.contratoHasta}). ${meses <= 6 ? "Momento óptimo para negociar sin coste de traspaso." : "Monitorizar evolución del contrato."}`,
      seguimiento: meses <= 6 ? "Contactar agente / club" : "Revisar en 3 meses",
      esAlerta: true, mesesRestantes: meses,
    });
  }
  return alertas.sort((a, b) => (a.mesesRestantes ?? 12) - (b.mesesRestantes ?? 12));
}
 
// ── CHECKLIST DE VIAJE ────────────────────────────────────────────
function ChecklistViaje({ jugadores, entradas }: { jugadores: Jugador[]; entradas: Entrada[] }) {
  const [checklist, setChecklist] = useState<ChecklistItem[]>(getChecklist());
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState({ jugadorId: "", partido: "", fecha: "", aspectos: "" });
 
  function getUltimaNotaJugador(jugadorNombre: string): string {
    const nota = entradas.find(e => e.jugadorRelacionado?.toLowerCase().includes(jugadorNombre.toLowerCase().split(",")[0]));
    return nota?.nota || "Sin notas previas";
  }
 
  function añadir() {
    if (!form.jugadorId || !form.partido) return;
    const j = jugadores.find(x => x.id === form.jugadorId);
    if (!j) return;
    const nombre = `${j.apellidos}, ${j.nombre}`;
    const nueva: ChecklistItem = {
      id: Date.now().toString(),
      jugadorId: j.id,
      jugadorNombre: nombre,
      equipo: j.equipoActual,
      posicion: j.posicion,
      partido: form.partido,
      fecha: form.fecha,
      aspectos: form.aspectos.split(",").map(a => a.trim()).filter(Boolean),
      ultimaNota: getUltimaNotaJugador(nombre),
      completado: false,
    };
    const nuevos = [...checklist, nueva];
    setChecklist(nuevos); saveChecklist(nuevos);
    setForm({ jugadorId: "", partido: "", fecha: "", aspectos: "" });
    setMostrarForm(false);
  }
 
  function toggleCompletado(id: string) {
    const nuevos = checklist.map(c => c.id === id ? { ...c, completado: !c.completado } : c);
    setChecklist(nuevos); saveChecklist(nuevos);
  }
 
  function eliminar(id: string) {
    const nuevos = checklist.filter(c => c.id !== id);
    setChecklist(nuevos); saveChecklist(nuevos);
  }
 
  const pendientes = checklist.filter(c => !c.completado);
  const completados = checklist.filter(c => c.completado);
 
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#fff" }}>✈️ Checklist de viaje</h2>
          <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 13 }}>
            Jugadores a observar · {pendientes.length} pendientes · {completados.length} vistos
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
            <ChecklistCard key={item.id} item={item} onToggle={toggleCompletado} onEliminar={eliminar} />
          ))}
 
          {completados.length > 0 && (
            <>
              <div style={{ color: "#6b7280", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 8, marginBottom: 4 }}>
                ✅ Observados ({completados.length})
              </div>
              {completados.map(item => (
                <ChecklistCard key={item.id} item={item} onToggle={toggleCompletado} onEliminar={eliminar} />
              ))}
            </>
          )}
        </div>
      )}
 
      {/* Modal añadir */}
      {mostrarForm && (
        <div style={{ position: "fixed", inset: 0, background: "#000000cc", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 24 }}>
          <div style={{ background: "#1a1f2e", border: "1px solid #374151", borderRadius: 20, padding: 32, width: "100%", maxWidth: 480, boxShadow: "0 24px 64px #00000080" }}>
            <h3 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 900, color: "#fff" }}>✈️ Añadir a la lista de viaje</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ color: "#9ca3af", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4, textTransform: "uppercase" }}>Jugador *</label>
                <select value={form.jugadorId} onChange={e => setForm({ ...form, jugadorId: e.target.value })} style={{ width: "100%", background: "#111827", border: "1px solid #374151", borderRadius: 10, padding: "10px 14px", color: form.jugadorId ? "#fff" : "#6b7280", fontSize: 14, outline: "none" }}>
                  <option value="">Seleccionar jugador...</option>
                  {jugadores.map(j => <option key={j.id} value={j.id}>{j.apellidos}, {j.nombre} · {j.equipoActual}</option>)}
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
 
function ChecklistCard({ item, onToggle, onEliminar }: { item: ChecklistItem; onToggle: (id: string) => void; onEliminar: (id: string) => void }) {
  return (
    <div style={{
      background: item.completado ? "#111827" : "#1a1f2e",
      border: `1px solid ${item.completado ? "#1f2937" : "#3b82f630"}`,
      borderRadius: 14, padding: "18px 20px",
      opacity: item.completado ? 0.6 : 1,
      transition: "all 0.2s",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <button onClick={() => onToggle(item.id)} style={{
          width: 24, height: 24, borderRadius: 6, flexShrink: 0, marginTop: 2,
          background: item.completado ? "#10b981" : "#111827",
          border: `2px solid ${item.completado ? "#10b981" : "#374151"}`,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
        }}>{item.completado ? "✓" : ""}</button>
 
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
            <div>
              <div style={{ fontWeight: 700, color: item.completado ? "#6b7280" : "#fff", fontSize: 15, textDecoration: item.completado ? "line-through" : "none" }}>
                {item.jugadorNombre}
              </div>
              <div style={{ color: "#6b7280", fontSize: 12, marginTop: 2 }}>
                🏟️ {item.equipo} · 📍 {item.posicion}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: "#9ca3af", fontSize: 12, fontWeight: 600 }}>{item.partido}</div>
              {item.fecha && <div style={{ color: "#6b7280", fontSize: 11, marginTop: 2 }}>📅 {item.fecha}</div>}
            </div>
          </div>
 
          {item.aspectos.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
              <span style={{ color: "#6b7280", fontSize: 11, fontWeight: 600 }}>Observar:</span>
              {item.aspectos.map(a => (
                <span key={a} style={{ background: "#3b82f615", color: "#60a5fa", border: "1px solid #3b82f630", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>{a}</span>
              ))}
            </div>
          )}
 
          {item.ultimaNota && item.ultimaNota !== "Sin notas previas" && (
            <div style={{ background: "#111827", borderRadius: 8, padding: "10px 12px", marginTop: 10, border: "1px solid #1f2937" }}>
              <div style={{ color: "#6b7280", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>📝 Última nota</div>
              <div style={{ color: "#9ca3af", fontSize: 12, lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>
                {item.ultimaNota}
              </div>
            </div>
          )}
        </div>
 
        <button onClick={() => onEliminar(item.id)} style={{ background: "#ef444415", border: "1px solid #ef444430", borderRadius: 8, color: "#ef4444", padding: "6px 8px", fontSize: 11, cursor: "pointer", flexShrink: 0 }}>✕</button>
      </div>
    </div>
  );
}
 
// ── SCRAPING NOTICIAS ─────────────────────────────────────────────
function ScrapingNoticias({ jugadores }: { jugadores: Jugador[] }) {
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [jugadorBuscar, setJugadorBuscar] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<string>("");
 
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
            content: `Eres un sistema de scouting deportivo. Para los siguientes jugadores de fútbol, genera noticias recientes SIMULADAS pero realistas sobre ellos. Cada noticia debe ser relevante para un scout (lesiones, conflictos con el club, interés de otros equipos, renovaciones). 
 
Jugadores: ${jugadoresABuscar.map(j => `${j.apellidos} ${j.nombre} (${j.equipoActual})`).join(", ")}
 
Responde SOLO con JSON válido, sin texto adicional, sin bloques de código:
{
  "noticias": [
    {
      "jugador": "Apellido Nombre",
      "titular": "Titular de la noticia",
      "fuente": "Nombre del medio",
      "tipo": "lesion|conflicto|interes|renovacion|otro",
      "resumen": "Breve resumen de 1-2 frases"
    }
  ]
}
 
Genera 1-2 noticias por jugador. Sé realista con los tipos de noticias.`,
          }],
        }),
      });
 
      const data = await res.json();
      const texto = data.content?.map((b: { text?: string }) => b.text || "").join("") || "{}";
 
      let parsed: { noticias: { jugador: string; titular: string; fuente: string; tipo: string; resumen: string }[] };
      try {
        const clean = texto.replace(/```json|```/g, "").trim();
        parsed = JSON.parse(clean);
      } catch {
        setBuscando(false);
        return;
      }
 
      const hoy = new Date().toLocaleDateString("es-ES");
      const nuevas: Noticia[] = (parsed.noticias || []).map((n, i) => ({
        id: `${Date.now()}_${i}`,
        jugador: n.jugador,
        titular: n.titular,
        fuente: n.fuente,
        fecha: hoy,
        tipo: (n.tipo as Noticia["tipo"]) || "otro",
        url: "#",
      }));
      setNoticias(nuevas);
    } catch {
      console.error("Error al buscar noticias");
    }
    setBuscando(false);
  }
 
  const noticiasFiltradas = filtroTipo ? noticias.filter(n => n.tipo === filtroTipo) : noticias;
 
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 900, color: "#fff" }}>📰 Radar de noticias</h2>
        <p style={{ margin: "0 0 16px", color: "#6b7280", fontSize: 13 }}>
          Escaneo de prensa deportiva sobre jugadores en tu radar · Powered by IA
        </p>
 
        <div style={{ background: "#1a1f2e", border: "1px solid #1f2937", borderRadius: 12, padding: "16px 20px", marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={{ color: "#9ca3af", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 6, textTransform: "uppercase" }}>Jugador (opcional)</label>
              <select value={jugadorBuscar} onChange={e => setJugadorBuscar(e.target.value)} style={{ width: "100%", background: "#111827", border: "1px solid #374151", borderRadius: 10, padding: "10px 14px", color: jugadorBuscar ? "#fff" : "#6b7280", fontSize: 13, outline: "none" }}>
                <option value="">Todos los jugadores del radar</option>
                {jugadores.map(j => <option key={j.id} value={j.id}>{j.apellidos}, {j.nombre}</option>)}
              </select>
            </div>
            <button onClick={buscarNoticias} disabled={buscando} style={{
              background: buscando ? "#374151" : "linear-gradient(135deg, #3b82f6, #2563eb)",
              border: "none", borderRadius: 10, color: "#fff", padding: "10px 20px", fontSize: 14, fontWeight: 700,
              cursor: buscando ? "not-allowed" : "pointer", whiteSpace: "nowrap",
            }}>
              {buscando ? "⏳ Escaneando..." : "🔍 Escanear noticias"}
            </button>
          </div>
          <p style={{ color: "#4b5563", fontSize: 11, marginTop: 8, marginBottom: 0 }}>
            ⚠️ Las noticias son generadas por IA como simulación. En producción se conectaría a APIs de prensa real.
          </p>
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
                <button key={tipo} onClick={() => setFiltroTipo(tipo)} style={{
                  background: filtroTipo === tipo ? NOTICIA_COLORES[tipo] + "30" : "#1a1f2e",
                  border: `1px solid ${filtroTipo === tipo ? NOTICIA_COLORES[tipo] + "60" : "#1f2937"}`,
                  borderRadius: 8, color: filtroTipo === tipo ? NOTICIA_COLORES[tipo] : "#9ca3af",
                  padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer",
                }}>
                  {NOTICIA_LABELS[tipo]} ({count})
                </button>
              );
            })}
          </div>
        )}
      </div>
 
      {noticias.length === 0 && !buscando ? (
        <div style={{ textAlign: "center", padding: 60, color: "#6b7280" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📰</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#9ca3af", marginBottom: 8 }}>Sin noticias escaneadas</div>
          <div style={{ fontSize: 13 }}>Pulsa "Escanear noticias" para buscar información sobre tus jugadores</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {noticiasFiltradas.map(noticia => (
            <div key={noticia.id} style={{
              background: "#1a1f2e", borderRadius: 14, padding: "16px 20px",
              border: `1px solid ${NOTICIA_COLORES[noticia.tipo]}30`,
              borderLeft: `4px solid ${NOTICIA_COLORES[noticia.tipo]}`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                    <span style={{ background: NOTICIA_COLORES[noticia.tipo] + "20", color: NOTICIA_COLORES[noticia.tipo], border: `1px solid ${NOTICIA_COLORES[noticia.tipo]}40`, borderRadius: 6, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>
                      {NOTICIA_LABELS[noticia.tipo]}
                    </span>
                    <span style={{ color: "#6b7280", fontSize: 12, fontWeight: 600 }}>👤 {noticia.jugador}</span>
                  </div>
                  <div style={{ color: "#fff", fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{noticia.titular}</div>
                  <div style={{ color: "#6b7280", fontSize: 12 }}>📡 {noticia.fuente} · 📅 {noticia.fecha}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
 
// ── RESUMEN SEMANAL ───────────────────────────────────────────────
function ResumenSemanal({ jugadores, entradas, alertasContrato }: { jugadores: Jugador[]; entradas: Entrada[]; alertasContrato: Entrada[] }) {
  const [resumen, setResumen] = useState("");
  const [generando, setGenerando] = useState(false);
 
  const hoy = new Date();
  const diaSemana = hoy.getDay();
  const esLunes = diaSemana === 1;
  const diasParaLunes = esLunes ? 0 : (8 - diaSemana) % 7;
  const proximoLunes = new Date(hoy);
  proximoLunes.setDate(hoy.getDate() + diasParaLunes);
 
  async function generarResumen() {
    setGenerando(true);
    setResumen("");
 
    const alertasAltas = alertasContrato.filter(a => a.urgencia === "Alta");
    const entradasSemana = entradas.slice(0, 10);
    const seguimientos = entradas.filter(e => e.seguimiento && e.seguimiento.length > 2).slice(0, 5);
 
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `Eres el asistente de scouting de ScoutPro. Genera un resumen semanal profesional y conciso para el equipo de scouting.
 
Datos actuales del sistema:
- Total jugadores en radar: ${jugadores.length}
- Alertas de contrato urgentes (menos de 3 meses): ${alertasAltas.length} jugadores: ${alertasAltas.map(a => a.jugadorRelacionado).join(", ") || "ninguno"}
- Alertas de contrato totales (menos de 12 meses): ${alertasContrato.length}
- Últimas entradas del diario: ${entradasSemana.map(e => `${e.jugadorRelacionado} (${e.tipoEntrada})`).join(", ") || "ninguna"}
- Seguimientos pendientes: ${seguimientos.map(e => `${e.jugadorRelacionado}: ${e.seguimiento}`).join(" | ") || "ninguno"}
 
Genera un resumen semanal estructurado con:
1. 🎯 Prioridades esta semana (máx 3 puntos)
2. 🚨 Alertas activas
3. 📋 Seguimientos pendientes
4. 💡 Recomendación de la semana
 
Sé directo y profesional. Usa emojis. Máximo 300 palabras.`,
          }],
        }),
      });
      const data = await res.json();
      setResumen(data.content?.map((b: { text?: string }) => b.text || "").join("") || "Error al generar resumen");
    } catch {
      setResumen("Error al conectar con la IA.");
    }
    setGenerando(false);
  }
 
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 900, color: "#fff" }}>📊 Resumen semanal</h2>
          <p style={{ margin: 0, color: "#6b7280", fontSize: 13 }}>
            Generado por IA · {esLunes ? "¡Hoy es lunes! Resumen disponible" : `Próximo lunes: ${proximoLunes.toLocaleDateString("es-ES")}`}
          </p>
        </div>
        <button onClick={generarResumen} disabled={generando} style={{
          background: generando ? "#374151" : "linear-gradient(135deg, #8b5cf6, #7c3aed)",
          border: "none", borderRadius: 10, color: "#fff", padding: "10px 20px", fontSize: 14, fontWeight: 700,
          cursor: generando ? "not-allowed" : "pointer",
        }}>
          {generando ? "⏳ Generando..." : "✨ Generar resumen"}
        </button>
      </div>
 
      {/* Estadísticas rápidas */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Jugadores en radar", value: jugadores.length, icon: "👤", color: "#3b82f6" },
          { label: "Alertas contrato", value: alertasContrato.length, icon: "🚨", color: "#ef4444" },
          { label: "Entradas esta semana", value: entradas.length, icon: "📝", color: "#10b981" },
          { label: "Seguimientos pendientes", value: entradas.filter(e => e.seguimiento?.length > 2).length, icon: "🔔", color: "#f59e0b" },
        ].map(stat => (
          <div key={stat.label} style={{ background: "#1a1f2e", border: `1px solid ${stat.color}20`, borderRadius: 12, padding: "16px 18px" }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{stat.icon}</div>
            <div style={{ color: stat.color, fontSize: 24, fontWeight: 900 }}>{stat.value}</div>
            <div style={{ color: "#6b7280", fontSize: 12, marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>
 
      {/* Alertas urgentes */}
      {alertasContrato.filter(a => a.urgencia === "Alta").length > 0 && (
        <div style={{ background: "linear-gradient(135deg, #2d1b1b, #1a1218)", border: "1px solid #ef444430", borderRadius: 12, padding: "16px 20px", marginBottom: 16 }}>
          <div style={{ color: "#ef4444", fontWeight: 700, fontSize: 14, marginBottom: 8 }}>🚨 Contratos urgentes esta semana</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {alertasContrato.filter(a => a.urgencia === "Alta").map((a, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#ef444410", borderRadius: 8, padding: "8px 12px" }}>
                <span style={{ color: "#fff", fontWeight: 600, fontSize: 13 }}>{a.jugadorRelacionado}</span>
                <span style={{ color: "#ef4444", fontSize: 12, fontWeight: 700 }}>⏳ {a.mesesRestantes} mes{a.mesesRestantes !== 1 ? "es" : ""}</span>
              </div>
            ))}
          </div>
        </div>
      )}
 
      {/* Resumen IA */}
      {resumen ? (
        <div style={{ background: "#1a1f2e", border: "1px solid #8b5cf630", borderRadius: 14, padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ color: "#8b5cf6", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>✨ Resumen generado por IA</div>
            <button onClick={() => navigator.clipboard.writeText(resumen)} style={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 8, color: "#9ca3af", padding: "6px 12px", fontSize: 12, cursor: "pointer" }}>📋 Copiar</button>
          </div>
          <div style={{ color: "#d1d5db", fontSize: 14, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{resumen}</div>
        </div>
      ) : (
        <div style={{ background: "#1a1f2e", border: "1px solid #1f2937", borderRadius: 14, padding: 40, textAlign: "center", color: "#6b7280" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#9ca3af", marginBottom: 8 }}>Resumen no generado todavía</div>
          <div style={{ fontSize: 13 }}>Pulsa "Generar resumen" para obtener un análisis semanal completo con IA</div>
        </div>
      )}
    </div>
  );
}
 
// ── COMPONENTE PRINCIPAL ──────────────────────────────────────────
export default function Diario() {
  const [entradasSheet, setEntradasSheet] = useState<Entrada[]>([]);
  const [alertasContrato, setAlertasContrato] = useState<Entrada[]>([]);
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroUrgencia, setFiltroUrgencia] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [seleccionada, setSeleccionada] = useState<Entrada | null>(null);
  const [ultimaActualizacion, setUltimaActualizacion] = useState("");
  const [mostrarSoloAlertas, setMostrarSoloAlertas] = useState(false);
  const [pestana, setPestana] = useState<Pestana>("diario");
  const [rol, setRol] = useState<Rol>("scout");
 
  function cargar() {
    Papa.parse(CSV_DIARIO, {
      download: true, header: false, skipEmptyLines: false,
      complete: (result) => {
        setEntradasSheet(parseEntradas(result.data as string[][]));
        setUltimaActualizacion(new Date().toLocaleTimeString("es-ES"));
        setLoading(false);
      },
      error: () => setLoading(false),
    });
    Papa.parse(CSV_JUGADORES, {
      download: true, header: false, skipEmptyLines: false,
      complete: (result) => {
        const filas = result.data as string[][];
        const j = parseJugadores(filas);
        setJugadores(j);
        setAlertasContrato(generarAlertasContrato(j));
      },
    });
  }
 
  useEffect(() => {
    cargar();
    const rolGuardado = (localStorage.getItem("scoutpro_rol") as Rol) || "scout";
    setRol(rolGuardado);
    const interval = setInterval(cargar, 30000);
    return () => clearInterval(interval);
  }, []);
 
  const puedeVerHerramientas = rol === "admin" || rol === "ojeador";
  const todasLasEntradas: Entrada[] = [...alertasContrato, ...entradasSheet];
  const urgencias = [...new Set(todasLasEntradas.map(e => e.urgencia).filter(Boolean))];
  const tipos = [...new Set(todasLasEntradas.map(e => e.tipoEntrada).filter(Boolean))];
 
  const filtradas = todasLasEntradas.filter(e => {
    if (mostrarSoloAlertas && e.tipoEntrada !== "Alerta Contrato") return false;
    const texto = busqueda.toLowerCase();
    return (!busqueda || e.nota.toLowerCase().includes(texto) || e.jugadorRelacionado.toLowerCase().includes(texto) || e.scout.toLowerCase().includes(texto) || e.lugarEvento.toLowerCase().includes(texto))
      && (!filtroUrgencia || e.urgencia === filtroUrgencia)
      && (!filtroTipo || e.tipoEntrada === filtroTipo);
  });
 
  // Vista detalle entrada
  if (seleccionada) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f1117", color: "#e5e7eb", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px" }}>
          <button onClick={() => setSeleccionada(null)} style={{ background: "#1f2937", border: "1px solid #374151", color: "#d1d5db", borderRadius: 8, padding: "8px 16px", fontSize: 14, cursor: "pointer", marginBottom: 24 }}>← Volver</button>
          <div style={{ background: seleccionada.esAlerta ? "linear-gradient(135deg, #2d1b1b, #1a1218)" : "linear-gradient(135deg, #1a1f2e, #111827)", border: `1px solid ${seleccionada.esAlerta ? "#ef444430" : "#1f2937"}`, borderRadius: 16, padding: "28px 32px", marginBottom: 24 }}>
            {seleccionada.esAlerta && (
              <div style={{ background: "#ef444415", border: "1px solid #ef444430", borderRadius: 8, padding: "8px 14px", marginBottom: 16, color: "#ef4444", fontSize: 13, fontWeight: 700 }}>
                🚨 ALERTA AUTOMÁTICA — Radar de contratos
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#fff" }}>{seleccionada.tipoEntrada || "Entrada de diario"}</div>
                <div style={{ color: "#6b7280", fontSize: 14, marginTop: 4 }}>📅 {seleccionada.fecha} · 👤 {seleccionada.scout || "—"}</div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {seleccionada.tipoEntrada && <span style={{ background: getTipoColor(seleccionada.tipoEntrada) + "20", color: getTipoColor(seleccionada.tipoEntrada), border: `1px solid ${getTipoColor(seleccionada.tipoEntrada)}40`, borderRadius: 6, padding: "4px 12px", fontSize: 13, fontWeight: 600 }}>{seleccionada.tipoEntrada}</span>}
                {seleccionada.urgencia && <span style={{ background: getUrgenciaColor(seleccionada.urgencia) + "20", color: getUrgenciaColor(seleccionada.urgencia), border: `1px solid ${getUrgenciaColor(seleccionada.urgencia)}40`, borderRadius: 6, padding: "4px 12px", fontSize: 13, fontWeight: 600 }}>🔥 {seleccionada.urgencia}</span>}
                {seleccionada.mesesRestantes !== undefined && <span style={{ background: "#ef444420", color: "#ef4444", border: "1px solid #ef444440", borderRadius: 6, padding: "4px 12px", fontSize: 13, fontWeight: 600 }}>⏳ {seleccionada.mesesRestantes} meses</span>}
              </div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            {[
              { label: "Jugador relacionado", value: seleccionada.jugadorRelacionado, icon: "👤" },
              { label: "Club actual", value: seleccionada.lugarEvento, icon: "🏟️" },
              { label: "Fuente / Información", value: seleccionada.fuente, icon: "📡" },
              { label: "Seguimiento necesario", value: seleccionada.seguimiento, icon: "🔔" },
            ].map(item => item.value ? (
              <div key={item.label} style={{ background: "#1a1f2e", border: "1px solid #1f2937", borderRadius: 12, padding: "16px 20px" }}>
                <div style={{ color: "#6b7280", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{item.icon} {item.label}</div>
                <div style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>{item.value}</div>
              </div>
            ) : null)}
          </div>
          {seleccionada.nota && (
            <div style={{ background: "#1a1f2e", border: "1px solid #1f2937", borderRadius: 12, padding: "20px 24px" }}>
              <div style={{ color: "#6b7280", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>📝 Nota / Observación</div>
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
              {todasLasEntradas.length} entradas · Actualizado {ultimaActualizacion}
              {alertasContrato.length > 0 && (
                <span style={{ marginLeft: 10, background: "#ef444420", color: "#ef4444", border: "1px solid #ef444440", borderRadius: 6, padding: "2px 8px", fontSize: 12, fontWeight: 700 }}>
                  🚨 {alertasContrato.length} alerta{alertasContrato.length !== 1 ? "s" : ""}
                </span>
              )}
            </p>
          </div>
          {pestana === "diario" && alertasContrato.length > 0 && (
            <button onClick={() => setMostrarSoloAlertas(!mostrarSoloAlertas)} style={{ background: mostrarSoloAlertas ? "#ef4444" : "#ef444420", border: "1px solid #ef444440", borderRadius: 10, padding: "10px 18px", color: mostrarSoloAlertas ? "#fff" : "#ef4444", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              🚨 {mostrarSoloAlertas ? "Ver todo" : "Solo alertas"}
            </button>
          )}
        </div>
 
        {/* PESTAÑAS */}
        <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "#1a1f2e", borderRadius: 12, padding: 4, border: "1px solid #1f2937", flexWrap: "wrap", width: "fit-content" }}>
          <button onClick={() => setPestana("diario")} style={{ background: pestana === "diario" ? "#3b82f6" : "transparent", border: "none", borderRadius: 9, padding: "8px 18px", color: pestana === "diario" ? "#fff" : "#6b7280", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            📓 Diario
          </button>
 
          {puedeVerHerramientas && (
            <>
              <button onClick={() => setPestana("checklist")} style={{ background: pestana === "checklist" ? "#3b82f6" : "transparent", border: pestana === "checklist" ? "none" : "1px dashed #3b82f640", borderRadius: 9, padding: "8px 18px", color: pestana === "checklist" ? "#fff" : "#3b82f6", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                ✈️ Checklist viaje
              </button>
              <button onClick={() => setPestana("noticias")} style={{ background: pestana === "noticias" ? "#8b5cf6" : "transparent", border: pestana === "noticias" ? "none" : "1px dashed #8b5cf640", borderRadius: 9, padding: "8px 18px", color: pestana === "noticias" ? "#fff" : "#8b5cf6", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                📰 Radar noticias
              </button>
              <button onClick={() => setPestana("resumen")} style={{ background: pestana === "resumen" ? "#10b981" : "transparent", border: pestana === "resumen" ? "none" : "1px dashed #10b98140", borderRadius: 9, padding: "8px 18px", color: pestana === "resumen" ? "#fff" : "#10b981", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                📊 Resumen semanal
              </button>
            </>
          )}
        </div>
 
        {/* ── PESTAÑA DIARIO ── */}
        {pestana === "diario" && (
          <>
            {alertasContrato.filter(a => a.urgencia === "Alta").length > 0 && !mostrarSoloAlertas && (
              <div style={{ background: "linear-gradient(135deg, #2d1b1b, #1a1218)", border: "1px solid #ef444430", borderRadius: 12, padding: "16px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <span style={{ fontSize: 24 }}>🚨</span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "#ef4444", fontWeight: 700, fontSize: 14 }}>{alertasContrato.filter(a => a.urgencia === "Alta").length} jugador{alertasContrato.filter(a => a.urgencia === "Alta").length !== 1 ? "es" : ""} con contrato expirando en menos de 3 meses</div>
                  <div style={{ color: "#9ca3af", fontSize: 12, marginTop: 2 }}>{alertasContrato.filter(a => a.urgencia === "Alta").map(a => a.jugadorRelacionado).join(" · ")}</div>
                </div>
                <button onClick={() => setMostrarSoloAlertas(true)} style={{ background: "#ef444420", border: "1px solid #ef444440", borderRadius: 8, padding: "8px 14px", color: "#ef4444", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Ver alertas →</button>
              </div>
            )}
 
            <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
              <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="🔍 Buscar por nota, jugador, scout o lugar..." style={{ flex: 1, minWidth: 240, background: "#1a1f2e", border: "1px solid #1f2937", borderRadius: 10, padding: "10px 16px", color: "#fff", fontSize: 14, outline: "none" }} />
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
                      {["Fecha", "Scout", "Tipo", "Jugador", "Lugar", "Urgencia", "Nota", "Seguimiento"].map(h => (
                        <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtradas.map((e, i) => (
                      <tr key={i} onClick={() => setSeleccionada(e)}
                        style={{ borderBottom: "1px solid #1f2937", cursor: "pointer", transition: "background 0.1s", background: e.esAlerta ? "#ef444408" : "transparent" }}
                        onMouseEnter={ev => (ev.currentTarget as HTMLTableRowElement).style.background = e.esAlerta ? "#ef444415" : "#111827"}
                        onMouseLeave={ev => (ev.currentTarget as HTMLTableRowElement).style.background = e.esAlerta ? "#ef444408" : "transparent"}>
                        <td style={{ padding: "12px 16px", fontSize: 13, color: "#9ca3af", whiteSpace: "nowrap" }}>{e.esAlerta && <span style={{ marginRight: 6 }}>🚨</span>}{e.fecha}</td>
                        <td style={{ padding: "12px 16px", fontSize: 13, color: "#d1d5db" }}>{e.scout || "—"}</td>
                        <td style={{ padding: "12px 16px" }}>{e.tipoEntrada && <span style={{ background: getTipoColor(e.tipoEntrada) + "20", color: getTipoColor(e.tipoEntrada), border: `1px solid ${getTipoColor(e.tipoEntrada)}40`, borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 600 }}>{e.tipoEntrada}</span>}</td>
                        <td style={{ padding: "12px 16px", fontSize: 13, color: "#d1d5db" }}>{e.jugadorRelacionado || "—"}</td>
                        <td style={{ padding: "12px 16px", fontSize: 13, color: "#d1d5db" }}>{e.lugarEvento || "—"}</td>
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
 
        {/* ── PESTAÑAS RESTRINGIDAS ── */}
        {pestana === "checklist" && puedeVerHerramientas && <ChecklistViaje jugadores={jugadores} entradas={entradasSheet} />}
        {pestana === "noticias" && puedeVerHerramientas && <ScrapingNoticias jugadores={jugadores} />}
        {pestana === "resumen" && puedeVerHerramientas && <ResumenSemanal jugadores={jugadores} entradas={entradasSheet} alertasContrato={alertasContrato} />}
 
        {/* Acceso denegado */}
        {(pestana === "checklist" || pestana === "noticias" || pestana === "resumen") && !puedeVerHerramientas && (
          <div style={{ textAlign: "center", padding: 80, color: "#6b7280" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#9ca3af", marginBottom: 8 }}>Acceso restringido</div>
            <div style={{ fontSize: 14 }}>Esta sección solo está disponible para Ojeadores y Administradores</div>
          </div>
        )}
      </div>
    </div>
  );
}