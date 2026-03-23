"use client";
import { useEffect, useState } from "react";
import Papa from "papaparse";
 
const SHEET_ID = "1Hh982i-Mx_ytjeAONBkJtWLu7N3AaEHGZRyqBw0DS5A";
const SHEET_NAME = "Entrenadores";
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}`;
 
type Entrenador = {
  num: string;
  id: string;
  apellidos: string;
  nombre: string;
  estiloPrincipal: string;
  estiloSecundario: string;
  intensidadPresion: string;
  perfilGestion: string;
  subPerfil: string;
  formacionPreferida: string;
  formacionAlternativa: string;
  pj: string;
  v: string;
  e: string;
  d: string;
  ppp: string;
  pctVictorias: string;
  valoracion: string;
  estado: string;
  notas: string;
mapaMercado: string;
perfilMediatico: string;
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
 
function parseEntrenadores(filas: string[][]): Entrenador[] {
  const result: Entrenador[] = [];
  // Empezar desde fila 2 (índice 1) saltando el título
  for (let i = 1; i < filas.length; i++) {
    const vals = filas[i];
    if (!vals || vals.every(v => !v || v.trim() === "")) continue;
    const get = (idx: number) => {
      const val = vals[idx]?.trim() || "";
      if (val.startsWith("#")) return "";
      return val;
    };
    // Saltar filas que son encabezados
    if (get(1).toUpperCase() === "ID" || get(2).toUpperCase() === "APELLIDOS") continue;
    // Saltar filas sin apellidos O sin nombre
    if (!get(2) || !get(3)) continue;
    const e: Entrenador = {
      num: get(0), id: get(1), apellidos: get(2), nombre: get(3),
      estiloPrincipal: get(4), estiloSecundario: get(5), intensidadPresion: get(6),
      perfilGestion: get(7), subPerfil: get(8),
      formacionPreferida: get(9), formacionAlternativa: get(10),
      pj: get(11), v: get(12), e: get(13), d: get(14),
      ppp: get(15), pctVictorias: get(16),
      valoracion: get(17), estado: get(18), notas: get(19),
mapaMercado: get(20),
perfilMediatico: get(21),
    };
    result.push(e);
  }
  return result;
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
  const [entrenadores, setEntrenadores] = useState<Entrenador[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstilo, setFiltroEstilo] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [seleccionado, setSeleccionado] = useState<Entrenador | null>(null);
  const [ultimaActualizacion, setUltimaActualizacion] = useState("");
 
  function cargar() {
    Papa.parse(CSV_URL, {
      download: true,
      header: false,
      skipEmptyLines: false,
      complete: (result) => {
        const filas = result.data as string[][];
        const parsed = parseEntrenadores(filas);
        setEntrenadores(parsed);
        setUltimaActualizacion(new Date().toLocaleTimeString("es-ES"));
        setLoading(false);
      },
      error: () => setLoading(false),
    });
  }
 
  useEffect(() => {
    cargar();
    const interval = setInterval(cargar, 30000);
    return () => clearInterval(interval);
  }, []);
 
  const estilos = [...new Set(entrenadores.map(e => e.estiloPrincipal).filter(Boolean))];
  const estados = [...new Set(entrenadores.map(e => e.estado).filter(Boolean))];
 
  const filtrados = entrenadores.filter(e => {
    const texto = busqueda.toLowerCase();
    const coincideTexto = !busqueda ||
      `${e.apellidos} ${e.nombre}`.toLowerCase().includes(texto) ||
      e.estiloPrincipal.toLowerCase().includes(texto) ||
      e.id.toLowerCase().includes(texto);
    const coincideEstilo = !filtroEstilo || e.estiloPrincipal === filtroEstilo;
    const coincideEstado = !filtroEstado || e.estado === filtroEstado;
    return coincideTexto && coincideEstilo && coincideEstado;
  });
 
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
                <span>🆔 {seleccionado.id}</span>
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
                <Stat label="Estilo principal" value={seleccionado.estiloPrincipal} color={getEstiloColor(seleccionado.estiloPrincipal)} />
                <Stat label="Estilo secundario" value={seleccionado.estiloSecundario} />
                <Stat label="Intensidad presión" value={seleccionado.intensidadPresion} />
                <Stat label="Formación preferida" value={seleccionado.formacionPreferida} color="#3b82f6" />
                <Stat label="Formación alternativa" value={seleccionado.formacionAlternativa} />
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
                <Stat label="% Victorias" value={seleccionado.pctVictorias} color="#3b82f6" />
              </div>
            </div>
 
            <div style={{ background: "#1a1f2e", border: "1px solid #1f2937", borderRadius: 14, padding: 24 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.05em" }}>🧠 Perfil de gestión</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <Stat label="Perfil gestión" value={seleccionado.perfilGestion} />
                <Stat label="Sub-perfil" value={seleccionado.subPerfil} />
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
 
            <div style={{ background: "#1a1f2e", border: "1px solid #1f2937", borderRadius: 14, padding: 24, gridColumn: "1 / -1" }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.05em" }}>✅ Recomendación</h3>
              {seleccionado.mapaMercado && (
  <div style={{ background: "#1a1f2e", border: "1px solid #1f2937", borderRadius: 14, padding: 24 }}>
    <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.05em" }}>🗺️ Mapa de mercado</h3>
    <div style={{ background: "#111827", borderRadius: 8, padding: "14px 16px", border: "1px solid #1f2937", color: "#d1d5db", fontSize: 14, lineHeight: 1.6 }}>
      {seleccionado.mapaMercado}
    </div>
  </div>
)}

{seleccionado.perfilMediatico && (
  <div style={{ background: "#1a1f2e", border: "1px solid #1f2937", borderRadius: 14, padding: 24 }}>
    <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.05em" }}>📰 Perfil mediático</h3>
    <div style={{ background: "#111827", borderRadius: 8, padding: "14px 16px", border: "1px solid #1f2937", color: "#d1d5db", fontSize: 14, lineHeight: 1.6 }}>
      {seleccionado.perfilMediatico}
    </div>
  </div>
)}
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
            {entrenadores.length} entrenadores · Actualizado {ultimaActualizacion}
          </p>
        </div>
 
        <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="🔍 Buscar por nombre, estilo o ID..."
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
                  {["ID", "Entrenador", "Estilo", "Formación", "PJ", "V", "E", "D", "Nota", "Estado"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrados.map((e, i) => (
                  <tr
                    key={e.id || i}
                    onClick={() => setSeleccionado(e)}
                    style={{ borderBottom: "1px solid #1f2937", cursor: "pointer", transition: "background 0.1s" }}
                    onMouseEnter={ev => (ev.currentTarget as HTMLTableRowElement).style.background = "#111827"}
                    onMouseLeave={ev => (ev.currentTarget as HTMLTableRowElement).style.background = "transparent"}
                  >
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#6b7280", fontFamily: "monospace" }}>{e.id}</td>
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
                      {e.estiloPrincipal && (
                        <span style={{
                          background: getEstiloColor(e.estiloPrincipal) + "20",
                          color: getEstiloColor(e.estiloPrincipal),
                          border: `1px solid ${getEstiloColor(e.estiloPrincipal)}40`,
                          borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 600,
                        }}>{e.estiloPrincipal}</span>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 14, color: "#d1d5db" }}>{e.formacionPreferida || "—"}</td>
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