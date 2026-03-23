"use client";
import { useEffect, useState } from "react";
import Papa from "papaparse";
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Label
} from "recharts";
 
const SHEET_ID = "1Hh982i-Mx_ytjeAONBkJtWLu7N3AaEHGZRyqBw0DS5A";
const SHEET_NAME = "Jugadores";
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}`;
 
type Jugador = {
  id: string;
  apellidos: string;
  nombre: string;
  posicion: string;
  equipoActual: string;
  edad: string;
  notaScout: string;
  potencial: string;
  pais: string;
};
 
const POSICION_COLORES: Record<string, string> = {
  Portero: "#f59e0b",
  Defensa: "#3b82f6",
  Centrocampista: "#10b981",
  Delantero: "#ef4444",
  Lateral: "#8b5cf6",
};
 
function getPosColor(pos: string) {
  for (const key of Object.keys(POSICION_COLORES)) {
    if (pos?.toLowerCase().includes(key.toLowerCase())) return POSICION_COLORES[key];
  }
  return "#6b7280";
}
 
function parseEdad(edad: string): number {
  const match = edad?.match(/\d+/);
  return match ? parseInt(match[0]) : 0;
}
 
function parseJugadores(filas: Record<string, string>[]): Jugador[] {
  let dataStart = 0;
  for (let i = 0; i < filas.length; i++) {
    const vals = Object.values(filas[i]).join(" ").toLowerCase();
    if (vals.includes("apellidos") || vals.includes("id")) {
      dataStart = i + 1;
      break;
    }
  }
  const result: Jugador[] = [];
  for (let i = dataStart; i < filas.length; i++) {
    const vals = Object.values(filas[i]);
    if (vals.every(v => !v || v.toString().trim() === "")) continue;
    const get = (idx: number) => vals[idx]?.toString().trim() || "";
    result.push({
      id: get(1), apellidos: get(2), nombre: get(3),
      posicion: get(4), equipoActual: get(6),
      edad: get(8), pais: get(9),
      notaScout: get(16), potencial: get(17),
    });
  }
  return result.filter(j => j.apellidos || j.nombre);
}
 
// Posiciones en el campo
const ZONAS_CAMPO: Record<string, { x: number; y: number }> = {
  portero: { x: 50, y: 88 },
  defensa: { x: 50, y: 72 },
  lateral: { x: 20, y: 70 },
  centrocampista: { x: 50, y: 50 },
  mediapunta: { x: 50, y: 38 },
  extremo: { x: 15, y: 35 },
  delantero: { x: 50, y: 18 },
};
 
function getPosicionCampo(pos: string): { x: number; y: number } {
  const p = pos?.toLowerCase() || "";
  for (const [key, coords] of Object.entries(ZONAS_CAMPO)) {
    if (p.includes(key)) return coords;
  }
  return { x: 50, y: 50 };
}
 
function CampoPosicionamiento({ jugadores }: { jugadores: Jugador[] }) {
  const [hover, setHover] = useState<Jugador | null>(null);
 
  // Agrupar jugadores por zona
  const porZona: Record<string, Jugador[]> = {};
  jugadores.forEach(j => {
    const zona = j.posicion?.toLowerCase() || "otro";
    if (!porZona[zona]) porZona[zona] = [];
    porZona[zona].push(j);
  });
 
  return (
    <div style={{ position: "relative", width: "100%", maxWidth: 420, margin: "0 auto" }}>
      {/* Campo SVG */}
      <svg viewBox="0 0 420 600" style={{ width: "100%", borderRadius: 12, display: "block" }}>
        {/* Fondo verde */}
        <rect x="20" y="20" width="380" height="560" rx="8" fill="#14532d" />
        {/* Líneas del campo */}
        <rect x="20" y="20" width="380" height="560" rx="8" fill="none" stroke="#16a34a" strokeWidth="2" />
        {/* Línea central */}
        <line x1="20" y1="300" x2="400" y2="300" stroke="#16a34a" strokeWidth="1.5" />
        {/* Círculo central */}
        <circle cx="210" cy="300" r="60" fill="none" stroke="#16a34a" strokeWidth="1.5" />
        <circle cx="210" cy="300" r="3" fill="#16a34a" />
        {/* Área grande arriba */}
        <rect x="95" y="20" width="230" height="100" fill="none" stroke="#16a34a" strokeWidth="1.5" />
        {/* Área pequeña arriba */}
        <rect x="150" y="20" width="120" height="45" fill="none" stroke="#16a34a" strokeWidth="1.5" />
        {/* Área grande abajo */}
        <rect x="95" y="480" width="230" height="100" fill="none" stroke="#16a34a" strokeWidth="1.5" />
        {/* Área pequeña abajo */}
        <rect x="150" y="535" width="120" height="45" fill="none" stroke="#16a34a" strokeWidth="1.5" />
 
        {/* Jugadores */}
        {jugadores.map((j, idx) => {
          const base = getPosicionCampo(j.posicion);
          // Separar jugadores de la misma posición
          const zona = j.posicion?.toLowerCase() || "otro";
          const grupo = porZona[zona] || [];
          const posEnGrupo = grupo.indexOf(j);
          const total = grupo.length;
          const offset = total > 1 ? (posEnGrupo - (total - 1) / 2) * 14 : 0;
          const cx = (base.x / 100) * 380 + 20 + offset;
          const cy = (base.y / 100) * 560 + 20;
          const color = getPosColor(j.posicion);
          const isHover = hover?.id === j.id;
 
          return (
            <g key={j.id}
              style={{ cursor: "pointer" }}
              onMouseEnter={() => setHover(j)}
              onMouseLeave={() => setHover(null)}
              onClick={() => window.location.href = `/jugadores/${j.id}`}
            >
              <circle cx={cx} cy={cy} r={isHover ? 18 : 14}
                fill={color} stroke="#fff" strokeWidth={isHover ? 3 : 2}
                style={{ transition: "all 0.15s" }}
              />
              <text x={cx} y={cy + 5} textAnchor="middle"
                fontSize={isHover ? 9 : 8} fill="#fff" fontWeight="700"
              >
                {j.apellidos?.substring(0, 6) || "?"}
              </text>
            </g>
          );
        })}
      </svg>
 
      {/* Tooltip hover */}
      {hover && (
        <div style={{
          position: "absolute", top: 10, right: -10,
          background: "#1a1f2e", border: "1px solid #374151",
          borderRadius: 10, padding: "12px 16px",
          minWidth: 160, pointerEvents: "none",
          boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
        }}>
          <div style={{ fontWeight: 700, color: "#fff", fontSize: 14 }}>{hover.apellidos} {hover.nombre}</div>
          <div style={{ color: "#9ca3af", fontSize: 12, marginTop: 4 }}>{hover.posicion || "—"}</div>
          <div style={{ color: "#9ca3af", fontSize: 12 }}>{hover.equipoActual || "—"}</div>
          {hover.notaScout && (
            <div style={{ marginTop: 8, fontSize: 13 }}>
              Nota: <span style={{ color: "#10b981", fontWeight: 700 }}>{hover.notaScout}</span>
            </div>
          )}
        </div>
      )}
 
      {/* Leyenda */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16, justifyContent: "center" }}>
        {Object.entries(POSICION_COLORES).map(([pos, color]) => (
          <div key={pos} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#9ca3af" }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />
            {pos}
          </div>
        ))}
      </div>
    </div>
  );
}
 
function CustomDot(props: any) {
  const { cx, cy, payload } = props;
  const color = getPosColor(payload.posicion);
  return (
    <circle
      cx={cx} cy={cy} r={8}
      fill={color} stroke="#fff" strokeWidth={2}
      style={{ cursor: "pointer" }}
      onClick={() => window.location.href = `/jugadores/${payload.id}`}
    />
  );
}
 
function CustomTooltipScatter({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div style={{
      background: "#1a1f2e", border: "1px solid #374151",
      borderRadius: 10, padding: "12px 16px",
    }}>
      <div style={{ fontWeight: 700, color: "#fff" }}>{d.apellidos} {d.nombre}</div>
      <div style={{ color: "#9ca3af", fontSize: 12, marginTop: 4 }}>{d.posicion} · {d.equipoActual}</div>
      <div style={{ marginTop: 8, fontSize: 13, display: "flex", gap: 16 }}>
        <span style={{ color: "#9ca3af" }}>Edad: <span style={{ color: "#fff", fontWeight: 600 }}>{d.edadNum}</span></span>
        <span style={{ color: "#9ca3af" }}>Nota: <span style={{ color: "#10b981", fontWeight: 700 }}>{d.nota}</span></span>
      </div>
    </div>
  );
}
 
export default function Analisis() {
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [loading, setLoading] = useState(true);
  const [vista, setVista] = useState<"scatter" | "campo">("scatter");
 
  useEffect(() => {
    Papa.parse(CSV_URL, {
      download: true, header: true, skipEmptyLines: true,
      complete: (result) => {
        const filas = result.data as Record<string, string>[];
        setJugadores(parseJugadores(filas));
        setLoading(false);
      },
      error: () => setLoading(false),
    });
  }, []);
 
  const scatterData = jugadores
    .map(j => ({
      ...j,
      edadNum: parseEdad(j.edad),
      nota: parseFloat(j.notaScout) || 0,
    }))
    .filter(j => j.edadNum > 0 && j.nota > 0);
 
  return (
    <div style={{ minHeight: "100vh", background: "#0f1117", color: "#e5e7eb", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* HEADER */}
      <header style={{
        background: "#1a1f2e", borderBottom: "1px solid #1f2937",
        padding: "0 32px", height: 64,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <a href="/jugadores" style={{ color: "#9ca3af", textDecoration: "none", fontSize: 14 }}>← Volver</a>
        <span style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>
          Scout<span style={{ color: "#3b82f6" }}>Pro</span>
        </span>
        <a href="/comparador" style={{
          background: "#1f2937", border: "1px solid #374151",
          color: "#d1d5db", borderRadius: 8, padding: "7px 14px",
          fontSize: 13, textDecoration: "none", fontWeight: 600,
        }}>⚖️ Comparador</a>
      </header>
 
      <main style={{ padding: "32px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ marginBottom: 28, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fff", margin: 0 }}>📈 Análisis Visual</h1>
            <p style={{ color: "#6b7280", margin: "4px 0 0", fontSize: 14 }}>
              Visualiza tu plantilla de forma inteligente
            </p>
          </div>
          {/* Tabs */}
          <div style={{ display: "flex", background: "#1a1f2e", border: "1px solid #1f2937", borderRadius: 10, padding: 4, gap: 4 }}>
            {[
              { key: "scatter", label: "📊 Edad vs Nota" },
              { key: "campo", label: "🏟️ Campo" },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setVista(tab.key as "scatter" | "campo")}
                style={{
                  background: vista === tab.key ? "#3b82f6" : "transparent",
                  color: vista === tab.key ? "#fff" : "#9ca3af",
                  border: "none", borderRadius: 8,
                  padding: "8px 18px", fontSize: 13, fontWeight: 600,
                  cursor: "pointer", transition: "all 0.15s",
                }}
              >{tab.label}</button>
            ))}
          </div>
        </div>
 
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#6b7280" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
            Cargando datos...
          </div>
        ) : (
          <>
            {vista === "scatter" && (
              <div style={{ background: "#1a1f2e", border: "1px solid #1f2937", borderRadius: 14, padding: 28 }}>
                <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 700, color: "#fff" }}>
                  Edad vs Rendimiento
                </h3>
                <p style={{ color: "#6b7280", fontSize: 13, margin: "0 0 24px" }}>
                  Cada punto es un jugador. Haz clic para ver su ficha.
                </p>
 
                {scatterData.length === 0 ? (
                  <div style={{ textAlign: "center", padding: 40, color: "#6b7280" }}>
                    Añade jugadores con edad y nota en tu Google Sheet para ver el gráfico
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 20 }}>
                      <CartesianGrid stroke="#1f2937" />
                      <XAxis
                        type="number" dataKey="edadNum"
                        domain={["auto", "auto"]}
                        tick={{ fill: "#9ca3af", fontSize: 12 }}
                        stroke="#374151"
                      >
                        <Label value="Edad" offset={-10} position="insideBottom" fill="#6b7280" fontSize={13} />
                      </XAxis>
                      <YAxis
                        type="number" dataKey="nota"
                        domain={[0, 10]}
                        tick={{ fill: "#9ca3af", fontSize: 12 }}
                        stroke="#374151"
                      >
                        <Label value="Nota Scout" angle={-90} position="insideLeft" fill="#6b7280" fontSize={13} />
                      </YAxis>
                      <Tooltip content={<CustomTooltipScatter />} />
                      <Scatter data={scatterData} shape={<CustomDot />} />
                    </ScatterChart>
                  </ResponsiveContainer>
                )}
 
                {/* Leyenda posiciones */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 16, justifyContent: "center" }}>
                  {Object.entries(POSICION_COLORES).map(([pos, color]) => (
                    <div key={pos} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#9ca3af" }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />
                      {pos}
                    </div>
                  ))}
                </div>
              </div>
            )}
 
            {vista === "campo" && (
              <div style={{ background: "#1a1f2e", border: "1px solid #1f2937", borderRadius: 14, padding: 28 }}>
                <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 700, color: "#fff" }}>
                  Campo de posicionamiento
                </h3>
                <p style={{ color: "#6b7280", fontSize: 13, margin: "0 0 24px" }}>
                  Tus jugadores distribuidos por posición. Pasa el ratón para ver detalles. Haz clic para abrir la ficha.
                </p>
                <CampoPosicionamiento jugadores={jugadores} />
              </div>
            )}
          </>
        )}
 
        {/* Resumen estadístico */}
        {!loading && jugadores.length > 0 && (
          <div style={{
            marginTop: 24,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 16,
          }}>
            {[
              { label: "Total jugadores", value: jugadores.length, icon: "👤" },
              {
                label: "Edad media",
                value: (jugadores.reduce((s, j) => s + parseEdad(j.edad), 0) / jugadores.filter(j => parseEdad(j.edad) > 0).length || 0).toFixed(1) + " años",
                icon: "📅"
              },
              {
                label: "Nota media",
                value: (jugadores.reduce((s, j) => s + (parseFloat(j.notaScout) || 0), 0) / jugadores.filter(j => parseFloat(j.notaScout) > 0).length || 0).toFixed(1),
                icon: "⭐"
              },
              {
                label: "Posiciones",
                value: new Set(jugadores.map(j => j.posicion).filter(Boolean)).size,
                icon: "🏟️"
              },
            ].map(s => (
              <div key={s.label} style={{
                background: "#1a1f2e", border: "1px solid #1f2937",
                borderRadius: 12, padding: "18px 20px",
              }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>{s.value}</div>
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
 