"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";

type Entrenador = {
  id: string;
  user_id: string;
  apellidos: string;
  nombre: string;
  estilo_principal: string;
  estilo_secundario: string;
  intensidad_presion: string;
  perfil_gestion: string;
  sub_perfil: string;
  formacion_preferida: string;
  formacion_alternativa: string;
  pj: string;
  v: string;
  e: string;
  d: string;
  ppp: string;
  pct_victorias: string;
  valoracion: string;
  estado: string;
  notas: string;
  mapa_mercado: string;
  perfil_mediatico: string;
  created_at: string;
};

const ESTILO_COLORES: Record<string, string> = {
  "Posesión": "#3b82f6",
  "Presión alta": "#ef4444",
  "Contraataque": "#f59e0b",
  "Juego directo": "#10b981",
  "Híbrido": "#8b5cf6",
  "Flexible": "#06b6d4",
};

function getEstiloColor(estilo: string) {
  if (!estilo) return "#6b7280";
  for (const key of Object.keys(ESTILO_COLORES)) {
    if (estilo.toLowerCase().includes(key.toLowerCase())) return ESTILO_COLORES[key];
  }
  return "#6b7280";
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ background: "#111827", borderRadius: 8, padding: "10px 14px", border: "1px solid #1f2937" }}>
      <div style={{ color: "#6b7280", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>{label}</div>
      <div style={{ color: color || "#fff", fontWeight: 700, fontSize: 14 }}>{value || "—"}</div>
    </div>
  );
}

export default function Entrenadores() {
  const { user, perfil } = useAuth();
  const [entrenadores, setEntrenadores] = useState<Entrenador[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstilo, setFiltroEstilo] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [seleccionado, setSeleccionado] = useState<Entrenador | null>(null);

  async function cargar() {
    setLoading(true);

    const esAdmin = perfil?.rol === "admin" || perfil?.rol === "director";

    let query = supabase
      .from("entrenadores")
      .select("*")
      .order("created_at", { ascending: false });

    if (!esAdmin) {
      query = query.eq("user_id", user!.id);
    }

    const { data, error } = await query;
    if (!error && data) setEntrenadores(data as Entrenador[]);
    setLoading(false);
  }

  useEffect(() => {
    if (user && perfil !== undefined) cargar();
  }, [user, perfil]);

  const estilos = [...new Set(entrenadores.map(e => e.estilo_principal).filter(Boolean))];
  const estados = [...new Set(entrenadores.map(e => e.estado).filter(Boolean))];

  const filtrados = entrenadores.filter(e => {
    const texto = busqueda.toLowerCase();
    const coincideTexto = !busqueda ||
      `${e.apellidos} ${e.nombre}`.toLowerCase().includes(texto) ||
      (e.estilo_principal || "").toLowerCase().includes(texto);
    return (
      coincideTexto &&
      (!filtroEstilo || e.estilo_principal === filtroEstilo) &&
      (!filtroEstado || e.estado === filtroEstado)
    );
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

  if (seleccionado) {
    const nota = parseFloat(seleccionado.valoracion);
    const colorNota = isNaN(nota) ? "#6b7280" : nota >= 8 ? "#10b981" : nota >= 6 ? "#f59e0b" : "#ef4444";

    return (
      <div style={{ minHeight: "100vh", background: "#0f1117", color: "#e5e7eb", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
          <button onClick={() => setSeleccionado(null)} style={{
            background: "#1f2937", border: "1px solid #374151",
            color: "#d1d5db", borderRadius: 8, padding: "8px 16px",
            fontSize: 14, cursor: "pointer", marginBottom: 24,
          }}>← Volver</button>

          <div style={{
            background: "linear-gradient(135deg, #1a1f2e, #111827)",
            border: "1px solid #1f2937", borderRadius: 16,
            padding: "28px 32px", marginBottom: 24,
            display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap",
          }}>
            <div style={{
              width: 80, height: 80, borderRadius: "50%",
              background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 32, fontWeight: 900, color: "#fff",
            }}>
              {seleccionado.apellidos?.[0] || "?"}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 26, fontWeight: 900, color: "#fff" }}>
                {seleccionado.apellidos}, {seleccionado.nombre}
              </div>
              <div style={{ color: "#9ca3af", fontSize: 14, marginTop: 4, display: "flex", gap: 16, flexWrap: "wrap" }}>
                {seleccionado.estado && (
                  <span style={{
                    background: "#10b98120", color: "#10b981",
                    border: "1px solid #10b98140",
                    borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 600,
                  }}>{seleccionado.estado}</span>
                )}
              </div>
            </div>
            {seleccionado.valoracion && (
              <div style={{ textAlign: "center" }}>
                <div style={{
                  width: 72, height: 72, borderRadius: "50%",
                  border: `3px solid ${colorNota}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 24, fontWeight: 900, color: colorNota,
                  background: colorNota + "15",
                }}>{seleccionado.valoracion}</div>
                <div style={{ fontSize: 11, color: "#6b7280", marginTop: 6, textTransform: "uppercase" }}>Valoración</div>
              </div>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: "#1a1f2e", border: "1px solid #1f2937", borderRadius: 14, padding: 24 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.05em" }}>⚽ Estilo de juego</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <Stat label="Estilo principal" value={seleccionado.estilo_principal} color={getEstiloColor(seleccionado.estilo_principal)} />
                <Stat label="Estilo secundario" value={seleccionado.estilo_secundario} />
                <Stat label="Intensidad presión" value={seleccionado.intensidad_presion} />
                <Stat label="Formación preferida" value={seleccionado.formacion_preferida} color="#3b82f6" />
                <Stat label="Formación alternativa" value={seleccionado.formacion_alternativa} />
              </div>
            </div>

            <div style={{ background: "#1a1f2e", border: "1px solid #1f2937", borderRadius: 14, padding: 24 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.05em" }}>📊 KPIs de rendimiento</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Stat label="Partidos jugados" value={seleccionado.pj} />
                <Stat label="Victorias" value={seleccionado.v} color="#10b981" />
                <Stat label="Empates" value={seleccionado.e} color="#f59e0b" />
                <Stat label="Derrotas" value={seleccionado.d} color="#ef4444" />
                <Stat label="PPP" value={seleccionado.ppp} />
                <Stat label="% Victorias" value={seleccionado.pct_victorias} color="#3b82f6" />
              </div>
            </div>

            <div style={{ background: "#1a1f2e", border: "1px solid #1f2937", borderRadius: 14, padding: 24 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.05em" }}>🧠 Perfil de gestión</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <Stat label="Perfil gestión" value={seleccionado.perfil_gestion} />
                <Stat label="Sub-perfil" value={seleccionado.sub_perfil} />
              </div>
            </div>

            {seleccionado.notas && (
              <div style={{ background: "#1a1f2e", border: "1px solid #1f2937", borderRadius: 14, padding: 24 }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.05em" }}>📝 Notas</h3>
                <div style={{ background: "#111827", borderRadius: 8, padding: "14px 16px", border: "1px solid #1f2937", color: "#d1d5db", fontSize: 14, lineHeight: 1.6 }}>
                  {seleccionado.notas}
                </div>
              </div>
            )}

            {seleccionado.mapa_mercado && (
              <div style={{ background: "#1a1f2e", border: "1px solid #1f2937", borderRadius: 14, padding: 24 }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.05em" }}>🗺️ Mapa de mercado</h3>
                <div style={{ background: "#111827", borderRadius: 8, padding: "14px 16px", border: "1px solid #1f2937", color: "#d1d5db", fontSize: 14, lineHeight: 1.6 }}>
                  {seleccionado.mapa_mercado}
                </div>
              </div>
            )}

            {seleccionado.perfil_mediatico && (
              <div style={{ background: "#1a1f2e", border: "1px solid #1f2937", borderRadius: 14, padding: 24 }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.05em" }}>📰 Perfil mediático</h3>
                <div style={{ background: "#111827", borderRadius: 8, padding: "14px 16px", border: "1px solid #1f2937", color: "#d1d5db", fontSize: 14, lineHeight: 1.6 }}>
                  {seleccionado.perfil_mediatico}
                </div>
              </div>
            )}

            <div style={{ background: "#1a1f2e", border: "1px solid #1f2937", borderRadius: 14, padding: 24, gridColumn: "1 / -1" }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.05em" }}>✅ Recomendación</h3>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {[
                  { label: "Contratar", color: "#10b981", icon: "✅" },
                  { label: "Seguir", color: "#f59e0b", icon: "👁️" },
                  { label: "Descartar", color: "#ef4444", icon: "❌" },
                ].map(r => (
                  <button key={r.label} style={{
                    background: r.color + "15", border: `1px solid ${r.color}40`,
                    borderRadius: 8, color: r.color, padding: "12px 24px",
                    fontSize: 15, fontWeight: 700, cursor: "pointer",
                  }}>{r.icon} {r.label}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0f1117", color: "#e5e7eb", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: "#fff" }}>🧠 Scouting de entrenadores</h1>
          <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 14 }}>
            {entrenadores.length} entrenadores
            {perfil && <span> · {perfil.nombre} ({perfil.rol})</span>}
          </p>
        </div>

        <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="🔍 Buscar por nombre o estilo..."
            style={{
              flex: 1, minWidth: 240,
              background: "#1a1f2e", border: "1px solid #1f2937",
              borderRadius: 10, padding: "10px 16px",
              color: "#fff", fontSize: 14, outline: "none",
            }}
          />
          <select value={filtroEstilo} onChange={e => setFiltroEstilo(e.target.value)} style={{
            background: "#1a1f2e", border: "1px solid #1f2937",
            borderRadius: 10, padding: "10px 16px",
            color: filtroEstilo ? "#fff" : "#6b7280", fontSize: 14, outline: "none",
          }}>
            <option value="">Todos los estilos</option>
            {estilos.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} style={{
            background: "#1a1f2e", border: "1px solid #1f2937",
            borderRadius: 10, padding: "10px 16px",
            color: filtroEstado ? "#fff" : "#6b7280", fontSize: 14, outline: "none",
          }}>
            <option value="">Todos los estados</option>
            {estados.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button
            onClick={() => window.location.href = "/entrenadores/nuevo"}
            style={{
              background: "#8b5cf6", border: "none", borderRadius: 10,
              padding: "10px 20px", color: "#fff", fontSize: 14,
              fontWeight: 700, cursor: "pointer",
            }}
          >
            + Añadir entrenador
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#6b7280" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
            Cargando entrenadores...
          </div>
        ) : filtrados.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "#6b7280" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            No se encontraron entrenadores
          </div>
        ) : (
          <div style={{ background: "#1a1f2e", border: "1px solid #1f2937", borderRadius: 14, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#111827", borderBottom: "1px solid #1f2937" }}>
                  {["Entrenador", "Estilo", "Formación", "PJ", "V", "E", "D", "Nota", "Estado"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrados.map((e, i) => (
                  <tr
                    key={e.id || i}
                    onClick={() => setSeleccionado(e)}
                    style={{ borderBottom: "1px solid #1f2937", cursor: "pointer" }}
                    onMouseEnter={ev => (ev.currentTarget as HTMLTableRowElement).style.background = "#111827"}
                    onMouseLeave={ev => (ev.currentTarget as HTMLTableRowElement).style.background = "transparent"}
                  >
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: "50%",
                          background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0,
                        }}>{e.apellidos?.[0] || "?"}</div>
                        <div>
                          <div style={{ fontWeight: 700, color: "#fff", fontSize: 14 }}>{e.apellidos}</div>
                          <div style={{ color: "#9ca3af", fontSize: 12 }}>{e.nombre}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {e.estilo_principal && (
                        <span style={{
                          background: getEstiloColor(e.estilo_principal) + "20",
                          color: getEstiloColor(e.estilo_principal),
                          border: `1px solid ${getEstiloColor(e.estilo_principal)}40`,
                          borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 600,
                        }}>{e.estilo_principal}</span>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 14, color: "#d1d5db" }}>{e.formacion_preferida || "—"}</td>
                    <td style={{ padding: "12px 16px", fontSize: 14, color: "#d1d5db" }}>{e.pj || "—"}</td>
                    <td style={{ padding: "12px 16px", fontSize: 14, color: "#10b981", fontWeight: 700 }}>{e.v || "—"}</td>
                    <td style={{ padding: "12px 16px", fontSize: 14, color: "#f59e0b", fontWeight: 700 }}>{e.e || "—"}</td>
                    <td style={{ padding: "12px 16px", fontSize: 14, color: "#ef4444", fontWeight: 700 }}>{e.d || "—"}</td>
                    <td style={{ padding: "12px 16px" }}>
                      {e.valoracion ? (
                        <span style={{
                          background: parseFloat(e.valoracion) >= 8 ? "#10b98120" : parseFloat(e.valoracion) >= 6 ? "#f59e0b20" : "#ef444420",
                          color: parseFloat(e.valoracion) >= 8 ? "#10b981" : parseFloat(e.valoracion) >= 6 ? "#f59e0b" : "#ef4444",
                          borderRadius: 6, padding: "3px 10px", fontSize: 13, fontWeight: 700,
                        }}>{e.valoracion}</span>
                      ) : "—"}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {e.estado && (
                        <span style={{
                          background: "#10b98120", color: "#10b981",
                          border: "1px solid #10b98140",
                          borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 600,
                        }}>{e.estado}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}