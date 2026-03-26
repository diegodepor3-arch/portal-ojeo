"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Papa from "papaparse";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip, Legend
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
  pais: string;
  pie: string;
  notaScout: string;
  potencial: string;
  notaFisica: string;
  notaTactica: string;
  scoringScout: string;
  altura: string;
  categoria: string;
};
 
const COLORES = ["#3b82f6", "#10b981", "#f59e0b"];
 
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
      edad: get(8), pais: get(9), pie: get(11),
      altura: get(12), notaScout: get(16),
      potencial: get(17), notaFisica: get(18),
      notaTactica: get(19), scoringScout: get(15),
      categoria: get(20),
    });
  }
  return result.filter(j => j.apellidos || j.nombre);
}
 
function getRadarData(jugadores: Jugador[]) {
  const attrs = ["Técnica", "Velocidad", "Táctica", "Físico", "Mental", "Potencial"];
  return attrs.map(attr => {
    const entry: Record<string, string | number> = { attr };
    jugadores.forEach((j, i) => {
      const vals: Record<string, number> = {
        "Técnica": parseFloat(j.scoringScout) || 6,
        "Velocidad": parseFloat(j.notaFisica) || 6,
        "Táctica": parseFloat(j.notaTactica) || 6,
        "Físico": parseFloat(j.notaFisica) || 6,
        "Mental": parseFloat(j.potencial) || 6,
        "Potencial": parseFloat(j.potencial) || 6,
      };
      entry[`jugador${i}`] = vals[attr];
    });
    return entry;
  });
}
 
function NotaColor({ nota }: { nota: string }) {
  const n = parseFloat(nota);
  if (isNaN(n)) return <span style={{ color: "#6b7280" }}>—</span>;
  const color = n >= 8 ? "#10b981" : n >= 6 ? "#f59e0b" : "#ef4444";
  return <span style={{ color, fontWeight: 700 }}>{nota}</span>;
}

// ✅ Componente interno que usa useSearchParams
function ComparadorContent() {
  const searchParams = useSearchParams();
  const [todos, setTodos] = useState<Jugador[]>([]);
  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
 
  useEffect(() => {
    Papa.parse(CSV_URL, {
      download: true, header: true, skipEmptyLines: true,
      complete: (result) => {
        const filas = result.data as Record<string, string>[];
        const jugadores = parseJugadores(filas);
        setTodos(jugadores);
        const a = searchParams.get("a");
        if (a) setSeleccionados([a]);
        setLoading(false);
      },
      error: () => setLoading(false),
    });
  }, []);
 
  const jugadoresSeleccionados = seleccionados
    .map(id => todos.find(j => j.id === id))
    .filter(Boolean) as Jugador[];
 
  const radarData = getRadarData(jugadoresSeleccionados);
 
  function toggleJugador(id: string) {
    setSeleccionados(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  }
 
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
        <span style={{ color: "#6b7280", fontSize: 13 }}>{seleccionados.length}/3 jugadores</span>
      </header>
 
      <main style={{ padding: "32px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fff", margin: 0 }}>⚖️ Comparador</h1>
          <p style={{ color: "#6b7280", margin: "4px 0 0", fontSize: 14 }}>
            Selecciona hasta 3 jugadores para comparar sus radares
          </p>
        </div>
 
        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 24 }}>
          {/* LISTA JUGADORES */}
          <div style={{ background: "#1a1f2e", border: "1px solid #1f2937", borderRadius: 14, padding: 20, height: "fit-content" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Jugadores
            </h3>
            {loading ? (
              <div style={{ color: "#6b7280", textAlign: "center", padding: 20 }}>⏳ Cargando...</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 500, overflowY: "auto" }}>
                {todos.map(j => {
                  const idx = seleccionados.indexOf(j.id);
                  const seleccionado = idx !== -1;
                  const color = seleccionado ? COLORES[idx] : "#374151";
                  return (
                    <div
                      key={j.id}
                      onClick={() => toggleJugador(j.id)}
                      style={{
                        background: seleccionado ? color + "20" : "#111827",
                        border: `1px solid ${color}`,
                        borderRadius: 8,
                        padding: "10px 14px",
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      <div style={{ fontWeight: 600, color: "#fff", fontSize: 14 }}>
                        {seleccionado && <span style={{ color, marginRight: 6 }}>●</span>}
                        {j.apellidos} {j.nombre}
                      </div>
                      <div style={{ color: "#6b7280", fontSize: 12, marginTop: 2 }}>
                        {j.posicion || "—"} · {j.equipoActual || "—"}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
 
          {/* PANEL COMPARACIÓN */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {jugadoresSeleccionados.length === 0 ? (
              <div style={{
                background: "#1a1f2e", border: "1px dashed #374151",
                borderRadius: 14, padding: 60,
                textAlign: "center", color: "#6b7280",
              }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>⚖️</div>
                <div style={{ fontSize: 16 }}>Selecciona jugadores de la lista para comparar</div>
              </div>
            ) : (
              <>
                {/* TARJETAS */}
                <div style={{ display: "grid", gridTemplateColumns: `repeat(${jugadoresSeleccionados.length}, 1fr)`, gap: 16 }}>
                  {jugadoresSeleccionados.map((j, i) => (
                    <div key={j.id} style={{
                      background: "#1a1f2e",
                      border: `1px solid ${COLORES[i]}`,
                      borderRadius: 14, padding: 20,
                      position: "relative",
                    }}>
                      <button
                        onClick={() => toggleJugador(j.id)}
                        style={{
                          position: "absolute", top: 12, right: 12,
                          background: "none", border: "none",
                          color: "#6b7280", cursor: "pointer", fontSize: 16,
                        }}
                      >✕</button>
                      <div style={{
                        width: 48, height: 48, borderRadius: "50%",
                        background: COLORES[i],
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 20, fontWeight: 900, color: "#fff",
                        marginBottom: 12,
                      }}>
                        {j.apellidos?.[0]}
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>{j.apellidos}</div>
                      <div style={{ color: "#9ca3af", fontSize: 13 }}>{j.nombre}</div>
                      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                        {[
                          { label: "Club", value: j.equipoActual },
                          { label: "Posición", value: j.posicion },
                          { label: "Edad", value: j.edad },
                          { label: "País", value: j.pais },
                          { label: "Pie", value: j.pie },
                        ].map(row => (
                          <div key={row.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, borderBottom: "1px solid #1f2937", paddingBottom: 6 }}>
                            <span style={{ color: "#6b7280" }}>{row.label}</span>
                            <span style={{ color: "#fff", fontWeight: 600 }}>{row.value || "—"}</span>
                          </div>
                        ))}
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                          <span style={{ color: "#6b7280" }}>Nota Scout</span>
                          <NotaColor nota={j.notaScout} />
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                          <span style={{ color: "#6b7280" }}>Potencial</span>
                          <NotaColor nota={j.potencial} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
 
                {/* RADAR COMPARATIVO */}
                {jugadoresSeleccionados.length >= 2 && (
                  <div style={{ background: "#1a1f2e", border: "1px solid #1f2937", borderRadius: 14, padding: 24 }}>
                    <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      📊 Radar comparativo
                    </h3>
                    <ResponsiveContainer width="100%" height={350}>
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="#1f2937" />
                        <PolarAngleAxis dataKey="attr" tick={{ fill: "#9ca3af", fontSize: 12 }} />
                        {jugadoresSeleccionados.map((j, i) => (
                          <Radar
                            key={j.id}
                            name={`${j.apellidos} ${j.nombre}`}
                            dataKey={`jugador${i}`}
                            stroke={COLORES[i]}
                            fill={COLORES[i]}
                            fillOpacity={0.15}
                            strokeWidth={2}
                          />
                        ))}
                        <Legend wrapperStyle={{ color: "#9ca3af", fontSize: 13 }} />
                        <Tooltip
                          contentStyle={{ background: "#1a1f2e", border: "1px solid #374151", borderRadius: 8 }}
                          labelStyle={{ color: "#fff" }}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                )}
 
                {jugadoresSeleccionados.length === 1 && (
                  <div style={{
                    background: "#1a1f2e", border: "1px dashed #374151",
                    borderRadius: 14, padding: 30, textAlign: "center", color: "#6b7280",
                  }}>
                    Selecciona otro jugador para ver el radar comparativo
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// ✅ Export por defecto con Suspense envolviendo el componente interno
export default function Comparador() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#0f1117", color: "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center" }}>⏳ Cargando...</div>}>
      <ComparadorContent />
    </Suspense>
  );
}