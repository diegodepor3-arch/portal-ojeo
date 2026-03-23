"use client";
import { useEffect, useState } from "react";
import Papa from "papaparse";
 
const SHEET_ID = "1Hh982i-Mx_ytjeAONBkJtWLu7N3AaEHGZRyqBw0DS5A";
const CSV_JUGADORES = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Jugadores`;
 
type InformeViaje = {
  id: string;
  jugador: string;
  partido: string;
  fecha: string;
  valoracion: number;
  nota: string;
  aspectos: string[];
  urgencia: "Alta" | "Media" | "Baja";
  scout: string;
  sincronizado: boolean;
  creadoEn: string;
};
 
type Jugador = {
  id: string;
  apellidos: string;
  nombre: string;
  equipoActual: string;
  posicion: string;
};
 
const ASPECTOS_TACTICOS = [
  "Presión alta", "Juego aéreo", "Remate", "Pase largo",
  "Regate", "Visión de juego", "Posicionamiento", "Velocidad",
  "Duelos defensivos", "Juego de espaldas", "Desmarques", "Liderazgo",
];
 
const URGENCIA_COLORES = { Alta: "#ef4444", Media: "#f59e0b", Baja: "#10b981" };
 
function getInformes(): InformeViaje[] {
  try { return JSON.parse(localStorage.getItem("informes_viaje") || "[]"); } catch { return []; }
}
function saveInformes(lista: InformeViaje[]) {
  try { localStorage.setItem("informes_viaje", JSON.stringify(lista)); } catch {}
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
    const j = { id: get(1), apellidos: get(2), nombre: get(3), posicion: get(4), equipoActual: get(6) };
    if (j.apellidos || j.nombre) result.push(j);
  }
  return result;
}
 
export default function ModoViaje() {
  const [vista, setVista] = useState<"lista" | "nuevo" | "detalle">("lista");
  const [informes, setInformes] = useState<InformeViaje[]>([]);
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [jugadoresCargados, setJugadoresCargados] = useState(false);
  const [informeSeleccionado, setInformeSeleccionado] = useState<InformeViaje | null>(null);
  const [nombreScout, setNombreScout] = useState("");
  const [online, setOnline] = useState(true);
  const [guardado, setGuardado] = useState(false);
 
  // Form state
  const [jugadorInput, setJugadorInput] = useState("");
  const [jugadorSugerencias, setJugadorSugerencias] = useState<Jugador[]>([]);
  const [partido, setPartido] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [valoracion, setValoracion] = useState(5);
  const [nota, setNota] = useState("");
  const [aspectos, setAspectos] = useState<string[]>([]);
  const [urgencia, setUrgencia] = useState<"Alta" | "Media" | "Baja">("Media");
 
  useEffect(() => {
    setInformes(getInformes());
    setNombreScout(localStorage.getItem("scoutpro_nombre") || "Scout");
    setOnline(navigator.onLine);
    window.addEventListener("online", () => setOnline(true));
    window.addEventListener("offline", () => setOnline(false));
 
    // Cargar jugadores con tolerancia a fallo (modo offline)
    Papa.parse(CSV_JUGADORES, {
      download: true, header: false, skipEmptyLines: false,
      complete: (result) => {
        setJugadores(parseJugadores(result.data as string[][]));
        setJugadoresCargados(true);
      },
      error: () => setJugadoresCargados(true),
    });
 
    return () => {
      window.removeEventListener("online", () => setOnline(true));
      window.removeEventListener("offline", () => setOnline(false));
    };
  }, []);
 
  function handleJugadorInput(val: string) {
    setJugadorInput(val);
    if (val.length < 2) { setJugadorSugerencias([]); return; }
    const sugs = jugadores.filter(j =>
      `${j.apellidos} ${j.nombre}`.toLowerCase().includes(val.toLowerCase()) ||
      j.equipoActual.toLowerCase().includes(val.toLowerCase())
    ).slice(0, 5);
    setJugadorSugerencias(sugs);
  }
 
  function toggleAspecto(aspecto: string) {
    setAspectos(prev => prev.includes(aspecto) ? prev.filter(a => a !== aspecto) : [...prev, aspecto]);
  }
 
  function resetForm() {
    setJugadorInput(""); setPartido(""); setFecha(new Date().toISOString().split("T")[0]);
    setValoracion(5); setNota(""); setAspectos([]); setUrgencia("Media");
    setJugadorSugerencias([]);
  }
 
  function guardarInforme() {
    if (!jugadorInput.trim()) return;
    const nuevo: InformeViaje = {
      id: Date.now().toString(),
      jugador: jugadorInput.trim(),
      partido: partido.trim(),
      fecha,
      valoracion,
      nota: nota.trim(),
      aspectos,
      urgencia,
      scout: nombreScout,
      sincronizado: online,
      creadoEn: new Date().toLocaleString("es-ES"),
    };
    const actualizados = [nuevo, ...informes];
    setInformes(actualizados);
    saveInformes(actualizados);
    setGuardado(true);
    setTimeout(() => { setGuardado(false); setVista("lista"); resetForm(); }, 1200);
  }
 
  function eliminarInforme(id: string) {
    const actualizados = informes.filter(i => i.id !== id);
    setInformes(actualizados);
    saveInformes(actualizados);
    setInformeSeleccionado(null);
    setVista("lista");
  }
 
  function marcarSincronizado(id: string) {
    const actualizados = informes.map(i => i.id === id ? { ...i, sincronizado: true } : i);
    setInformes(actualizados);
    saveInformes(actualizados);
  }
 
  const pendientesSincronizar = informes.filter(i => !i.sincronizado).length;
 
  // ── VISTA DETALLE ──────────────────────────────────────────────
  if (vista === "detalle" && informeSeleccionado) {
    const inf = informeSeleccionado;
    return (
      <div style={{ minHeight: "100vh", background: "#0b0d17", color: "#e5e7eb", fontFamily: "'Segoe UI', system-ui, sans-serif", maxWidth: 500, margin: "0 auto", padding: "0 0 40px" }}>
        {/* Header */}
        <div style={{ background: "#1a1c2e", borderBottom: "1px solid #1f2937", padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 10 }}>
          <button onClick={() => { setVista("lista"); setInformeSeleccionado(null); }} style={{ background: "#111827", border: "1px solid #374151", borderRadius: 8, color: "#9ca3af", padding: "8px 12px", fontSize: 13, cursor: "pointer" }}>←</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 900, color: "#fff", fontSize: 16 }}>{inf.jugador}</div>
            <div style={{ color: "#6b7280", fontSize: 12 }}>{inf.partido} · {inf.fecha}</div>
          </div>
          <span style={{ background: URGENCIA_COLORES[inf.urgencia] + "20", color: URGENCIA_COLORES[inf.urgencia], border: `1px solid ${URGENCIA_COLORES[inf.urgencia]}40`, borderRadius: 8, padding: "4px 12px", fontSize: 12, fontWeight: 700 }}>{inf.urgencia}</span>
        </div>
 
        <div style={{ padding: "20px 20px" }}>
          {/* Valoración */}
          <div style={{ background: "#1a1c2e", borderRadius: 16, padding: "20px", marginBottom: 14, textAlign: "center", border: "1px solid #1f2937" }}>
            <div style={{ color: "#6b7280", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Valoración</div>
            <div style={{ fontSize: 56, fontWeight: 900, color: inf.valoracion >= 8 ? "#10b981" : inf.valoracion >= 6 ? "#f59e0b" : "#ef4444" }}>
              {inf.valoracion}<span style={{ fontSize: 24, color: "#374151" }}>/10</span>
            </div>
          </div>
 
          {/* Aspectos */}
          {inf.aspectos.length > 0 && (
            <div style={{ background: "#1a1c2e", borderRadius: 16, padding: "16px", marginBottom: 14, border: "1px solid #1f2937" }}>
              <div style={{ color: "#6b7280", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Aspectos destacados</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {inf.aspectos.map(a => (
                  <span key={a} style={{ background: "#3b82f615", color: "#60a5fa", border: "1px solid #3b82f630", borderRadius: 8, padding: "5px 12px", fontSize: 13, fontWeight: 600 }}>{a}</span>
                ))}
              </div>
            </div>
          )}
 
          {/* Nota */}
          {inf.nota && (
            <div style={{ background: "#1a1c2e", borderRadius: 16, padding: "16px", marginBottom: 14, border: "1px solid #1f2937" }}>
              <div style={{ color: "#6b7280", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>📝 Nota</div>
              <div style={{ color: "#e5e7eb", fontSize: 15, lineHeight: 1.7 }}>{inf.nota}</div>
            </div>
          )}
 
          {/* Meta */}
          <div style={{ background: "#1a1c2e", borderRadius: 16, padding: "16px", marginBottom: 20, border: "1px solid #1f2937" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "Scout", value: inf.scout },
                { label: "Creado", value: inf.creadoEn },
                { label: "Estado", value: inf.sincronizado ? "✅ Sincronizado" : "⏳ Pendiente de sync" },
              ].map(item => (
                <div key={item.label} style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#6b7280", fontSize: 13 }}>{item.label}</span>
                  <span style={{ color: inf.sincronizado || item.label !== "Estado" ? "#d1d5db" : "#f59e0b", fontSize: 13, fontWeight: 600 }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
 
          <div style={{ display: "flex", gap: 10 }}>
            {!inf.sincronizado && online && (
              <button onClick={() => marcarSincronizado(inf.id)} style={{ flex: 1, background: "#10b98120", border: "1px solid #10b98140", borderRadius: 12, color: "#10b981", padding: "14px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                ☁️ Marcar sincronizado
              </button>
            )}
            <button onClick={() => eliminarInforme(inf.id)} style={{ background: "#ef444415", border: "1px solid #ef444430", borderRadius: 12, color: "#ef4444", padding: "14px 18px", fontSize: 14, cursor: "pointer" }}>
              🗑️
            </button>
          </div>
        </div>
      </div>
    );
  }
 
  // ── VISTA NUEVO INFORME ────────────────────────────────────────
  if (vista === "nuevo") {
    return (
      <div style={{ minHeight: "100vh", background: "#0b0d17", color: "#e5e7eb", fontFamily: "'Segoe UI', system-ui, sans-serif", maxWidth: 500, margin: "0 auto", padding: "0 0 60px" }}>
        {/* Header */}
        <div style={{ background: "#1a1c2e", borderBottom: "1px solid #1f2937", padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 10 }}>
          <button onClick={() => { setVista("lista"); resetForm(); }} style={{ background: "#111827", border: "1px solid #374151", borderRadius: 8, color: "#9ca3af", padding: "8px 12px", fontSize: 13, cursor: "pointer" }}>✕</button>
          <div style={{ flex: 1, fontWeight: 900, color: "#fff", fontSize: 16 }}>Nuevo informe</div>
          <span style={{ fontSize: 11, color: online ? "#10b981" : "#f59e0b", fontWeight: 700 }}>
            {online ? "🟢 Online" : "🟡 Offline"}
          </span>
        </div>
 
        {guardado ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 300, gap: 16 }}>
            <div style={{ fontSize: 56 }}>✅</div>
            <div style={{ color: "#10b981", fontWeight: 900, fontSize: 20 }}>¡Guardado!</div>
            <div style={{ color: "#6b7280", fontSize: 14 }}>{online ? "Sincronizado" : "Guardado offline"}</div>
          </div>
        ) : (
          <div style={{ padding: "20px" }}>
 
            {/* Jugador */}
            <div style={{ marginBottom: 16, position: "relative" }}>
              <label style={{ color: "#9ca3af", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 8 }}>👤 Jugador observado *</label>
              <input
                value={jugadorInput} onChange={e => handleJugadorInput(e.target.value)}
                placeholder="Nombre del jugador..."
                style={{ width: "100%", background: "#1a1c2e", border: "1px solid #374151", borderRadius: 12, padding: "14px 16px", color: "#fff", fontSize: 16, outline: "none", boxSizing: "border-box" }}
                autoComplete="off"
              />
              {jugadorSugerencias.length > 0 && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#1a1c2e", border: "1px solid #374151", borderRadius: 12, zIndex: 20, overflow: "hidden", marginTop: 4 }}>
                  {jugadorSugerencias.map(j => (
                    <div key={j.id} onClick={() => { setJugadorInput(`${j.apellidos}, ${j.nombre}`); setJugadorSugerencias([]); }}
                      style={{ padding: "12px 16px", cursor: "pointer", borderBottom: "1px solid #1f2937", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "#111827"}
                      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "transparent"}>
                      <div>
                        <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{j.apellidos}, {j.nombre}</div>
                        <div style={{ color: "#6b7280", fontSize: 12 }}>{j.equipoActual} · {j.posicion}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
 
            {/* Partido y fecha */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ color: "#9ca3af", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 8 }}>⚽ Partido</label>
                <input value={partido} onChange={e => setPartido(e.target.value)} placeholder="Local vs Visitante" style={{ width: "100%", background: "#1a1c2e", border: "1px solid #374151", borderRadius: 12, padding: "14px 12px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ color: "#9ca3af", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 8 }}>📅 Fecha</label>
                <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} style={{ width: "100%", background: "#1a1c2e", border: "1px solid #374151", borderRadius: 12, padding: "14px 12px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
              </div>
            </div>
 
            {/* Valoración */}
            <div style={{ background: "#1a1c2e", borderRadius: 16, padding: "18px", marginBottom: 16, border: "1px solid #1f2937" }}>
              <label style={{ color: "#9ca3af", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 12 }}>⭐ Valoración</label>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 52, fontWeight: 900, color: valoracion >= 8 ? "#10b981" : valoracion >= 6 ? "#f59e0b" : "#ef4444", lineHeight: 1 }}>
                  {valoracion}
                </span>
                <span style={{ fontSize: 24, color: "#374151", alignSelf: "flex-end", marginBottom: 6 }}>/10</span>
              </div>
              <input type="range" min={1} max={10} step={1} value={valoracion} onChange={e => setValoracion(+e.target.value)}
                style={{ width: "100%", accentColor: valoracion >= 8 ? "#10b981" : valoracion >= 6 ? "#f59e0b" : "#ef4444", height: 6, cursor: "pointer" }} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                  <button key={n} onClick={() => setValoracion(n)} style={{
                    width: 28, height: 28, borderRadius: "50%", fontSize: 11, fontWeight: 700, cursor: "pointer",
                    background: valoracion === n ? (n >= 8 ? "#10b981" : n >= 6 ? "#f59e0b" : "#ef4444") : "#111827",
                    border: `1px solid ${valoracion === n ? "transparent" : "#374151"}`,
                    color: valoracion === n ? "#fff" : "#6b7280",
                  }}>{n}</button>
                ))}
              </div>
            </div>
 
            {/* Urgencia */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ color: "#9ca3af", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 8 }}>🔥 Urgencia</label>
              <div style={{ display: "flex", gap: 8 }}>
                {(["Alta", "Media", "Baja"] as const).map(u => (
                  <button key={u} onClick={() => setUrgencia(u)} style={{
                    flex: 1, padding: "12px", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer",
                    background: urgencia === u ? URGENCIA_COLORES[u] + "30" : "#1a1c2e",
                    border: `2px solid ${urgencia === u ? URGENCIA_COLORES[u] : "#374151"}`,
                    color: urgencia === u ? URGENCIA_COLORES[u] : "#6b7280",
                    transition: "all 0.15s",
                  }}>{u}</button>
                ))}
              </div>
            </div>
 
            {/* Aspectos tácticos */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ color: "#9ca3af", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 8 }}>
                🧠 Aspectos tácticos ({aspectos.length} seleccionados)
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {ASPECTOS_TACTICOS.map(aspecto => (
                  <button key={aspecto} onClick={() => toggleAspecto(aspecto)} style={{
                    padding: "12px 10px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", textAlign: "left",
                    background: aspectos.includes(aspecto) ? "#3b82f620" : "#1a1c2e",
                    border: `1px solid ${aspectos.includes(aspecto) ? "#3b82f660" : "#374151"}`,
                    color: aspectos.includes(aspecto) ? "#60a5fa" : "#9ca3af",
                    transition: "all 0.1s",
                    display: "flex", alignItems: "center", gap: 8,
                  }}>
                    <span style={{ fontSize: 16 }}>{aspectos.includes(aspecto) ? "✅" : "⬜"}</span>
                    {aspecto}
                  </button>
                ))}
              </div>
            </div>
 
            {/* Nota */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ color: "#9ca3af", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 8 }}>📝 Nota rápida</label>
              <textarea
                value={nota} onChange={e => setNota(e.target.value)}
                placeholder="Observaciones del partido..."
                rows={4}
                style={{ width: "100%", background: "#1a1c2e", border: "1px solid #374151", borderRadius: 12, padding: "14px 16px", color: "#fff", fontSize: 15, outline: "none", resize: "none", boxSizing: "border-box", lineHeight: 1.6 }}
              />
            </div>
 
            {/* Botón guardar */}
            <button
              onClick={guardarInforme}
              disabled={!jugadorInput.trim()}
              style={{
                width: "100%", padding: "18px",
                background: jugadorInput.trim() ? "linear-gradient(135deg, #3b82f6, #2563eb)" : "#374151",
                border: "none", borderRadius: 16, color: "#fff", fontSize: 17, fontWeight: 900,
                cursor: jugadorInput.trim() ? "pointer" : "not-allowed",
                boxShadow: jugadorInput.trim() ? "0 4px 24px #3b82f640" : "none",
              }}
            >
              {online ? "💾 Guardar y sincronizar" : "💾 Guardar offline"}
            </button>
 
            {!online && (
              <p style={{ color: "#f59e0b", fontSize: 12, textAlign: "center", marginTop: 10 }}>
                ⚠️ Sin conexión — el informe se guardará localmente y se sincronizará cuando vuelvas a tener cobertura
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
 
  // ── VISTA LISTA ────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#0b0d17", color: "#e5e7eb", fontFamily: "'Segoe UI', system-ui, sans-serif", maxWidth: 500, margin: "0 auto", padding: "0 0 40px" }}>
      {/* Header */}
      <div style={{ background: "#1a1c2e", borderBottom: "1px solid #1f2937", padding: "16px 20px", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>✈️</span>
            <div>
              <div style={{ fontWeight: 900, color: "#fff", fontSize: 18 }}>Modo Viaje</div>
              <div style={{ color: "#6b7280", fontSize: 11 }}>{nombreScout}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 11, color: online ? "#10b981" : "#f59e0b", fontWeight: 700, background: online ? "#10b98115" : "#f59e0b15", padding: "4px 10px", borderRadius: 20 }}>
              {online ? "🟢 Online" : "🟡 Offline"}
            </span>
            <a href="/" style={{ background: "#111827", border: "1px solid #374151", borderRadius: 8, color: "#9ca3af", padding: "6px 10px", fontSize: 12, textDecoration: "none" }}>✕</a>
          </div>
        </div>
 
        {pendientesSincronizar > 0 && (
          <div style={{ background: "#f59e0b15", border: "1px solid #f59e0b30", borderRadius: 8, padding: "8px 12px", marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#f59e0b", fontSize: 12, fontWeight: 600 }}>⏳ {pendientesSincronizar} informe{pendientesSincronizar !== 1 ? "s" : ""} pendiente{pendientesSincronizar !== 1 ? "s" : ""} de sincronizar</span>
            {online && (
              <button onClick={() => {
                const actualizados = informes.map(i => ({ ...i, sincronizado: true }));
                setInformes(actualizados); saveInformes(actualizados);
              }} style={{ background: "#f59e0b", border: "none", borderRadius: 6, color: "#000", padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                Sincronizar todo
              </button>
            )}
          </div>
        )}
      </div>
 
      <div style={{ padding: "20px" }}>
        {/* Botón nuevo informe */}
        <button onClick={() => setVista("nuevo")} style={{
          width: "100%", padding: "18px", marginBottom: 20,
          background: "linear-gradient(135deg, #3b82f6, #2563eb)",
          border: "none", borderRadius: 16, color: "#fff", fontSize: 16, fontWeight: 900,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          boxShadow: "0 4px 24px #3b82f640",
        }}>
          <span style={{ fontSize: 20 }}>+</span> Nuevo informe de partido
        </button>
 
        {/* Lista de informes */}
        {informes.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#6b7280" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#9ca3af", marginBottom: 8 }}>Sin informes todavía</div>
            <div style={{ fontSize: 13 }}>Pulsa el botón para crear tu primer informe de partido</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ color: "#6b7280", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
              {informes.length} informe{informes.length !== 1 ? "s" : ""} guardado{informes.length !== 1 ? "s" : ""}
            </div>
            {informes.map(inf => (
              <div key={inf.id} onClick={() => { setInformeSeleccionado(inf); setVista("detalle"); }}
                style={{
                  background: "#1a1c2e", borderRadius: 14, padding: "16px", cursor: "pointer",
                  border: `1px solid ${inf.sincronizado ? "#1f2937" : "#f59e0b30"}`,
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "#111827"}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "#1a1c2e"}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, color: "#fff", fontSize: 15 }}>{inf.jugador}</div>
                    <div style={{ color: "#6b7280", fontSize: 12, marginTop: 2 }}>{inf.partido || "—"} · {inf.fecha}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{
                      fontSize: 20, fontWeight: 900,
                      color: inf.valoracion >= 8 ? "#10b981" : inf.valoracion >= 6 ? "#f59e0b" : "#ef4444",
                    }}>{inf.valoracion}</span>
                    <span style={{ background: URGENCIA_COLORES[inf.urgencia] + "20", color: URGENCIA_COLORES[inf.urgencia], borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{inf.urgencia}</span>
                  </div>
                </div>
                {inf.aspectos.length > 0 && (
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 6 }}>
                    {inf.aspectos.slice(0, 3).map(a => (
                      <span key={a} style={{ background: "#3b82f610", color: "#60a5fa", borderRadius: 6, padding: "2px 7px", fontSize: 11 }}>{a}</span>
                    ))}
                    {inf.aspectos.length > 3 && <span style={{ color: "#6b7280", fontSize: 11 }}>+{inf.aspectos.length - 3}</span>}
                  </div>
                )}
                {inf.nota && (
                  <div style={{ color: "#6b7280", fontSize: 12, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{inf.nota}</div>
                )}
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
                  <span style={{ fontSize: 10, color: inf.sincronizado ? "#10b981" : "#f59e0b" }}>
                    {inf.sincronizado ? "✅ Sincronizado" : "⏳ Pendiente sync"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}