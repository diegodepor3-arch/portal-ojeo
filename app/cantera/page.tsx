"use client";
import { useEffect, useState } from "react";
import Papa from "papaparse";

const SHEET_ID = "1Hh982i-Mx_ytjeAONBkJtWLu7N3AaEHGZRyqBw0DS5A";
const SHEET_NAME = "Cantera";
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=1099197451`;

type Cantera = {
  id: string; apellidos: string; nombre: string; edad: string;
  fNacim: string; categ: string; academiaActual: string; clubFormador: string;
  pais: string; ligaJuvenil: string; nombreTutor: string; telefonoFamilia: string;
  situacionFamiliar: string; instAcademico: string; posicion: string; pieDom: string;
  notaTecnica: string; notaFisica: string; notaActitud: string; notaGlobal: string;
  selecNacional: string; proyeccion: string; horizonteFichaje: string; scoutAsig: string;
};

const POS_COLORES: Record<string, string> = {
  Portero: "#f59e0b", Defensa: "#3b82f6",
  Centrocampista: "#10b981", Delantero: "#ef4444", Lateral: "#8b5cf6",
};

function getPosColor(pos: string) {
  for (const key of Object.keys(POS_COLORES)) {
    if (pos?.toLowerCase().includes(key.toLowerCase())) return POS_COLORES[key];
  }
  return "#6b7280";
}

export default function Cantera() {
  const [jugadores, setJugadores] = useState<Cantera[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroPosicion, setFiltroPosicion] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [ultimaActualizacion, setUltimaActualizacion] = useState("");

  function cargar() {
    Papa.parse(CSV_URL, {
      download: true, header: false, skipEmptyLines: true,
      complete: (result) => {
        const filas = result.data as string[][];
        console.log("TOTAL FILAS:", filas.length);
        console.log("PRIMERA FILA:", filas[0]);
        console.log("FILA 10:", filas[10]);
        const lista: Cantera[] = [];
        for (let i = 0; i < filas.length; i++) {
          const vals = filas[i];
          const get = (idx: number) => vals[idx]?.toString().trim() || "";
          const id = get(1);
          if (!id || id.trim() === "" || id.toLowerCase().includes("id") || id.toLowerCase().includes("base")) continue;
if (!id.startsWith("CAN")) continue;
if (!get(2) && !get(3)) continue;
          lista.push({
            id, apellidos: get(2), nombre: get(3), edad: get(4),
fNacim: get(5), categ: get(6), academiaActual: get(7), clubFormador: get(8),
pais: get(9), ligaJuvenil: get(10), nombreTutor: get(11), telefonoFamilia: get(12),
situacionFamiliar: get(13), instAcademico: get(14), posicion: get(15), pieDom: get(16),
notaTecnica: get(17), notaFisica: get(18), notaActitud: get(19), notaGlobal: get(20),
selecNacional: get(21), proyeccion: get(22), horizonteFichaje: get(23), scoutAsig: get(24),
          });
        }
        console.log("JUGADORES ENCONTRADOS:", lista.length);
        setJugadores(lista);
        setUltimaActualizacion(new Date().toLocaleTimeString("es-ES"));
        setLoading(false);
      },
      error: (err) => { console.log("ERROR:", err); setLoading(false); },
    });
  }

  useEffect(() => {
    cargar();
    const interval = setInterval(cargar, 30000);
    return () => clearInterval(interval);
  }, []);

  const posiciones = [...new Set(jugadores.map(j => j.posicion).filter(Boolean))];
  const categorias = [...new Set(jugadores.map(j => j.categ).filter(Boolean))];

  const filtrados = jugadores.filter(j => {
    const texto = busqueda.toLowerCase();
    const coincideTexto = !busqueda ||
      `${j.apellidos} ${j.nombre}`.toLowerCase().includes(texto) ||
      j.academiaActual.toLowerCase().includes(texto) ||
      j.pais.toLowerCase().includes(texto) ||
      j.id.toLowerCase().includes(texto);
    const coincidePosicion = !filtroPosicion || j.posicion === filtroPosicion;
    const coincideCategoria = !filtroCategoria || j.categ === filtroCategoria;
    return coincideTexto && coincidePosicion && coincideCategoria;
  });

  return (
    <div style={{ minHeight: "100vh", background: "#0f1117", color: "#e5e7eb", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: "#fff" }}>🌱 Cantera</h1>
            <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 14 }}>
              {jugadores.length} jugadores · Actualizado {ultimaActualizacion}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="🔍 Buscar por nombre, academia, país o ID..." style={{ flex: 1, minWidth: 260, background: "#1a1f2e", border: "1px solid #1f2937", borderRadius: 10, padding: "10px 16px", color: "#fff", fontSize: 14, outline: "none" }} />
          <select value={filtroPosicion} onChange={e => setFiltroPosicion(e.target.value)} style={{ background: "#1a1f2e", border: "1px solid #1f2937", borderRadius: 10, padding: "10px 16px", color: filtroPosicion ? "#fff" : "#6b7280", fontSize: 14, outline: "none" }}>
            <option value="">Todas las posiciones</option>
            {posiciones.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)} style={{ background: "#1a1f2e", border: "1px solid #1f2937", borderRadius: 10, padding: "10px 16px", color: filtroCategoria ? "#fff" : "#6b7280", fontSize: 14, outline: "none" }}>
            <option value="">Todas las categorías</option>
            {categorias.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#6b7280" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>Cargando cantera...
          </div>
        ) : filtrados.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "#6b7280" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>No se encontraron jugadores
          </div>
        ) : (
          <div style={{ background: "#1a1f2e", border: "1px solid #1f2937", borderRadius: 14, overflow: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
              <thead>
                <tr style={{ background: "#111827", borderBottom: "1px solid #1f2937" }}>
                  {["ID", "Jugador", "Edad", "Categ.", "Academia", "País", "Posición", "Pie", "Téc.", "Fís.", "Act.", "Global", "Proyección", "Scout"].map(h => (
                    <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrados.map((j, i) => (
                  <tr key={j.id || i} style={{ borderBottom: "1px solid #1f2937", cursor: "default" }}
                    onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = "#111827"}
                    onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}>
                    <td style={{ padding: "12px 14px", fontSize: 12, color: "#6b7280", fontFamily: "monospace" }}>{j.id}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #10b981, #059669)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                          {j.apellidos?.[0] || "?"}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: "#fff", fontSize: 14 }}>{j.apellidos}</div>
                          <div style={{ color: "#9ca3af", fontSize: 12 }}>{j.nombre}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px", fontSize: 14, color: "#d1d5db" }}>{j.edad || "—"}</td>
                    <td style={{ padding: "12px 14px" }}>
                      {j.categ ? <span style={{ background: "#3b82f620", color: "#3b82f6", border: "1px solid #3b82f640", borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 600 }}>{j.categ}</span> : "—"}
                    </td>
                    <td style={{ padding: "12px 14px", fontSize: 13, color: "#d1d5db" }}>{j.academiaActual || "—"}</td>
                    <td style={{ padding: "12px 14px", fontSize: 14, color: "#d1d5db" }}>{j.pais || "—"}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ background: getPosColor(j.posicion) + "20", color: getPosColor(j.posicion), border: `1px solid ${getPosColor(j.posicion)}40`, borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 600 }}>{j.posicion || "—"}</span>
                    </td>
                    <td style={{ padding: "12px 14px", fontSize: 14, color: "#d1d5db" }}>{j.pieDom || "—"}</td>
                    {[j.notaTecnica, j.notaFisica, j.notaActitud].map((nota, ni) => (
                      <td key={ni} style={{ padding: "12px 14px" }}>
                        {nota ? <span style={{ background: parseFloat(nota) >= 8 ? "#10b98120" : parseFloat(nota) >= 6 ? "#f59e0b20" : "#ef444420", color: parseFloat(nota) >= 8 ? "#10b981" : parseFloat(nota) >= 6 ? "#f59e0b" : "#ef4444", borderRadius: 6, padding: "3px 8px", fontSize: 13, fontWeight: 700 }}>{nota}</span> : "—"}
                      </td>
                    ))}
                    <td style={{ padding: "12px 14px" }}>
                      {j.notaGlobal ? <span style={{ background: parseFloat(j.notaGlobal) >= 8 ? "#10b98130" : parseFloat(j.notaGlobal) >= 6 ? "#f59e0b30" : "#ef444430", color: parseFloat(j.notaGlobal) >= 8 ? "#10b981" : parseFloat(j.notaGlobal) >= 6 ? "#f59e0b" : "#ef4444", borderRadius: 6, padding: "3px 10px", fontSize: 14, fontWeight: 900 }}>{j.notaGlobal}</span> : "—"}
                    </td>
                    <td style={{ padding: "12px 14px", fontSize: 13, color: "#a78bfa" }}>{j.proyeccion || "—"}</td>
                    <td style={{ padding: "12px 14px", fontSize: 13, color: "#9ca3af" }}>{j.scoutAsig || "—"}</td>
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