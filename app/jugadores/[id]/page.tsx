"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Papa from "papaparse";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip
} from "recharts";
 
const SHEET_ID = "1Hh982i-Mx_ytjeAONBkJtWLu7N3AaEHGZRyqBw0DS5A";
const SHEET_NAME = "Jugadores";
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}`;
const COEF_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=1871976648`;
const LESIONES_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=1623885714`;
 
type Jugador = {
  id: string; apellidos: string; nombre: string;
  posicion: string; posEspecifica: string; equipoActual: string;
  anoNac: string; edad: string; pais: string; pasaporte: string;
  pie: string; altura: string; valorTM: string; contratoHasta: string;
  scoringScout: string; scoringIndex: string; notaScout: string;
  potencial: string; notaFisica: string; notaTactica: string;
  categoria: string; perfilTactico: string; scout: string; liga: string;
};
 
type Coeficiente = { liga: string; pais: string; dificultad: number };
type Lesion = { jugador: string; lesion: string; fecha: string; duracion: string };
 
type Descartado = {
  id: string; nombre: string; equipo: string;
  posicion: string; motivo: string; categoria: string;
  fecha: string; scout: string;
};
 
// ── localStorage ──────────────────────────────────────────────────
function getDescartados(): Descartado[] {
  try {
    const d = localStorage.getItem("jugadores_descartados");
    return d ? JSON.parse(d) : [];
  } catch { return []; }
}
 
function guardarDescartado(d: Descartado) {
  try {
    const lista = getDescartados().filter(x => x.id !== d.id);
    localStorage.setItem("jugadores_descartados", JSON.stringify([...lista, d]));
  } catch {}
}
 
function eliminarDescartado(id: string) {
  try {
    const lista = getDescartados().filter(x => x.id !== id);
    localStorage.setItem("jugadores_descartados", JSON.stringify(lista));
  } catch {}
}
 
// ── Parsers ───────────────────────────────────────────────────────
function parseJugadores(filas: Record<string, string>[]): Jugador[] {
  let dataStart = 0;
  for (let i = 0; i < filas.length; i++) {
    const vals = Object.values(filas[i]).join(" ").toLowerCase();
    if (vals.includes("apellidos") || vals.includes("id")) { dataStart = i + 1; break; }
  }
  const result: Jugador[] = [];
  for (let i = dataStart; i < filas.length; i++) {
    const vals = Object.values(filas[i]);
    if (vals.every(v => !v || v.toString().trim() === "")) continue;
    const get = (idx: number) => vals[idx]?.toString().trim() || "";
 
    // Valor TM: solo válido si es numérico (ej: "5.2", "10", "0.8")
    // Si contiene letras como "Senior", "Sub-23", etc. → ignorar
    const rawValor = get(13);
    const valorTM = /^\d+([.,]\d+)?$/.test(rawValor.replace(",", ".")) ? rawValor : "";
 
    result.push({
      id: get(1), apellidos: get(2), nombre: get(3),
      posicion: get(4), posEspecifica: get(5), equipoActual: get(6),
      anoNac: get(7), edad: get(8), pais: get(9), pasaporte: get(10),
      pie: get(11), altura: get(12),
      valorTM,                        // ← limpio
      contratoHasta: get(14),
      scoringScout: get(15), scoringIndex: get(16),
      notaScout: get(16),             // nota principal = scoringIndex col 16
      potencial: get(17),
      notaFisica: get(18),
      notaTactica: get(19),
      categoria: get(20),
      perfilTactico: get(21),
      scout: get(22),
      liga: get(6),                   // liga se infiere del equipo actual
    });
  }
  return result.filter(j => j.apellidos || j.nombre);
}
 
// ── Transfermarkt link ────────────────────────────────────────────
function getTMUrl(jugador: Jugador): string {
  const query = encodeURIComponent(`${jugador.nombre} ${jugador.apellidos} ${jugador.equipoActual}`);
  return `https://www.transfermarkt.es/schnellsuche/ergebnis/schnellsuche?query=${query}`;
}
 
function calcularNotaAjustada(nota: string, coeficiente: number): string {
  const n = parseFloat(nota);
  if (isNaN(n) || !coeficiente) return "—";
  return Math.min(10, (n * coeficiente) / 10).toFixed(1);
}
 
function generarInforme(j: Jugador, notaAjustada: string, ligaInfo: Coeficiente | null, lesiones: Lesion[]): string {
  const nombre = `${j.nombre} ${j.apellidos}`.trim();
  const nota = parseFloat(j.notaScout);
  const potencial = parseFloat(j.potencial);
  const fisica = parseFloat(j.notaFisica);
  const tactica = parseFloat(j.notaTactica);
  const scoring = parseFloat(j.scoringScout);
  const nivelNota = nota >= 8 ? "muy alta" : nota >= 6.5 ? "notable" : nota >= 5 ? "media" : "baja";
  const nivelPotencial = potencial >= 8 ? "un jugador de alto potencial de crecimiento" : potencial >= 6.5 ? "un perfil con margen de mejora interesante" : "un perfil ya consolidado";
  const nivelFisica = fisica >= 8 ? "destacada capacidad física" : fisica >= 6 ? "buenas condiciones físicas" : "condiciones físicas a mejorar";
  const nivelTactica = tactica >= 8 ? "excelente comprensión táctica" : tactica >= 6 ? "buen nivel táctico" : "aspectos tácticos a desarrollar";
  const contrato = j.contratoHasta ? `Su contrato finaliza en ${j.contratoHasta}, lo que${j.contratoHasta < "2026" ? " abre una ventana de oportunidad en el mercado" : " le da estabilidad contractual"}.` : "";
  const valor = j.valorTM ? `Su valor de mercado estimado según Transfermarkt es de €${j.valorTM}M.` : "";
  const pie = j.pie ? `Es ${j.pie === "Zurdo" ? "zurdo" : j.pie === "Ambidiestro" ? "ambidiestro" : "diestro"}.` : "";
  const altura = j.altura ? `Mide ${j.altura} cm.` : "";
  const ajuste = ligaInfo && notaAjustada !== "—" ? `\nCOEFICIENTE DE LIGA\n\nJuega en ${ligaInfo.liga} (coeficiente ${ligaInfo.dificultad}/10). Su nota ajustada por nivel competitivo es ${notaAjustada}/10.\n` : "";
  const lesionesTexto = lesiones.length > 0 ? `\nHISTORIAL DE LESIONES\n\n${lesiones.map(l => `- ${l.lesion}${l.fecha ? ` (${l.fecha})` : ""}${l.duracion ? ` — ${l.duracion}` : ""}`).join("\n")}\n${lesiones.length >= 3 ? "Perfil de riesgo alto por recurrencia de lesiones." : lesiones.length === 2 ? "Seguimiento médico recomendado." : "Sin patrón de recurrencia significativo."}\n` : "";
  const recomendacion = nota >= 7.5 ? "Se recomienda iniciar negociaciones para su incorporación." : nota >= 6 ? "Se recomienda continuar el seguimiento durante las próximas semanas." : "No se recomienda su incorporación en este momento.";
  return `INFORME DE SCOUTING — ${nombre.toUpperCase()}\n\n${nombre} es un jugador de ${j.edad || "edad desconocida"} años de nacionalidad ${j.pais || "desconocida"}, que actualmente milita en ${j.equipoActual || "equipo desconocido"}. Actúa como ${j.posEspecifica || j.posicion || "posición no especificada"} con un perfil táctico ${j.perfilTactico ? `definido como "${j.perfilTactico}"` : "no especificado"}. ${pie} ${altura}\n\nVALORACIÓN GLOBAL\n\nEl jugador ha recibido una nota scout de ${isNaN(nota) ? "—" : nota}/10, considerada ${nivelNota} por el departamento de scouting. Es ${nivelPotencial}. Su scoring scout es de ${isNaN(scoring) ? "—" : scoring} puntos.\n\nEn el apartado físico muestra ${nivelFisica} (nota: ${isNaN(fisica) ? "—" : fisica}/10). Tácticamente presenta ${nivelTactica} (nota: ${isNaN(tactica) ? "—" : tactica}/10).\n${ajuste}${lesionesTexto}\nSITUACIÓN CONTRACTUAL Y MERCADO\n\n${contrato} ${valor} Su categoría actual es ${j.categoria || "no especificada"}.\n\nCONCLUSIÓN\n\n${recomendacion} Informe elaborado por el scout ${j.scout || "no asignado"}.\n\n---\nGenerado por ScoutPro · ${new Date().toLocaleDateString("es-ES")}`;
}
 
function RadarJugador({ jugador }: { jugador: Jugador }) {
  const datos = [
    { attr: "Técnica", value: parseFloat(jugador.scoringScout) || 7 },
    { attr: "Velocidad", value: parseFloat(jugador.notaFisica) || 6 },
    { attr: "Táctica", value: parseFloat(jugador.notaTactica) || 7 },
    { attr: "Físico", value: parseFloat(jugador.notaFisica) || 6 },
    { attr: "Mental", value: parseFloat(jugador.potencial) || 7 },
    { attr: "Potencial", value: parseFloat(jugador.potencial) || 8 },
  ];
  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={datos}>
        <PolarGrid stroke="#1f2937" />
        <PolarAngleAxis dataKey="attr" tick={{ fill: "#9ca3af", fontSize: 12 }} />
        <Radar dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} strokeWidth={2} />
        <Tooltip contentStyle={{ background: "#1a1f2e", border: "1px solid #374151", borderRadius: 8 }} labelStyle={{ color: "#fff" }} itemStyle={{ color: "#93c5fd" }} />
      </RadarChart>
    </ResponsiveContainer>
  );
}
 
function Stat({ label, value, color, href }: { label: string; value: string; color?: string; href?: string }) {
  return (
    <div style={{ background: "#111827", borderRadius: 8, padding: "12px 16px", border: "1px solid #1f2937" }}>
      <div style={{ color: "#6b7280", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{label}</div>
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: color || "#10b981", fontWeight: 700, fontSize: 15, textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
          {value}
          <span style={{ fontSize: 10, opacity: 0.7 }}>↗</span>
        </a>
      ) : (
        <div style={{ color: color || "#fff", fontWeight: 700, fontSize: 15 }}>{value || "—"}</div>
      )}
    </div>
  );
}
 
function NotaCirculo({ nota, label, sublabel }: { nota: string; label: string; sublabel?: string }) {
  const n = parseFloat(nota);
  const color = isNaN(n) ? "#6b7280" : n >= 8 ? "#10b981" : n >= 6 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", border: `3px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 900, color, margin: "0 auto 8px", background: color + "15" }}>
        {isNaN(n) ? "—" : nota}
      </div>
      <div style={{ fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
      {sublabel && <div style={{ fontSize: 10, color: "#4b5563", marginTop: 2 }}>{sublabel}</div>}
    </div>
  );
}
 
export default function FichaJugador() {
  const params = useParams();
  const id = decodeURIComponent(params.id as string);
  const [jugador, setJugador] = useState<Jugador | null>(null);
  const [coeficientes, setCoeficientes] = useState<Coeficiente[]>([]);
  const [lesiones, setLesiones] = useState<Lesion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exportando, setExportando] = useState(false);
  const [mostrarInforme, setMostrarInforme] = useState(false);
  const [copiado, setCopiado] = useState(false);
 
  const [esDescartado, setEsDescartado] = useState(false);
  const [infoDescarte, setInfoDescarte] = useState<Descartado | null>(null);
  const [mostrarModalDescarte, setMostrarModalDescarte] = useState(false);
  const [motivoDescarte, setMotivoDescarte] = useState("");
  const [toast, setToast] = useState("");
 
  useEffect(() => {
    Papa.parse(CSV_URL, {
      download: true, header: true, skipEmptyLines: true,
      complete: (result) => {
        const filas = result.data as Record<string, string>[];
        const todos = parseJugadores(filas);
        const found = todos.find(j => j.id === id);
        if (found) setJugador(found);
        else setError("Jugador no encontrado");
        setLoading(false);
      },
      error: () => { setError("Error al cargar datos"); setLoading(false); }
    });
 
    Papa.parse(COEF_URL, {
      download: true, header: false, skipEmptyLines: true,
      complete: (result) => {
        const filas = result.data as string[][];
        const lista: Coeficiente[] = [];
        for (let i = 1; i < filas.length; i++) {
          const liga = filas[i][0]?.trim();
          const pais = filas[i][1]?.trim();
          const dificultad = parseFloat(filas[i][2]);
          if (liga && !isNaN(dificultad)) lista.push({ liga, pais, dificultad });
        }
        setCoeficientes(lista);
      },
    });
 
    Papa.parse(LESIONES_URL, {
      download: true, header: false, skipEmptyLines: true,
      complete: (result) => {
        const filas = result.data as string[][];
        const lista: Lesion[] = [];
        for (let i = 1; i < filas.length; i++) {
          const jugador = filas[i][1]?.trim();
          const lesion = filas[i][2]?.trim();
          const fecha = filas[i][3]?.trim();
          const duracion = filas[i][4]?.trim();
          if (jugador && lesion) lista.push({ jugador, lesion, fecha, duracion });
        }
        setLesiones(lista);
      },
    });
 
    const descartados = getDescartados();
    const desc = descartados.find(d => d.id === id);
    if (desc) { setEsDescartado(true); setInfoDescarte(desc); }
  }, [id]);
 
  function mostrarToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }
 
  function handleDescartar() {
    if (!jugador || !motivoDescarte.trim()) return;
    const hoy = new Date().toLocaleDateString("es-ES");
    const desc: Descartado = {
      id: jugador.id,
      nombre: `${jugador.apellidos}, ${jugador.nombre}`,
      equipo: jugador.equipoActual,
      posicion: jugador.posicion,
      motivo: motivoDescarte.trim(),
      categoria: jugador.categoria,
      fecha: hoy,
      scout: jugador.scout,
    };
    guardarDescartado(desc);
    setEsDescartado(true);
    setInfoDescarte(desc);
    setMostrarModalDescarte(false);
    setMotivoDescarte("");
    mostrarToast("❌ Jugador descartado y guardado en memoria");
  }
 
  function handleReactivar() {
    if (!jugador) return;
    eliminarDescartado(jugador.id);
    setEsDescartado(false);
    setInfoDescarte(null);
    mostrarToast("✅ Jugador reactivado");
  }
 
  const ligaInfo = jugador
    ? coeficientes.find(c =>
        jugador.equipoActual?.toLowerCase().includes(c.liga.toLowerCase()) ||
        jugador.liga?.toLowerCase().includes(c.liga.toLowerCase()) ||
        c.liga.toLowerCase().includes(jugador.equipoActual?.toLowerCase())
      ) || null
    : null;
 
  const notaAjustada = jugador && ligaInfo ? calcularNotaAjustada(jugador.notaScout, ligaInfo.dificultad) : "—";
 
  const lesionesJugador = lesiones.filter(l =>
    l.jugador === jugador?.id ||
    l.jugador.toLowerCase().includes(jugador?.apellidos?.toLowerCase() || "") ||
    l.jugador.toLowerCase().includes(jugador?.nombre?.toLowerCase() || "")
  );
 
  async function exportarPDF() {
    const elemento = document.getElementById("ficha-jugador");
    if (!elemento || !jugador) return;
    setExportando(true);
    try {
      const canvas = await html2canvas(elemento, { backgroundColor: "#0f1117", scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`ScoutPro_${jugador.apellidos}_${jugador.nombre}.pdf`);
    } catch { alert("Error al exportar PDF"); }
    setExportando(false);
  }
 
  function copiarInforme() {
    if (!jugador) return;
    navigator.clipboard.writeText(generarInforme(jugador, notaAjustada, ligaInfo, lesionesJugador));
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }
 
  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#0f1117", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}>
      <div style={{ textAlign: "center" }}><div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>Cargando ficha...</div>
    </div>
  );
 
  if (error || !jugador) return (
    <div style={{ minHeight: "100vh", background: "#0f1117", display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>{error}
        <div style={{ marginTop: 20 }}><a href="/jugadores" style={{ color: "#3b82f6", textDecoration: "none" }}>← Volver</a></div>
      </div>
    </div>
  );
 
  const tmUrl = getTMUrl(jugador);
 
  return (
    <div style={{ minHeight: "100vh", background: "#0f1117", color: "#e5e7eb", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
 
      {/* TOAST */}
      {toast && (
        <div style={{ position: "fixed", top: 24, right: 24, zIndex: 999, background: "#1a1f2e", border: "1px solid #374151", borderRadius: 12, padding: "14px 20px", color: "#e5e7eb", fontSize: 14, fontWeight: 600, boxShadow: "0 8px 32px #00000060" }}>
          {toast}
        </div>
      )}
 
      {/* MODAL DESCARTE */}
      {mostrarModalDescarte && (
        <div style={{ position: "fixed", inset: 0, background: "#000000cc", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 24 }}>
          <div style={{ background: "#1a1f2e", border: "1px solid #ef444430", borderRadius: 20, padding: 32, width: "100%", maxWidth: 480, boxShadow: "0 24px 64px #00000080" }}>
            <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 900, color: "#fff" }}>❌ Descartar jugador</h2>
            <p style={{ margin: "0 0 20px", color: "#6b7280", fontSize: 14 }}>
              Este motivo quedará guardado en la memoria del equipo para evitar proponer este jugador en el futuro.
            </p>
            <div style={{ background: "#111827", borderRadius: 10, padding: "12px 16px", marginBottom: 16, border: "1px solid #1f2937" }}>
              <div style={{ fontWeight: 700, color: "#fff" }}>{jugador.apellidos}, {jugador.nombre}</div>
              <div style={{ color: "#6b7280", fontSize: 13, marginTop: 2 }}>
                🏟️ {jugador.equipoActual} · 📍 {jugador.posicion}
              </div>
            </div>
            <div style={{ marginBottom: 6 }}>
              <label style={{ color: "#9ca3af", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Motivo del descarte *</label>
            </div>
            <textarea
              value={motivoDescarte}
              onChange={e => setMotivoDescarte(e.target.value)}
              placeholder="Ej: Precio fuera de mercado, lesiones recurrentes, no encaja tácticamente..."
              rows={4}
              style={{ width: "100%", background: "#111827", border: "1px solid #374151", borderRadius: 10, padding: "12px 14px", color: "#fff", fontSize: 14, outline: "none", resize: "vertical", boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={() => { setMostrarModalDescarte(false); setMotivoDescarte(""); }}
                style={{ flex: 1, background: "#111827", border: "1px solid #374151", borderRadius: 10, color: "#9ca3af", padding: "12px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                Cancelar
              </button>
              <button onClick={handleDescartar} disabled={!motivoDescarte.trim()}
                style={{ flex: 1, background: motivoDescarte.trim() ? "#ef4444" : "#374151", border: "none", borderRadius: 10, color: "#fff", padding: "12px", fontSize: 14, fontWeight: 700, cursor: motivoDescarte.trim() ? "pointer" : "not-allowed", transition: "all 0.15s" }}>
                ❌ Confirmar descarte
              </button>
            </div>
          </div>
        </div>
      )}
 
      <main id="ficha-jugador" style={{ padding: "32px", maxWidth: 1100, margin: "0 auto" }}>
 
        {/* BANNER DESCARTADO */}
        {esDescartado && infoDescarte && (
          <div style={{ background: "#1e1212", border: "1px solid #ef444430", borderRadius: 12, padding: "14px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <span style={{ fontSize: 20 }}>❌</span>
            <div style={{ flex: 1 }}>
              <div style={{ color: "#ef4444", fontWeight: 700, fontSize: 14 }}>Jugador descartado el {infoDescarte.fecha}</div>
              <div style={{ color: "#9ca3af", fontSize: 13, marginTop: 2 }}>📝 {infoDescarte.motivo}</div>
            </div>
            <button onClick={handleReactivar} style={{ background: "#451a03", border: "1px solid #f59e0b30", borderRadius: 8, color: "#f59e0b", padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              🔄 Reactivar
            </button>
          </div>
        )}
 
        {/* HEADER */}
        <div style={{ background: "linear-gradient(135deg, #1a1f2e, #111827)", border: `1px solid ${esDescartado ? "#ef444430" : "#1f2937"}`, borderRadius: 16, padding: "28px 32px", marginBottom: 24, display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: esDescartado ? "linear-gradient(135deg, #ef4444, #b91c1c)" : "linear-gradient(135deg, #3b82f6, #2563eb)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 900, color: "#fff", flexShrink: 0 }}>
            {jugador.apellidos?.[0] || "?"}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: "#fff", letterSpacing: "-0.5px" }}>{jugador.apellidos}, {jugador.nombre}</div>
              {esDescartado && (
                <span style={{ background: "#ef444420", color: "#ef4444", border: "1px solid #ef444440", borderRadius: 8, padding: "4px 12px", fontSize: 13, fontWeight: 700 }}>❌ Descartado</span>
              )}
            </div>
            <div style={{ color: "#9ca3af", fontSize: 15, marginTop: 4, display: "flex", gap: 16, flexWrap: "wrap" }}>
              <span>🏟️ {jugador.equipoActual || "—"}</span>
              <span>📍 {jugador.posicion || "—"}</span>
              <span>🌍 {jugador.pais || "—"}</span>
              <span>🆔 {jugador.id}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <NotaCirculo nota={jugador.notaScout} label="Nota Scout" />
            <NotaCirculo nota={notaAjustada} label="Ajustada" sublabel={ligaInfo ? `Liga x${ligaInfo.dificultad}` : "Sin liga"} />
            <NotaCirculo nota={jugador.potencial} label="Potencial" />
            <NotaCirculo nota={jugador.notaFisica} label="Físico" />
            <NotaCirculo nota={jugador.notaTactica} label="Táctica" />
          </div>
        </div>
 
        {/* BANNER COEFICIENTE */}
        {ligaInfo && (
          <div style={{ background: "#1e3a5f", border: "1px solid #3b82f640", borderRadius: 12, padding: "14px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <span style={{ fontSize: 20 }}>📊</span>
            <div style={{ flex: 1 }}>
              <span style={{ color: "#93c5fd", fontWeight: 700 }}>Coeficiente de liga: </span>
              <span style={{ color: "#fff" }}>{ligaInfo.liga} ({ligaInfo.pais}) — Dificultad </span>
              <span style={{ color: "#3b82f6", fontWeight: 900, fontSize: 16 }}>{ligaInfo.dificultad}/10</span>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: "#6b7280", fontSize: 12 }}>Nota original → Nota ajustada</div>
              <div style={{ color: "#fff", fontWeight: 900, fontSize: 16 }}>
                {jugador.notaScout} → <span style={{ color: "#3b82f6" }}>{notaAjustada}</span>
              </div>
            </div>
          </div>
        )}
 
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
 
          {/* DATOS PERSONALES */}
          <div style={{ background: "#1a1f2e", border: "1px solid #1f2937", borderRadius: 14, padding: 24 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.05em" }}>📋 Datos personales</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Stat label="Fecha nac." value={jugador.anoNac} />
              <Stat label="Edad" value={jugador.edad} />
              <Stat label="País" value={jugador.pais} />
              <Stat label="Pasaporte" value={jugador.pasaporte} />
              <Stat label="Pie dominante" value={jugador.pie} />
              <Stat label="Altura" value={jugador.altura ? jugador.altura + " cm" : "—"} />
              <Stat label="Contrato hasta" value={jugador.contratoHasta} />
 
              {/* VALOR TM — solo si hay valor numérico, con link a TM */}
              {jugador.valorTM ? (
                <Stat
                  label="Valor Transfermarkt"
                  value={`€${jugador.valorTM}M`}
                  color="#10b981"
                  href={tmUrl}
                />
              ) : (
                <div style={{ background: "#111827", borderRadius: 8, padding: "12px 16px", border: "1px solid #1f2937" }}>
                  <div style={{ color: "#6b7280", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Valor Transfermarkt</div>
                  <a
                    href={tmUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#6b7280", fontWeight: 600, fontSize: 13, textDecoration: "none", display: "flex", alignItems: "center", gap: 5 }}
                  >
                    Buscar en TM ↗
                  </a>
                </div>
              )}
            </div>
          </div>
 
          {/* RADAR */}
          <div style={{ background: "#1a1f2e", border: "1px solid #1f2937", borderRadius: 14, padding: 24 }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.05em" }}>📊 Radar de habilidades</h3>
            <RadarJugador jugador={jugador} />
          </div>
 
          {/* INFO SCOUTING */}
          <div style={{ background: "#1a1f2e", border: "1px solid #1f2937", borderRadius: 14, padding: 24 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.05em" }}>🔭 Info scouting</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Stat label="Posición específica" value={jugador.posEspecifica || "—"} />
              <Stat label="Perfil táctico" value={jugador.perfilTactico || "—"} />
              <Stat label="Categoría" value={jugador.categoria || "—"} color="#f59e0b" />
              <Stat label="Scout asignado" value={jugador.scout || "—"} />
              <Stat label="Scoring Scout" value={jugador.scoringScout || "—"} color="#3b82f6" />
              <Stat label="Scoring Index" value={jugador.scoringIndex || "—"} color="#8b5cf6" />
            </div>
          </div>
 
          {/* RECOMENDACIÓN */}
          <div style={{ background: "#1a1f2e", border: "1px solid #1f2937", borderRadius: 14, padding: 24 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.05em" }}>✅ Recomendación</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "Fichar", color: "#10b981", icon: "✅" },
                { label: "Seguir", color: "#f59e0b", icon: "👁️" },
              ].map(r => (
                <button key={r.label} style={{ background: r.color + "15", border: `1px solid ${r.color}40`, borderRadius: 8, color: r.color, padding: "12px 20px", fontSize: 15, fontWeight: 700, cursor: "pointer", textAlign: "left" }}>
                  {r.icon} {r.label}
                </button>
              ))}
              {esDescartado ? (
                <button onClick={handleReactivar} style={{ background: "#451a0320", border: "1px solid #f59e0b30", borderRadius: 8, color: "#f59e0b", padding: "12px 20px", fontSize: 15, fontWeight: 700, cursor: "pointer", textAlign: "left" }}>
                  🔄 Reactivar jugador
                </button>
              ) : (
                <button onClick={() => setMostrarModalDescarte(true)} style={{ background: "#ef444415", border: "1px solid #ef444440", borderRadius: 8, color: "#ef4444", padding: "12px 20px", fontSize: 15, fontWeight: 700, cursor: "pointer", textAlign: "left" }}>
                  ❌ Descartar
                </button>
              )}
            </div>
          </div>
        </div>
 
        {/* HISTORIAL DE LESIONES */}
        {lesionesJugador.length > 0 && (
          <div style={{ background: "#1a1f2e", border: "1px solid #1f2937", borderRadius: 14, padding: 24, marginTop: 20 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.05em" }}>🏥 Historial de lesiones</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {lesionesJugador.map((l, i) => (
                <div key={i} style={{ background: "#111827", border: "1px solid #ef444420", borderRadius: 10, padding: "14px 18px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 20 }}>🩹</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{l.lesion}</div>
                    {l.fecha && <div style={{ color: "#6b7280", fontSize: 12, marginTop: 2 }}>📅 {l.fecha}</div>}
                  </div>
                  {l.duracion && (
                    <span style={{ background: "#ef444420", color: "#ef4444", border: "1px solid #ef444440", borderRadius: 6, padding: "4px 12px", fontSize: 13, fontWeight: 700 }}>⏱️ {l.duracion}</span>
                  )}
                </div>
              ))}
              <div style={{ background: "#451a0320", border: "1px solid #f59e0b20", borderRadius: 8, padding: "10px 14px", marginTop: 4 }}>
                <span style={{ color: "#f59e0b", fontSize: 13, fontWeight: 600 }}>
                  ⚠️ {lesionesJugador.length} lesión{lesionesJugador.length > 1 ? "es" : ""} registrada{lesionesJugador.length > 1 ? "s" : ""}
                  {lesionesJugador.length >= 3 ? " — Perfil de riesgo alto" : lesionesJugador.length === 2 ? " — Seguimiento recomendado" : " — Sin patrón de recurrencia"}
                </span>
              </div>
            </div>
          </div>
        )}
 
        {/* INFORME */}
        <div style={{ background: "#1a1f2e", border: "1px solid #1f2937", borderRadius: 14, padding: 24, marginTop: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: mostrarInforme ? 20 : 0 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.05em" }}>🤖 Informe en lenguaje natural</h3>
              <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 13 }}>Texto narrativo listo para enviar al director deportivo</p>
            </div>
            <button onClick={() => setMostrarInforme(!mostrarInforme)} style={{ background: mostrarInforme ? "#374151" : "linear-gradient(135deg, #8b5cf6, #7c3aed)", border: "none", borderRadius: 10, color: "#fff", padding: "10px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              {mostrarInforme ? "Ocultar" : "✨ Generar informe"}
            </button>
          </div>
          {mostrarInforme && (
            <div>
              <pre style={{ background: "#0f1117", border: "1px solid #1f2937", borderRadius: 10, padding: "20px 24px", color: "#d1d5db", fontSize: 14, lineHeight: 1.8, whiteSpace: "pre-wrap", fontFamily: "'Segoe UI', system-ui, sans-serif", margin: 0 }}>
                {generarInforme(jugador, notaAjustada, ligaInfo, lesionesJugador)}
              </pre>
              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                <button onClick={copiarInforme} style={{ background: copiado ? "#10b981" : "#1f2937", border: "1px solid #374151", borderRadius: 8, color: "#fff", padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  {copiado ? "✅ Copiado!" : "📋 Copiar texto"}
                </button>
              </div>
            </div>
          )}
        </div>
 
        {/* BOTONES */}
        <div style={{ marginTop: 24, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button onClick={exportarPDF} disabled={exportando} style={{ background: exportando ? "#374151" : "linear-gradient(135deg, #10b981, #059669)", color: "#fff", borderRadius: 10, padding: "12px 24px", fontSize: 15, fontWeight: 700, border: "none", cursor: exportando ? "not-allowed" : "pointer" }}>
            {exportando ? "⏳ Generando PDF..." : "📄 Exportar PDF"}
          </button>
          <a href={`/comparador?a=${jugador.id}`} style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "#fff", borderRadius: 10, padding: "12px 24px", fontSize: 15, fontWeight: 700, textDecoration: "none" }}>
            ⚖️ Comparar
          </a>
          <a href="/jugadores" style={{ background: "#1f2937", border: "1px solid #374151", color: "#d1d5db", borderRadius: 10, padding: "12px 24px", fontSize: 15, fontWeight: 600, textDecoration: "none" }}>
            ← Volver
          </a>
        </div>
      </main>
    </div>
  );
}