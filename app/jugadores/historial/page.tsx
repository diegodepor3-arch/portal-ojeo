"use client";
import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import Papa from "papaparse";

const SHEET_ID = "1Hh982i-Mx_ytjeAONBkJtWLu7N3AaEHGZRyqBw0DS5A";
const CSV_URL = (sheet: string) =>
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheet)}`;

type Informe = {
  fecha: string;
  nota: number;
  scout: string;
};

type Jugador = {
  id: string;
  nombre: string;
};

function parseJugadores(filas: string[][]): Jugador[] {
  let start = 0;
  for (let i = 0; i < filas.length; i++) {
    if (filas[i].join("").toLowerCase().includes("nombre")) { start = i + 1; break; }
  }
  return filas.slice(start)
    .filter(f => f[0]?.trim() && f[1]?.trim())
    .map(f => ({ id: f[0].trim(), nombre: f[1].trim() }));
}

function parseInformes(filas: string[][], jugadorNombre: string): Informe[] {
  let start = 0;
  for (let i = 0; i < filas.length; i++) {
    const row = filas[i].join(" ").toLowerCase();
    if (row.includes("fecha") && (row.includes("nota") || row.includes("valoracion"))) {
      start = i + 1; break;
    }
  }
  return filas.slice(start)
    .filter(f => {
      const nombre = (f[1] || f[2] || "").toLowerCase();
      return nombre.includes(jugadorNombre.toLowerCase()) && f[0]?.trim();
    })
    .map(f => ({
      fecha: f[0].trim(),
      nota: parseFloat(f[f.length - 2]) || parseFloat(f[f.length - 1]) || 0,
      scout: f[1]?.trim() || "—",
    }))
    .filter(i => i.nota > 0)
    .reverse();
}

export default function Historial() {
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [seleccionado, setSeleccionado] = useState<Jugador | null>(null);
  const [informes, setInformes] = useState<Informe[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(false);
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    setMontado(true);
    Papa.parse(CSV_URL("Jugadores"), {
      download: true, header: false, skipEmptyLines: false,
      complete: (r) => setJugadores(parseJugadores(r.data as string[][])),
    });
  }, []);

  function cargarHistorial(jugador: Jugador) {
    setSeleccionado(jugador);
    setLoading(true);
    Papa.parse(CSV_URL("Informes"), {
      download: true, header: false, skipEmptyLines: false,
      complete: (r) => {
        setInformes(parseInformes(r.data as string[][], jugador.nombre));
        setLoading(false);
      },
      error: () => setLoading(false),
    });
  }

  const filtrados = jugadores.filter(j =>
    j.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const tendencia = informes.length >= 2
    ? informes[informes.length - 1].nota - informes[0].nota
    : 0;

  if (!montado) return null;

  return (
    <div style={{ minHeight: "100vh", background: "#0f1117", color: "#e5e7eb", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: "#fff" }}>📈 Historial de evolución</h1>
          <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 14 }}>
            Evolución de la nota por jugador informe a informe
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 24 }}>

          {/* Lista jugadores */}
          <div>
            <input
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="🔍 Buscar jugador..."
              style={{
                width: "100%", boxSizing: "border-box",
                background: "#1a1f2e", border: "1px solid #1f2937",
                borderRadius: 10, padding: "10px 14px",
                color: "#fff", fontSize: 14, outline: "none", marginBottom: 12,
              }}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 600, overflowY: "auto" }}>
              {filtrados.map(j => (
                <div
                  key={j.id}
                  onClick={() => cargarHistorial(j)}
                  style={{
                    background: seleccionado?.id === j.id ? "#1d4ed8" : "#1a1f2e",
                    border: `1px solid ${seleccionado?.id === j.id ? "#3b82f6" : "#1f2937"}`,
                    borderRadius: 10, padding: "10px 14px", cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 14, color: "#fff" }}>{j.nombre}</div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>{j.id}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Gráfico */}
          <div>
            {!seleccionado ? (
              <div style={{ background: "#1a1f2e", border: "1px solid #1f2937", borderRadius: 16, padding: 60, textAlign: "center", color: "#6b7280" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>👈</div>
                Selecciona un jugador para ver su evolución
              </div>
            ) : loading ? (
              <div style={{ background: "#1a1f2e", border: "1px solid #1f2937", borderRadius: 16, padding: 60, textAlign: "center", color: "#6b7280" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
                Cargando historial...
              </div>
            ) : informes.length === 0 ? (
              <div style={{ background: "#1a1f2e", border: "1px solid #1f2937", borderRadius: 16, padding: 60, textAlign: "center", color: "#6b7280" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                No hay informes con nota para {seleccionado.nombre}
              </div>
            ) : (
              <div>
                {/* Stats */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
                  {[
                    { label: "Informes", value: informes.length, icon: "📋" },
                    { label: "Última nota", value: informes[informes.length - 1].nota.toFixed(1), icon: "⭐" },
                    {
                      label: "Tendencia",
                      value: tendencia > 0 ? `+${tendencia.toFixed(1)} ↑` : tendencia < 0 ? `${tendencia.toFixed(1)} ↓` : "= Estable",
                      icon: tendencia > 0 ? "🚀" : tendencia < 0 ? "📉" : "➡️",
                      color: tendencia > 0 ? "#10b981" : tendencia < 0 ? "#ef4444" : "#f59e0b",
                    },
                  ].map(s => (
                    <div key={s.label} style={{ background: "#1a1f2e", border: "1px solid #1f2937", borderRadius: 12, padding: "16px 20px" }}>
                      <div style={{ color: "#6b7280", fontSize: 12, marginBottom: 4 }}>{s.icon} {s.label}</div>
                      <div style={{ fontSize: 22, fontWeight: 900, color: (s as any).color || "#fff" }}>{s.value}</div>
                    </div>
                  ))}
                </div>

                {/* Gráfico */}
                <div style={{ background: "#1a1f2e", border: "1px solid #1f2937", borderRadius: 16, padding: "24px 16px" }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 20, paddingLeft: 8 }}>
                    {seleccionado.nombre} — Evolución de nota
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={informes}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                      <XAxis dataKey="fecha" tick={{ fill: "#6b7280", fontSize: 11 }} />
                      <YAxis domain={[0, 10]} tick={{ fill: "#6b7280", fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 8, color: "#fff" }}
                        labelStyle={{ color: "#9ca3af" }}
                      />
                      <Legend />
                      <Line
                        type="monotone" dataKey="nota" name="Nota"
                        stroke="#3b82f6" strokeWidth={3}
                        dot={{ fill: "#3b82f6", r: 5 }}
                        activeDot={{ r: 7 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Tabla */}
                <div style={{ background: "#1a1f2e", border: "1px solid #1f2937", borderRadius: 16, overflow: "hidden", marginTop: 16 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#111827" }}>
                        {["Fecha", "Scout", "Nota"].map(h => (
                          <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[...informes].reverse().map((inf, i) => (
                        <tr key={i} style={{ borderTop: "1px solid #1f2937" }}>
                          <td style={{ padding: "10px 16px", fontSize: 13, color: "#9ca3af" }}>{inf.fecha}</td>
                          <td style={{ padding: "10px 16px", fontSize: 13, color: "#d1d5db" }}>{inf.scout}</td>
                          <td style={{ padding: "10px 16px" }}>
                            <span style={{
                              background: inf.nota >= 7 ? "#10b98120" : inf.nota >= 5 ? "#f59e0b20" : "#ef444420",
                              color: inf.nota >= 7 ? "#10b981" : inf.nota >= 5 ? "#f59e0b" : "#ef4444",
                              border: `1px solid ${inf.nota >= 7 ? "#10b98140" : inf.nota >= 5 ? "#f59e0b40" : "#ef444440"}`,
                              borderRadius: 6, padding: "3px 10px", fontSize: 13, fontWeight: 700,
                            }}>{inf.nota.toFixed(1)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}