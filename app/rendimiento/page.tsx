"use client";
import { useEffect, useState } from "react";
import Papa from "papaparse";
 
const SHEET_ID = "1Hh982i-Mx_ytjeAONBkJtWLu7N3AaEHGZRyqBw0DS5A";
const CSV_JUGADORES = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Jugadores`;
const CSV_DIARIO = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=44769068`;
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwVmP41H4_j56ZqAM4lggPuch-z_l8MgGYhlhde-Ry8jZxdDbjjL3G6QxrJaTHsIVRI6g/exec";
 
type Rol = "admin" | "scout" | "director" | "ojeador";
 
type OjeadorRegistrado = {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  password: string;
  fechaRegistro: string;
};
 
type JugadorData = {
  id: string;
  apellidos: string;
  nombre: string;
  equipoActual: string;
  posicion: string;
  pais: string;
  scout: string;
  scoringIndex: string;
  categoria: string;
};
 
type EntradaDiario = {
  fecha: string;
  scout: string;
  tipoEntrada: string;
  jugadorRelacionado: string;
  lugarEvento: string;
  urgencia: string;
  nota: string;
};
 
type PanelOjeador = {
  nombre: string;
  email: string;
  telefono: string;
  fechaRegistro: string;
  totalInformes: number;
  jugadoresAnalizados: number;
  zonasGeograficas: string[];
  posicionesAnalizadas: Record<string, number>;
  tiposEntrada: Record<string, number>;
  urgencias: Record<string, number>;
  jugadores: JugadorData[];
  entradasDiario: EntradaDiario[];
  ultimaActividad: string;
};
 
// ── Helpers ───────────────────────────────────────────────────────
function getOjeadoresLocal(): OjeadorRegistrado[] {
  try { return JSON.parse(localStorage.getItem("ojeadores_registrados") || "[]"); } catch { return []; }
}
function saveOjeadoresLocal(lista: OjeadorRegistrado[]) {
  try { localStorage.setItem("ojeadores_registrados", JSON.stringify(lista)); } catch {}
}
async function fetchOjeadoresRemoto(): Promise<OjeadorRegistrado[]> {
  try {
    const res = await fetch(`${APPS_SCRIPT_URL}?action=getOjeadores`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}
 
function tieneFecha(val: string): boolean {
  return /\d{4}-\d{2}-\d{2}/.test(val) || /\d{1,2}\/\d{1,2}\/\d{4}/.test(val);
}
 
function parseJugadores(filas: string[][]): JugadorData[] {
  const result: JugadorData[] = [];
  let dataStart = 0;
  for (let i = 0; i < filas.length; i++) {
    const fila = filas[i].join(" ").toLowerCase();
    if (fila.includes("apellidos") || fila.includes("id")) { dataStart = i + 1; break; }
  }
  for (let i = dataStart; i < filas.length; i++) {
    const vals = filas[i];
    if (!vals || vals.every(v => !v || v.trim() === "")) continue;
    const get = (idx: number) => vals[idx]?.trim() || "";
    const j = { id: get(1), apellidos: get(2), nombre: get(3), posicion: get(4), equipoActual: get(6), pais: get(9), scoringIndex: get(16), categoria: get(20), scout: get(22) };
    if (j.apellidos || j.nombre) result.push(j);
  }
  return result;
}
 
function parseEntradas(filas: string[][]): EntradaDiario[] {
  const result: EntradaDiario[] = [];
  for (let i = 0; i < filas.length; i++) {
    const vals = filas[i];
    if (!vals || vals.every(v => !v || v.trim() === "")) continue;
    const get = (idx: number) => vals[idx]?.trim() || "";
    const fecha = get(1);
    if (!tieneFecha(fecha)) continue;
    const scout = get(2);
    if (!scout) continue;
    result.push({ fecha, scout, tipoEntrada: get(3), jugadorRelacionado: get(4), lugarEvento: get(5), urgencia: get(7), nota: get(8) });
  }
  return result;
}
 
function calcularPanel(nombre: string, jugadores: JugadorData[], entradas: EntradaDiario[], ojeador: OjeadorRegistrado): PanelOjeador {
  const nombreLower = nombre.toLowerCase();
  const jugadoresPropios = jugadores.filter(j =>
    j.scout.toLowerCase().includes(nombreLower) ||
    nombreLower.includes(j.scout.toLowerCase().split(" ")[0])
  );
  const entradasPropias = entradas.filter(e =>
    e.scout.toLowerCase().includes(nombreLower) ||
    nombreLower.includes(e.scout.toLowerCase().split(" ")[0])
  );
  const zonas = [...new Set([
    ...jugadoresPropios.map(j => j.pais).filter(Boolean),
    ...entradasPropias.map(e => e.lugarEvento).filter(Boolean),
  ])].slice(0, 8);
  const posiciones: Record<string, number> = {};
  jugadoresPropios.forEach(j => { if (j.posicion) posiciones[j.posicion] = (posiciones[j.posicion] || 0) + 1; });
  const tiposEntrada: Record<string, number> = {};
  entradasPropias.forEach(e => { if (e.tipoEntrada) tiposEntrada[e.tipoEntrada] = (tiposEntrada[e.tipoEntrada] || 0) + 1; });
  const urgencias: Record<string, number> = {};
  entradasPropias.forEach(e => { if (e.urgencia) urgencias[e.urgencia] = (urgencias[e.urgencia] || 0) + 1; });
  const ultimaActividad = entradasPropias.length > 0
    ? entradasPropias.sort((a, b) => b.fecha.localeCompare(a.fecha))[0].fecha
    : "Sin actividad";
  return {
    nombre: ojeador.nombre, email: ojeador.email, telefono: ojeador.telefono,
    fechaRegistro: ojeador.fechaRegistro, totalInformes: entradasPropias.length,
    jugadoresAnalizados: jugadoresPropios.length, zonasGeograficas: zonas,
    posicionesAnalizadas: posiciones, tiposEntrada, urgencias,
    jugadores: jugadoresPropios, entradasDiario: entradasPropias, ultimaActividad,
  };
}
 
const POS_COLORES: Record<string, string> = {
  Portero: "#f59e0b", Defensa: "#3b82f6", Centrocampista: "#10b981", Delantero: "#ef4444", Lateral: "#8b5cf6",
};
function getPosColor(pos: string) {
  for (const key of Object.keys(POS_COLORES)) {
    if (pos?.toLowerCase().includes(key.toLowerCase())) return POS_COLORES[key];
  }
  return "#6b7280";
}
 
function PanelOjeadorCard({ panel, expandido, onToggle }: { panel: PanelOjeador; expandido: boolean; onToggle: () => void }) {
  const totalEntradas = Object.values(panel.tiposEntrada).reduce((a, b) => a + b, 0);
  return (
    <div style={{ background: "#1a1f2e", border: "1px solid #1f2937", borderRadius: 16, overflow: "hidden", marginBottom: 16 }}>
      <div onClick={onToggle} style={{ padding: "20px 24px", cursor: "pointer", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}
        onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "#111827"}
        onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "transparent"}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg, #f59e0b, #d97706)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 900, color: "#000", flexShrink: 0 }}>
          {panel.nombre[0]?.toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, color: "#fff", fontSize: 16 }}>{panel.nombre}</div>
          <div style={{ color: "#6b7280", fontSize: 12, marginTop: 2 }}>
            📧 {panel.email} · 📞 {panel.telefono} · Registro: {panel.fechaRegistro}
          </div>
        </div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {[
            { label: "Informes", value: panel.totalInformes, color: "#3b82f6" },
            { label: "Jugadores", value: panel.jugadoresAnalizados, color: "#10b981" },
            { label: "Zonas", value: panel.zonasGeograficas.length, color: "#8b5cf6" },
          ].map(stat => (
            <div key={stat.label} style={{ textAlign: "center" }}>
              <div style={{ color: stat.color, fontWeight: 900, fontSize: 22 }}>{stat.value}</div>
              <div style={{ color: "#6b7280", fontSize: 11 }}>{stat.label}</div>
            </div>
          ))}
        </div>
        <span style={{ color: "#6b7280", fontSize: 18 }}>{expandido ? "▲" : "▼"}</span>
      </div>
 
      {expandido && (
        <div style={{ borderTop: "1px solid #1f2937", padding: "20px 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16, marginBottom: 20 }}>
            <div style={{ background: "#111827", borderRadius: 12, padding: "16px 18px", border: "1px solid #1f2937" }}>
              <div style={{ color: "#9ca3af", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>🌍 Zonas geográficas</div>
              {panel.zonasGeograficas.length === 0 ? <div style={{ color: "#4b5563", fontSize: 13 }}>Sin datos</div> : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {panel.zonasGeograficas.map(zona => (
                    <span key={zona} style={{ background: "#1a1f2e", border: "1px solid #374151", borderRadius: 6, padding: "3px 10px", fontSize: 12, color: "#d1d5db" }}>{zona}</span>
                  ))}
                </div>
              )}
            </div>
            <div style={{ background: "#111827", borderRadius: 12, padding: "16px 18px", border: "1px solid #1f2937" }}>
              <div style={{ color: "#9ca3af", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>📍 Posiciones analizadas</div>
              {Object.keys(panel.posicionesAnalizadas).length === 0 ? <div style={{ color: "#4b5563", fontSize: 13 }}>Sin datos</div> : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {Object.entries(panel.posicionesAnalizadas).sort((a, b) => b[1] - a[1]).map(([pos, count]) => (
                    <div key={pos} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ background: getPosColor(pos) + "20", color: getPosColor(pos), borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>{pos}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ background: "#1a1f2e", borderRadius: 4, height: 6, width: 60, overflow: "hidden" }}>
                          <div style={{ background: getPosColor(pos), height: "100%", width: `${(count / panel.jugadoresAnalizados) * 100}%` }} />
                        </div>
                        <span style={{ color: "#fff", fontWeight: 700, fontSize: 12, minWidth: 16 }}>{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ background: "#111827", borderRadius: 12, padding: "16px 18px", border: "1px solid #1f2937" }}>
              <div style={{ color: "#9ca3af", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>📝 Tipos de informe</div>
              {Object.keys(panel.tiposEntrada).length === 0 ? <div style={{ color: "#4b5563", fontSize: 13 }}>Sin datos</div> : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {Object.entries(panel.tiposEntrada).sort((a, b) => b[1] - a[1]).map(([tipo, count]) => (
                    <div key={tipo} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "#d1d5db", fontSize: 13 }}>{tipo}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ background: "#1a1f2e", borderRadius: 4, height: 6, width: 60, overflow: "hidden" }}>
                          <div style={{ background: "#3b82f6", height: "100%", width: `${(count / totalEntradas) * 100}%` }} />
                        </div>
                        <span style={{ color: "#fff", fontWeight: 700, fontSize: 12, minWidth: 16 }}>{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ background: "#111827", borderRadius: 12, padding: "16px 18px", border: "1px solid #1f2937" }}>
              <div style={{ color: "#9ca3af", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>🔥 Distribución urgencias</div>
              {Object.keys(panel.urgencias).length === 0 ? <div style={{ color: "#4b5563", fontSize: 13 }}>Sin datos</div> : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {Object.entries(panel.urgencias).map(([urg, count]) => {
                    const color = urg === "Alta" ? "#ef4444" : urg === "Media" ? "#f59e0b" : "#10b981";
                    return (
                      <div key={urg} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ background: color + "20", color, border: `1px solid ${color}40`, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{urg}</span>
                        <span style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
 
          {panel.jugadores.length > 0 && (
            <div style={{ background: "#111827", borderRadius: 12, padding: "16px 18px", border: "1px solid #1f2937", marginBottom: 16 }}>
              <div style={{ color: "#9ca3af", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>👤 Jugadores en su radar ({panel.jugadores.length})</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 }}>
                {panel.jugadores.map(j => (
                  <a key={j.id} href={`/jugadores/${encodeURIComponent(j.id)}`} style={{ background: "#1a1f2e", border: "1px solid #1f2937", borderRadius: 10, padding: "10px 12px", textDecoration: "none", display: "flex", alignItems: "center", gap: 10, transition: "border-color 0.15s" }}
                    onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.borderColor = "#374151"}
                    onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.borderColor = "#1f2937"}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #3b82f6, #2563eb)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, color: "#fff", flexShrink: 0 }}>
                      {j.apellidos?.[0]}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ color: "#fff", fontWeight: 700, fontSize: 12, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{j.apellidos}</div>
                      <div style={{ color: "#6b7280", fontSize: 11 }}>{j.equipoActual || "—"}</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
          <div style={{ color: "#6b7280", fontSize: 12, textAlign: "right" }}>
            Última actividad: <span style={{ color: "#9ca3af", fontWeight: 600 }}>{panel.ultimaActividad}</span>
          </div>
        </div>
      )}
    </div>
  );
}
 
export default function Rendimiento() {
  const [rol, setRol] = useState<Rol>("ojeador");
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [ojeadorId, setOjeadorId] = useState("");
  const [jugadores, setJugadores] = useState<JugadorData[]>([]);
  const [entradas, setEntradas] = useState<EntradaDiario[]>([]);
  const [loading, setLoading] = useState(true);
  const [ojeadoresRegistrados, setOjeadoresRegistrados] = useState<OjeadorRegistrado[]>([]);
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set());
  const [ojeadorSeleccionado, setOjeadorSeleccionado] = useState<string>("todos");
 
  useEffect(() => {
    const rolGuardado = (localStorage.getItem("scoutpro_rol") as Rol) || "ojeador";
    const nombre = localStorage.getItem("scoutpro_nombre") || "";
    const id = localStorage.getItem("scoutpro_ojeador_id") || "";
    setRol(rolGuardado);
    setNombreUsuario(nombre);
    setOjeadorId(id);
 
    if (rolGuardado === "ojeador" && id) setExpandidos(new Set([id]));
 
    // Cargar ojeadores: caché local primero, luego remoto
    const local = getOjeadoresLocal();
    if (local.length > 0) setOjeadoresRegistrados(local);
 
    fetchOjeadoresRemoto().then(remotos => {
      if (remotos.length > 0) {
        setOjeadoresRegistrados(remotos);
        saveOjeadoresLocal(remotos);
      }
    });
 
    Papa.parse(CSV_JUGADORES, {
      download: true, header: false, skipEmptyLines: false,
      complete: (result) => setJugadores(parseJugadores(result.data as string[][])),
    });
 
    Papa.parse(CSV_DIARIO, {
      download: true, header: false, skipEmptyLines: false,
      complete: (result) => { setEntradas(parseEntradas(result.data as string[][])); setLoading(false); },
      error: () => setLoading(false),
    });
  }, []);
 
  if (rol !== "admin" && rol !== "ojeador") {
    return (
      <div style={{ minHeight: "100vh", background: "#0f1117", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#9ca3af" }}>Acceso restringido</div>
        </div>
      </div>
    );
  }
 
  const paneles: { ojeador: OjeadorRegistrado; panel: PanelOjeador }[] = [];
 
  if (rol === "admin") {
    const ojeadoresAMostrar = ojeadorSeleccionado === "todos"
      ? ojeadoresRegistrados
      : ojeadoresRegistrados.filter(o => o.id === ojeadorSeleccionado);
    ojeadoresAMostrar.forEach(o => paneles.push({ ojeador: o, panel: calcularPanel(o.nombre, jugadores, entradas, o) }));
  } else {
    const miOjeador = ojeadoresRegistrados.find(o => o.id === ojeadorId);
    if (miOjeador) {
      paneles.push({ ojeador: miOjeador, panel: calcularPanel(miOjeador.nombre, jugadores, entradas, miOjeador) });
    } else if (nombreUsuario) {
      const fake: OjeadorRegistrado = { id: "me", nombre: nombreUsuario, email: "", telefono: "", password: "", fechaRegistro: "—" };
      paneles.push({ ojeador: fake, panel: calcularPanel(nombreUsuario, jugadores, entradas, fake) });
    }
  }
 
  function toggleExpandido(id: string) {
    setExpandidos(prev => {
      const nuevo = new Set(prev);
      if (nuevo.has(id)) nuevo.delete(id); else nuevo.add(id);
      return nuevo;
    });
  }
 
  return (
    <div style={{ minHeight: "100vh", background: "#0f1117", color: "#e5e7eb", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
 
        <div style={{ marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: "#fff" }}>
              {rol === "admin" ? "📊 Panel de ojeadores" : "📊 Mi panel de rendimiento"}
            </h1>
            <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 14 }}>
              {rol === "admin"
                ? `${ojeadoresRegistrados.length} ojeadores registrados en el sistema`
                : `Bienvenido, ${nombreUsuario || "Ojeador"}`}
            </p>
          </div>
          <a href="/jugadores" style={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 10, color: "#d1d5db", padding: "10px 18px", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
            ← Volver
          </a>
        </div>
 
        {rol === "admin" && ojeadoresRegistrados.length > 1 && (
          <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            <button onClick={() => setOjeadorSeleccionado("todos")} style={{
              background: ojeadorSeleccionado === "todos" ? "#3b82f6" : "#1a1f2e",
              border: `1px solid ${ojeadorSeleccionado === "todos" ? "#3b82f6" : "#1f2937"}`,
              borderRadius: 8, color: ojeadorSeleccionado === "todos" ? "#fff" : "#9ca3af",
              padding: "7px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer",
            }}>Todos ({ojeadoresRegistrados.length})</button>
            {ojeadoresRegistrados.map(o => (
              <button key={o.id} onClick={() => setOjeadorSeleccionado(o.id)} style={{
                background: ojeadorSeleccionado === o.id ? "#f59e0b20" : "#1a1f2e",
                border: `1px solid ${ojeadorSeleccionado === o.id ? "#f59e0b60" : "#1f2937"}`,
                borderRadius: 8, color: ojeadorSeleccionado === o.id ? "#f59e0b" : "#9ca3af",
                padding: "7px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}>👁️ {o.nombre}</button>
            ))}
          </div>
        )}
 
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#6b7280" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>Cargando datos...
          </div>
        ) : ojeadoresRegistrados.length === 0 && rol === "admin" ? (
          <div style={{ textAlign: "center", padding: 80, color: "#6b7280" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>👁️</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#9ca3af", marginBottom: 8 }}>Sin ojeadores registrados</div>
            <div style={{ fontSize: 14 }}>Los ojeadores que se registren en la plataforma aparecerán aquí</div>
          </div>
        ) : paneles.length === 0 ? (
          <div style={{ textAlign: "center", padding: 80, color: "#6b7280" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#9ca3af", marginBottom: 8 }}>Sin datos de rendimiento</div>
            <div style={{ fontSize: 14 }}>Completa tu perfil y empieza a añadir entradas al diario</div>
          </div>
        ) : (
          <>
            {rol === "admin" && ojeadoresRegistrados.length > 0 && ojeadorSeleccionado === "todos" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, marginBottom: 24 }}>
                {[
                  { label: "Ojeadores activos", value: ojeadoresRegistrados.length, icon: "👁️", color: "#f59e0b" },
                  { label: "Total informes", value: paneles.reduce((a, p) => a + p.panel.totalInformes, 0), icon: "📝", color: "#3b82f6" },
                  { label: "Jugadores analizados", value: paneles.reduce((a, p) => a + p.panel.jugadoresAnalizados, 0), icon: "👤", color: "#10b981" },
                  { label: "Zonas cubiertas", value: new Set(paneles.flatMap(p => p.panel.zonasGeograficas)).size, icon: "🌍", color: "#8b5cf6" },
                ].map(stat => (
                  <div key={stat.label} style={{ background: "#1a1f2e", border: `1px solid ${stat.color}20`, borderRadius: 12, padding: "16px 18px" }}>
                    <div style={{ fontSize: 22, marginBottom: 6 }}>{stat.icon}</div>
                    <div style={{ color: stat.color, fontSize: 24, fontWeight: 900 }}>{stat.value}</div>
                    <div style={{ color: "#6b7280", fontSize: 12, marginTop: 2 }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            )}
            {paneles.map(({ ojeador, panel }) => (
              <PanelOjeadorCard
                key={ojeador.id}
                panel={panel}
                expandido={expandidos.has(ojeador.id)}
                onToggle={() => toggleExpandido(ojeador.id)}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}