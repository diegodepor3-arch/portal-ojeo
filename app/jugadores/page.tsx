"use client";
import { useEffect, useState, useRef } from "react";
import Papa from "papaparse";
 
const SHEET_ID = "1Hh982i-Mx_ytjeAONBkJtWLu7N3AaEHGZRyqBw0DS5A";
const SHEET_NAME = "Jugadores";
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}`;
 
type Rol = "admin" | "scout" | "director" | "ojeador";
 
type Jugador = {
  id: string; apellidos: string; nombre: string;
  posicion: string; posEspecifica: string; equipoActual: string;
  anoNac: string; edad: string; pais: string; pasaporte: string;
  pie: string; altura: string; valorTM: string; contratoHasta: string;
  scoringScout: string; scoringIndex: string;
  categoria: string; perfilTactico: string; scout: string;
};
 
type Descartado = {
  id: string; nombre: string; equipo: string;
  posicion: string; motivo: string; categoria: string;
  fecha: string; scout: string;
};
 
// ── Filtros avanzados ─────────────────────────────────────────────
type FiltrosAvanzados = {
  edadMin: string;
  edadMax: string;
  scoringMin: string;
  scoringMax: string;
  valorMin: string;
  valorMax: string;
  pie: string;
  pasaporte: string;
  perfilTactico: string;
  scout: string;
  contratoHasta: string; // "2025", "2026", "libre"
  alturaMin: string;
  alturaMax: string;
};
 
const FILTROS_VACIOS: FiltrosAvanzados = {
  edadMin: "", edadMax: "",
  scoringMin: "", scoringMax: "",
  valorMin: "", valorMax: "",
  pie: "", pasaporte: "", perfilTactico: "", scout: "",
  contratoHasta: "", alturaMin: "", alturaMax: "",
};
 
// ── Fair Play types ───────────────────────────────────────────────
type NormativaFPF = {
  nombre: string;
  descripcion: string;
  limiteNomina: number;
  limiteDeficit: number;
  periodoEvaluacion: number;
  color: string;
};
 
const NORMATIVAS: NormativaFPF[] = [
  { nombre: "UEFA FFP", descripcion: "Financial Sustainability Regulations (UEFA)", limiteNomina: 70, limiteDeficit: 60, periodoEvaluacion: 3, color: "#3b82f6" },
  { nombre: "LaLiga", descripcion: "Límite salarial LaLiga (España)", limiteNomina: 55, limiteDeficit: 25, periodoEvaluacion: 1, color: "#ef4444" },
  { nombre: "Premier League", descripcion: "PSR (Profitability & Sustainability Rules)", limiteNomina: 80, limiteDeficit: 105, periodoEvaluacion: 3, color: "#8b5cf6" },
  { nombre: "Bundesliga", descripcion: "DFL Licencia financiera", limiteNomina: 60, limiteDeficit: 15, periodoEvaluacion: 1, color: "#f59e0b" },
  { nombre: "Serie A", descripcion: "Indice di Liquidità FIGC", limiteNomina: 65, limiteDeficit: 30, periodoEvaluacion: 2, color: "#10b981" },
];
 
function getDescartados(): Descartado[] {
  try { return JSON.parse(localStorage.getItem("jugadores_descartados") || "[]"); } catch { return []; }
}
function eliminarDescartado(id: string) {
  try {
    const lista = getDescartados().filter(x => x.id !== id);
    localStorage.setItem("jugadores_descartados", JSON.stringify(lista));
  } catch {}
}
 
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
    result.push({
      id: get(1), apellidos: get(2), nombre: get(3),
      posicion: get(4), posEspecifica: get(5), equipoActual: get(6),
      anoNac: get(7), edad: get(8), pais: get(9), pasaporte: get(10),
      pie: get(11), altura: get(12), valorTM: get(13), contratoHasta: get(14),
      scoringScout: get(15), scoringIndex: get(16),
      categoria: get(20), perfilTactico: get(21), scout: get(22),
    });
  }
  return result.filter(j => j.apellidos || j.nombre);
}
 
// ── Chip de filtro activo ─────────────────────────────────────────
function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <span
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        background: hover ? "#3b82f630" : "#3b82f615",
        border: "1px solid #3b82f640",
        borderRadius: 20, padding: "4px 10px 4px 12px",
        fontSize: 12, color: "#60a5fa", fontWeight: 600,
        cursor: "default", transition: "background 0.15s",
        whiteSpace: "nowrap",
      }}
    >
      {label}
      <button
        onClick={onRemove}
        style={{
          background: hover ? "#ef444430" : "#ef444415",
          border: "none", borderRadius: "50%", width: 16, height: 16,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", color: "#ef4444", fontSize: 10, fontWeight: 900,
          padding: 0, lineHeight: 1, transition: "background 0.15s",
        }}
      >✕</button>
    </span>
  );
}
 
// ── Panel de filtros avanzados ────────────────────────────────────
function PanelFiltros({
  jugadores, filtros, setFiltros, filtrosAbiertos, setFiltrosAbiertos
}: {
  jugadores: Jugador[];
  filtros: FiltrosAvanzados;
  setFiltros: (f: FiltrosAvanzados) => void;
  filtrosAbiertos: boolean;
  setFiltrosAbiertos: (v: boolean) => void;
}) {
  const scouts = [...new Set(jugadores.map(j => j.scout).filter(Boolean))].sort();
  const perfiles = [...new Set(jugadores.map(j => j.perfilTactico).filter(Boolean))].sort();
  const pasaportes = [...new Set(jugadores.map(j => j.pasaporte).filter(Boolean))].sort();
 
  const set = (key: keyof FiltrosAvanzados) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFiltros({ ...filtros, [key]: e.target.value });
 
  const inputStyle: React.CSSProperties = {
    background: "#0f1117", border: "1px solid #374151", borderRadius: 8,
    padding: "8px 10px", color: "#fff", fontSize: 13, outline: "none",
    width: "100%", boxSizing: "border-box" as const,
  };
  const selectStyle: React.CSSProperties = { ...inputStyle };
  const labelStyle: React.CSSProperties = {
    color: "#6b7280", fontSize: 10, fontWeight: 700,
    textTransform: "uppercase" as const, letterSpacing: "0.07em",
    display: "block", marginBottom: 5,
  };
 
  const grupoStyle: React.CSSProperties = {
    display: "flex", flexDirection: "column" as const,
  };
 
  const rangoStyle: React.CSSProperties = {
    display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6,
  };
 
  return (
    <div style={{
      background: "#13181f",
      border: "1px solid #1f2937",
      borderRadius: 14,
      overflow: "hidden",
      marginBottom: 16,
      transition: "all 0.2s ease",
    }}>
      {/* Cabecera del panel */}
      <button
        onClick={() => setFiltrosAbiertos(!filtrosAbiertos)}
        style={{
          width: "100%", background: "none", border: "none",
          padding: "14px 20px", display: "flex", alignItems: "center",
          justifyContent: "space-between", cursor: "pointer",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 16 }}>🎛️</span>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>Filtros avanzados</span>
          {contarFiltrosActivos(filtros) > 0 && (
            <span style={{
              background: "#3b82f6", color: "#fff",
              borderRadius: 20, padding: "1px 9px", fontSize: 11, fontWeight: 900,
            }}>
              {contarFiltrosActivos(filtros)}
            </span>
          )}
        </div>
        <span style={{
          color: "#6b7280", fontSize: 18, fontWeight: 300,
          transform: filtrosAbiertos ? "rotate(180deg)" : "rotate(0)",
          transition: "transform 0.2s", display: "block",
        }}>⌄</span>
      </button>
 
      {/* Cuerpo desplegable */}
      {filtrosAbiertos && (
        <div style={{ padding: "0 20px 20px", borderTop: "1px solid #1f2937" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: 16,
            paddingTop: 16,
          }}>
            {/* Edad */}
            <div style={grupoStyle}>
              <label style={labelStyle}>⚙️ Edad</label>
              <div style={rangoStyle}>
                <input type="number" min="14" max="45" placeholder="Min" value={filtros.edadMin} onChange={set("edadMin")} style={inputStyle} />
                <input type="number" min="14" max="45" placeholder="Max" value={filtros.edadMax} onChange={set("edadMax")} style={inputStyle} />
              </div>
            </div>
 
            {/* Scoring */}
            <div style={grupoStyle}>
              <label style={labelStyle}>⭐ Scoring</label>
              <div style={rangoStyle}>
                <input type="number" min="0" max="10" step="0.1" placeholder="Min" value={filtros.scoringMin} onChange={set("scoringMin")} style={inputStyle} />
                <input type="number" min="0" max="10" step="0.1" placeholder="Max" value={filtros.scoringMax} onChange={set("scoringMax")} style={inputStyle} />
              </div>
            </div>
 
            {/* Valor TM */}
            <div style={grupoStyle}>
              <label style={labelStyle}>💶 Valor TM (M€)</label>
              <div style={rangoStyle}>
                <input type="number" min="0" placeholder="Min" value={filtros.valorMin} onChange={set("valorMin")} style={inputStyle} />
                <input type="number" min="0" placeholder="Max" value={filtros.valorMax} onChange={set("valorMax")} style={inputStyle} />
              </div>
            </div>
 
            {/* Altura */}
            <div style={grupoStyle}>
              <label style={labelStyle}>📏 Altura (cm)</label>
              <div style={rangoStyle}>
                <input type="number" min="150" max="220" placeholder="Min" value={filtros.alturaMin} onChange={set("alturaMin")} style={inputStyle} />
                <input type="number" min="150" max="220" placeholder="Max" value={filtros.alturaMax} onChange={set("alturaMax")} style={inputStyle} />
              </div>
            </div>
 
            {/* Pie */}
            <div style={grupoStyle}>
              <label style={labelStyle}>🦶 Pie dominante</label>
              <select value={filtros.pie} onChange={set("pie")} style={selectStyle}>
                <option value="">Cualquiera</option>
                <option value="Derecho">Derecho</option>
                <option value="Izquierdo">Izquierdo</option>
                <option value="Ambos">Ambos</option>
              </select>
            </div>
 
            {/* Pasaporte */}
            <div style={grupoStyle}>
              <label style={labelStyle}>🛂 Pasaporte</label>
              <select value={filtros.pasaporte} onChange={set("pasaporte")} style={selectStyle}>
                <option value="">Cualquiera</option>
                <option value="Comunitario">Comunitario</option>
                <option value="Extracomunitario">Extracomunitario</option>
                {pasaportes.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
 
            {/* Perfil táctico */}
            <div style={grupoStyle}>
              <label style={labelStyle}>🧠 Perfil táctico</label>
              <select value={filtros.perfilTactico} onChange={set("perfilTactico")} style={selectStyle}>
                <option value="">Cualquiera</option>
                {perfiles.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
 
            {/* Scout */}
            <div style={grupoStyle}>
              <label style={labelStyle}>👤 Scout</label>
              <select value={filtros.scout} onChange={set("scout")} style={selectStyle}>
                <option value="">Cualquiera</option>
                {scouts.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
 
            {/* Contrato */}
            <div style={grupoStyle}>
              <label style={labelStyle}>📅 Contrato hasta</label>
              <select value={filtros.contratoHasta} onChange={set("contratoHasta")} style={selectStyle}>
                <option value="">Cualquiera</option>
                <option value="libre">Libre / Sin contrato</option>
                <option value="2025">Vence 2025</option>
                <option value="2026">Vence 2026</option>
                <option value="2027">Vence 2027</option>
                <option value="2028+">2028 o más</option>
              </select>
            </div>
          </div>
 
          {/* Botón limpiar */}
          <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={() => setFiltros(FILTROS_VACIOS)}
              style={{
                background: "#1f2937", border: "1px solid #374151",
                borderRadius: 8, padding: "7px 16px",
                color: "#9ca3af", fontSize: 12, fontWeight: 700,
                cursor: "pointer",
              }}
            >
              🗑️ Limpiar filtros
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
 
// ── Contar filtros activos ────────────────────────────────────────
function contarFiltrosActivos(f: FiltrosAvanzados): number {
  return Object.values(f).filter(v => v !== "").length;
}
 
// ── Generar chips de filtros activos ─────────────────────────────
function getChips(filtros: FiltrosAvanzados, setFiltros: (f: FiltrosAvanzados) => void) {
  const chips: { label: string; clear: () => void }[] = [];
  const clear = (keys: (keyof FiltrosAvanzados)[]) => () =>
    setFiltros({ ...filtros, ...Object.fromEntries(keys.map(k => [k, ""])) });
 
  if (filtros.edadMin || filtros.edadMax)
    chips.push({ label: `Edad: ${filtros.edadMin || "?"} – ${filtros.edadMax || "?"}`, clear: clear(["edadMin", "edadMax"]) });
  if (filtros.scoringMin || filtros.scoringMax)
    chips.push({ label: `Scoring: ${filtros.scoringMin || "?"} – ${filtros.scoringMax || "?"}`, clear: clear(["scoringMin", "scoringMax"]) });
  if (filtros.valorMin || filtros.valorMax)
    chips.push({ label: `Valor: ${filtros.valorMin || "0"}–${filtros.valorMax || "∞"}M€`, clear: clear(["valorMin", "valorMax"]) });
  if (filtros.alturaMin || filtros.alturaMax)
    chips.push({ label: `Altura: ${filtros.alturaMin || "?"}–${filtros.alturaMax || "?"}cm`, clear: clear(["alturaMin", "alturaMax"]) });
  if (filtros.pie) chips.push({ label: `Pie: ${filtros.pie}`, clear: clear(["pie"]) });
  if (filtros.pasaporte) chips.push({ label: `Pasaporte: ${filtros.pasaporte}`, clear: clear(["pasaporte"]) });
  if (filtros.perfilTactico) chips.push({ label: `Perfil: ${filtros.perfilTactico}`, clear: clear(["perfilTactico"]) });
  if (filtros.scout) chips.push({ label: `Scout: ${filtros.scout}`, clear: clear(["scout"]) });
  if (filtros.contratoHasta) chips.push({ label: `Contrato: ${filtros.contratoHasta}`, clear: clear(["contratoHasta"]) });
  return chips;
}
 
// ── Aplicar filtros avanzados a lista de jugadores ───────────────
function aplicarFiltrosAvanzados(jugadores: Jugador[], f: FiltrosAvanzados): Jugador[] {
  return jugadores.filter(j => {
    const edad = parseInt(j.edad) || 0;
    const scoring = parseFloat(j.scoringIndex) || 0;
    const valor = parseFloat(j.valorTM) || 0;
    const altura = parseInt(j.altura) || 0;
 
    if (f.edadMin && edad < parseInt(f.edadMin)) return false;
    if (f.edadMax && edad > parseInt(f.edadMax)) return false;
    if (f.scoringMin && scoring < parseFloat(f.scoringMin)) return false;
    if (f.scoringMax && scoring > parseFloat(f.scoringMax)) return false;
    if (f.valorMin && valor < parseFloat(f.valorMin)) return false;
    if (f.valorMax && valor > parseFloat(f.valorMax)) return false;
    if (f.alturaMin && altura < parseInt(f.alturaMin)) return false;
    if (f.alturaMax && altura > parseInt(f.alturaMax)) return false;
    if (f.pie && !j.pie.toLowerCase().includes(f.pie.toLowerCase())) return false;
    if (f.pasaporte && !j.pasaporte.toLowerCase().includes(f.pasaporte.toLowerCase())) return false;
    if (f.perfilTactico && j.perfilTactico !== f.perfilTactico) return false;
    if (f.scout && j.scout !== f.scout) return false;
    if (f.contratoHasta) {
      const contrato = j.contratoHasta?.trim();
      if (f.contratoHasta === "libre") {
        if (contrato && contrato !== "" && contrato !== "-") return false;
      } else if (f.contratoHasta === "2028+") {
        const anio = parseInt(contrato);
        if (!anio || anio < 2028) return false;
      } else {
        if (!contrato?.includes(f.contratoHasta)) return false;
      }
    }
    return true;
  });
}
 
// ── SimuladorFairPlay (sin cambios) ──────────────────────────────
function SimuladorFairPlay({ jugadores }: { jugadores: Jugador[] }) {
  const [normativa, setNormativa] = useState<NormativaFPF>(NORMATIVAS[0]);
  const [ingresos, setIngresos] = useState("50");
  const [nominaActual, setNominaActual] = useState("28");
  const [deficitActual, setDeficitActual] = useState("10");
  const [salarioFichaje, setSalarioFichaje] = useState("3");
  const [traspasoFichaje, setTraspasoFichaje] = useState("5");
  const [jugadorSeleccionado, setJugadorSeleccionado] = useState("");
  const [amortizacion, setAmortizacion] = useState("5");
 
  const ing = parseFloat(ingresos) || 0;
  const nomActual = parseFloat(nominaActual) || 0;
  const defActual = parseFloat(deficitActual) || 0;
  const sal = parseFloat(salarioFichaje) || 0;
  const tras = parseFloat(traspasoFichaje) || 0;
  const amor = parseFloat(amortizacion) || 5;
 
  const amortizacionAnual = tras / amor;
  const costeAnualTotal = sal + amortizacionAnual;
  const nuevaNomina = nomActual + sal;
  const pctNominaActual = ing > 0 ? (nomActual / ing) * 100 : 0;
  const pctNominaNueva = ing > 0 ? (nuevaNomina / ing) * 100 : 0;
  const nuevoDeficit = defActual + (tras / normativa.periodoEvaluacion);
  const limiteNominaM = (normativa.limiteNomina / 100) * ing;
  const margenNominaTrasF = limiteNominaM - nuevaNomina;
  const cumpleNomina = pctNominaNueva <= normativa.limiteNomina;
  const cumpleDeficit = nuevoDeficit <= normativa.limiteDeficit;
  const cumpleGeneral = cumpleNomina && cumpleDeficit;
  const jugador = jugadores.find(j => j.id === jugadorSeleccionado);
 
  function getColor(ok: boolean) { return ok ? "#10b981" : "#ef4444"; }
  function getBg(ok: boolean) { return ok ? "#10b98115" : "#ef444415"; }
  function getBorder(ok: boolean) { return ok ? "#10b98130" : "#ef444430"; }
 
  return (
    <div>
      <div style={{ background: "linear-gradient(135deg, #1e1a3a, #111827)", border: "1px solid #8b5cf640", borderRadius: 14, padding: "16px 20px", marginBottom: 24, display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ fontSize: 24 }}>🔒</span>
        <div>
          <div style={{ color: "#8b5cf6", fontWeight: 700, fontSize: 14 }}>Módulo restringido — Director Deportivo / Admin</div>
          <div style={{ color: "#6b7280", fontSize: 13, marginTop: 2 }}>Simulador de Fair Play Financiero · Estimación de viabilidad de fichajes según normativa UEFA y ligas</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "#1a1f2e", border: "1px solid #1f2937", borderRadius: 14, padding: 20 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.05em" }}>📋 Normativa aplicable</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {NORMATIVAS.map(n => (
                <button key={n.nombre} onClick={() => setNormativa(n)} style={{ background: normativa.nombre === n.nombre ? n.color + "20" : "#111827", border: `1px solid ${normativa.nombre === n.nombre ? n.color + "60" : "#1f2937"}`, borderRadius: 10, padding: "10px 14px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "all 0.15s" }}>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ color: normativa.nombre === n.nombre ? n.color : "#fff", fontWeight: 700, fontSize: 13 }}>{n.nombre}</div>
                    <div style={{ color: "#6b7280", fontSize: 11, marginTop: 2 }}>{n.descripcion}</div>
                  </div>
                  <div style={{ textAlign: "right", fontSize: 11, color: "#6b7280" }}>
                    <div>Nómina ≤ {n.limiteNomina}%</div>
                    <div>Déficit ≤ {n.limiteDeficit}M€</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div style={{ background: "#1a1f2e", border: "1px solid #1f2937", borderRadius: 14, padding: 20 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.05em" }}>🏟️ Datos financieros del club</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[{ label: "Ingresos anuales (M€)", value: ingresos, set: setIngresos, icon: "💰" }, { label: "Nómina actual (M€/año)", value: nominaActual, set: setNominaActual, icon: "👥" }, { label: "Déficit acumulado (M€)", value: deficitActual, set: setDeficitActual, icon: "📉" }].map(({ label, value, set, icon }) => (
                <div key={label} style={{ gridColumn: label.includes("Déficit") ? "span 2" : "auto" }}>
                  <label style={{ color: "#9ca3af", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>{icon} {label}</label>
                  <input type="number" min="0" step="0.5" value={value} onChange={e => set(e.target.value)} style={{ width: "100%", background: "#111827", border: "1px solid #374151", borderRadius: 8, padding: "10px 12px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: "#1a1f2e", border: "1px solid #1f2937", borderRadius: 14, padding: 20 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.05em" }}>⚽ Fichaje a simular</h3>
            <div style={{ marginBottom: 14 }}>
              <label style={{ color: "#9ca3af", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4, textTransform: "uppercase" }}>👤 Jugador del radar (opcional)</label>
              <select value={jugadorSeleccionado} onChange={e => setJugadorSeleccionado(e.target.value)} style={{ width: "100%", background: "#111827", border: "1px solid #374151", borderRadius: 8, padding: "10px 12px", color: jugadorSeleccionado ? "#fff" : "#6b7280", fontSize: 13, outline: "none" }}>
                <option value="">Fichaje genérico...</option>
                {jugadores.map(j => <option key={j.id} value={j.id}>{j.apellidos}, {j.nombre} · {j.equipoActual}</option>)}
              </select>
            </div>
            {jugador && (
              <div style={{ background: "#111827", borderRadius: 10, padding: "12px 14px", marginBottom: 14, border: "1px solid #3b82f630" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #3b82f6, #2563eb)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "#fff", fontSize: 14 }}>{jugador.apellidos?.[0]}</div>
                  <div>
                    <div style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>{jugador.apellidos}, {jugador.nombre}</div>
                    <div style={{ color: "#6b7280", fontSize: 11 }}>{jugador.equipoActual} · {jugador.posicion} · {jugador.edad}</div>
                  </div>
                  {jugador.valorTM && <div style={{ marginLeft: "auto", color: "#10b981", fontWeight: 700, fontSize: 13 }}>€{jugador.valorTM}M</div>}
                </div>
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              {[{ label: "Salario anual (M€)", value: salarioFichaje, set: setSalarioFichaje, icon: "💵" }, { label: "Coste traspaso (M€)", value: traspasoFichaje, set: setTraspasoFichaje, icon: "🔄" }, { label: "Años amortización", value: amortizacion, set: setAmortizacion, icon: "📅" }].map(({ label, value, set, icon }) => (
                <div key={label}>
                  <label style={{ color: "#9ca3af", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4, textTransform: "uppercase" }}>{icon} {label}</label>
                  <input type="number" min="0" step="0.1" value={value} onChange={e => set(e.target.value)} style={{ width: "100%", background: "#111827", border: "1px solid #374151", borderRadius: 8, padding: "10px 12px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: cumpleGeneral ? "linear-gradient(135deg, #0d2818, #111827)" : "linear-gradient(135deg, #2d1212, #111827)", border: `1px solid ${cumpleGeneral ? "#10b98140" : "#ef444440"}`, borderRadius: 14, padding: 24, textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>{cumpleGeneral ? "✅" : "❌"}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: cumpleGeneral ? "#10b981" : "#ef4444", marginBottom: 8 }}>{cumpleGeneral ? "FICHAJE VIABLE" : "FICHAJE NO VIABLE"}</div>
            <div style={{ color: "#9ca3af", fontSize: 13 }}>Normativa: <span style={{ color: normativa.color, fontWeight: 700 }}>{normativa.nombre}</span></div>
          </div>
          <div style={{ background: "#1a1f2e", border: "1px solid #1f2937", borderRadius: 14, padding: 20 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 13, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.05em" }}>💰 Masa salarial</h3>
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ color: "#9ca3af", fontSize: 12 }}>Nómina actual</span><span style={{ color: "#fff", fontWeight: 700, fontSize: 12 }}>{pctNominaActual.toFixed(1)}%</span></div>
              <div style={{ background: "#111827", borderRadius: 6, height: 10, overflow: "hidden" }}><div style={{ background: "#3b82f6", height: "100%", width: `${Math.min(pctNominaActual, 100)}%`, borderRadius: 6 }} /></div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ color: "#9ca3af", fontSize: 12 }}>Con fichaje</span><span style={{ color: cumpleNomina ? "#10b981" : "#ef4444", fontWeight: 700, fontSize: 12 }}>{pctNominaNueva.toFixed(1)}%</span></div>
              <div style={{ background: "#111827", borderRadius: 6, height: 10, overflow: "hidden" }}><div style={{ background: cumpleNomina ? "#10b981" : "#ef4444", height: "100%", width: `${Math.min(pctNominaNueva, 100)}%`, borderRadius: 6 }} /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[{ label: "Nómina actual", value: `${nomActual.toFixed(1)}M€`, ok: true }, { label: "Con fichaje", value: `${nuevaNomina.toFixed(1)}M€`, ok: cumpleNomina }, { label: "Límite", value: `${limiteNominaM.toFixed(1)}M€`, ok: true }, { label: "Margen", value: `${margenNominaTrasF.toFixed(1)}M€`, ok: margenNominaTrasF >= 0 }].map(item => (
                <div key={item.label} style={{ background: getBg(item.ok), border: `1px solid ${getBorder(item.ok)}`, borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ color: "#6b7280", fontSize: 10, textTransform: "uppercase", marginBottom: 4 }}>{item.label}</div>
                  <div style={{ color: getColor(item.ok), fontWeight: 700, fontSize: 15 }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
 
// ── Componente principal ──────────────────────────────────────────
export default function Jugadores() {
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [descartados, setDescartados] = useState<Descartado[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroPosicion, setFiltroPosicion] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [ultimaActualizacion, setUltimaActualizacion] = useState("");
  const [pestana, setPestana] = useState<"activos" | "descartados" | "fairplay">("activos");
  const [descartadoDetalle, setDescartadoDetalle] = useState<Descartado | null>(null);
  const [rol, setRol] = useState<Rol>("ojeador");
  // ── Nuevo estado de filtros avanzados ──
  const [filtrosAvanzados, setFiltrosAvanzados] = useState<FiltrosAvanzados>(FILTROS_VACIOS);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
 
  function cargar() {
    Papa.parse(CSV_URL, {
      download: true, header: true, skipEmptyLines: true,
      complete: (result) => {
        setJugadores(parseJugadores(result.data as Record<string, string>[]));
        setUltimaActualizacion(new Date().toLocaleTimeString("es-ES"));
        setLoading(false);
      },
      error: () => setLoading(false),
    });
  }
 
  useEffect(() => {
    cargar();
    setDescartados(getDescartados());
    const rolGuardado = (localStorage.getItem("scoutpro_rol") as Rol) || "ojeador";
    setRol(rolGuardado);
    const interval = setInterval(cargar, 30000);
    return () => clearInterval(interval);
  }, []);
 
  const puedeVerFairPlay = rol === "admin" || rol === "director";
 
  function handleEliminarDescartado(id: string) {
    eliminarDescartado(id);
    setDescartados(getDescartados());
    if (descartadoDetalle?.id === id) setDescartadoDetalle(null);
  }
 
  const posiciones = [...new Set(jugadores.map(j => j.posicion).filter(Boolean))];
  const categorias = [...new Set(jugadores.map(j => j.categoria).filter(Boolean))];
  const idsDescartados = new Set(descartados.map(d => d.id));
 
  // ── Pipeline de filtros ───────────────────────────────────────
  const filtrados = aplicarFiltrosAvanzados(
    jugadores.filter(j => {
      if (idsDescartados.has(j.id)) return false;
      const texto = busqueda.toLowerCase();
      const coincideTexto = !busqueda ||
        `${j.apellidos} ${j.nombre}`.toLowerCase().includes(texto) ||
        j.equipoActual.toLowerCase().includes(texto) ||
        j.pais.toLowerCase().includes(texto) ||
        j.id.toLowerCase().includes(texto);
      return coincideTexto &&
        (!filtroPosicion || j.posicion === filtroPosicion) &&
        (!filtroCategoria || j.categoria === filtroCategoria);
    }),
    filtrosAvanzados
  );
 
  const chips = getChips(filtrosAvanzados, setFiltrosAvanzados);
  const totalFiltrosActivos = contarFiltrosActivos(filtrosAvanzados);
 
  const descartadosFiltrados = descartados.filter(d => {
    if (!busqueda) return true;
    const texto = busqueda.toLowerCase();
    return d.nombre.toLowerCase().includes(texto) || d.equipo.toLowerCase().includes(texto) || d.motivo.toLowerCase().includes(texto);
  });
 
  if (descartadoDetalle) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f1117", color: "#e5e7eb", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", padding: "32px 24px" }}>
          <button onClick={() => setDescartadoDetalle(null)} style={{ background: "#1f2937", border: "1px solid #374151", color: "#d1d5db", borderRadius: 8, padding: "8px 16px", fontSize: 14, cursor: "pointer", marginBottom: 24 }}>← Volver</button>
          <div style={{ background: "linear-gradient(135deg, #1e1a2e, #111827)", border: "1px solid #ef444430", borderRadius: 16, padding: "28px 32px", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#ef444420", border: "2px solid #ef444440", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 900, color: "#ef4444" }}>{descartadoDetalle.nombre[0]}</div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>{descartadoDetalle.nombre}</div>
                <div style={{ color: "#6b7280", fontSize: 13, marginTop: 2 }}>🏟️ {descartadoDetalle.equipo || "—"} · 📍 {descartadoDetalle.posicion || "—"}</div>
              </div>
              <span style={{ marginLeft: "auto", background: "#ef444420", color: "#ef4444", border: "1px solid #ef444440", borderRadius: 8, padding: "6px 14px", fontSize: 13, fontWeight: 700 }}>❌ Descartado</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
              {[{ label: "Fecha descarte", value: descartadoDetalle.fecha }, { label: "Scout", value: descartadoDetalle.scout || "—" }, { label: "Categoría", value: descartadoDetalle.categoria || "—" }].map(item => (
                <div key={item.label} style={{ background: "#111827", borderRadius: 10, padding: "12px 16px", border: "1px solid #1f2937" }}>
                  <div style={{ color: "#6b7280", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{item.label}</div>
                  <div style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>{item.value}</div>
                </div>
              ))}
            </div>
            <div style={{ background: "#111827", borderRadius: 12, padding: "18px 20px", border: "1px solid #ef444420" }}>
              <div style={{ color: "#ef4444", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8, fontWeight: 700 }}>📝 Motivo del descarte</div>
              <div style={{ color: "#e5e7eb", fontSize: 15, lineHeight: 1.7 }}>{descartadoDetalle.motivo}</div>
            </div>
          </div>
          <button onClick={() => handleEliminarDescartado(descartadoDetalle.id)} style={{ background: "#451a03", border: "1px solid #f59e0b40", borderRadius: 10, color: "#f59e0b", padding: "10px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>🔄 Reactivar jugador</button>
        </div>
      </div>
    );
  }
 
  return (
    <div style={{ minHeight: "100vh", background: "#0f1117", color: "#e5e7eb", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
 
        {/* CABECERA */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: "#fff" }}>👤 Base de jugadores</h1>
            <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 14 }}>
              {jugadores.length - idsDescartados.size} activos · {descartados.length} descartados · Actualizado {ultimaActualizacion}
            </p>
          </div>
        </div>
 
        {/* PESTAÑAS */}
        <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "#1a1f2e", borderRadius: 12, padding: 4, width: "fit-content", border: "1px solid #1f2937", flexWrap: "wrap" }}>
          <button onClick={() => setPestana("activos")} style={{ background: pestana === "activos" ? "#3b82f6" : "transparent", border: "none", borderRadius: 9, padding: "8px 20px", color: pestana === "activos" ? "#fff" : "#6b7280", fontSize: 14, fontWeight: 700, cursor: "pointer", transition: "all 0.15s" }}>
            👤 Activos ({jugadores.length - idsDescartados.size})
          </button>
          <button onClick={() => setPestana("descartados")} style={{ background: pestana === "descartados" ? "#ef4444" : "transparent", border: "none", borderRadius: 9, padding: "8px 20px", color: pestana === "descartados" ? "#fff" : "#6b7280", fontSize: 14, fontWeight: 700, cursor: "pointer", transition: "all 0.15s", display: "flex", alignItems: "center", gap: 6 }}>
            ❌ Descartados
            {descartados.length > 0 && <span style={{ background: pestana === "descartados" ? "#fff3" : "#ef444430", color: pestana === "descartados" ? "#fff" : "#ef4444", borderRadius: 20, padding: "1px 8px", fontSize: 12, fontWeight: 900 }}>{descartados.length}</span>}
          </button>
          {puedeVerFairPlay && (
            <button onClick={() => setPestana("fairplay")} style={{ background: pestana === "fairplay" ? "#8b5cf6" : "transparent", border: pestana === "fairplay" ? "none" : "1px dashed #8b5cf640", borderRadius: 9, padding: "8px 20px", color: pestana === "fairplay" ? "#fff" : "#8b5cf6", fontSize: 14, fontWeight: 700, cursor: "pointer", transition: "all 0.15s", display: "flex", alignItems: "center", gap: 6 }}>
              💰 Fair Play Financiero
              <span style={{ background: pestana === "fairplay" ? "#fff3" : "#8b5cf620", color: pestana === "fairplay" ? "#fff" : "#8b5cf6", borderRadius: 6, padding: "1px 7px", fontSize: 10, fontWeight: 900 }}>🔒</span>
            </button>
          )}
        </div>
 
        {/* BUSCADOR Y FILTROS BÁSICOS */}
        {pestana !== "fairplay" && (
          <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
            <input
              value={busqueda} onChange={e => setBusqueda(e.target.value)}
              placeholder={pestana === "activos" ? "🔍 Buscar por nombre, club, país o ID..." : "🔍 Buscar en descartados..."}
              style={{ flex: 1, minWidth: 260, background: "#1a1f2e", border: "1px solid #1f2937", borderRadius: 10, padding: "10px 16px", color: "#fff", fontSize: 14, outline: "none" }}
            />
            {pestana === "activos" && (
              <>
                <select value={filtroPosicion} onChange={e => setFiltroPosicion(e.target.value)} style={{ background: "#1a1f2e", border: "1px solid #1f2937", borderRadius: 10, padding: "10px 16px", color: filtroPosicion ? "#fff" : "#6b7280", fontSize: 14, outline: "none" }}>
                  <option value="">Todas las posiciones</option>
                  {posiciones.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)} style={{ background: "#1a1f2e", border: "1px solid #1f2937", borderRadius: 10, padding: "10px 16px", color: filtroCategoria ? "#fff" : "#6b7280", fontSize: 14, outline: "none" }}>
                  <option value="">Todas las categorías</option>
                  {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </>
            )}
          </div>
        )}
 
        {/* ── FILTROS AVANZADOS (solo pestaña activos) ── */}
        {pestana === "activos" && (
          <>
            <PanelFiltros
              jugadores={jugadores}
              filtros={filtrosAvanzados}
              setFiltros={setFiltrosAvanzados}
              filtrosAbiertos={filtrosAbiertos}
              setFiltrosAbiertos={setFiltrosAbiertos}
            />
 
            {/* Chips de filtros activos */}
            {chips.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16, alignItems: "center" }}>
                <span style={{ color: "#6b7280", fontSize: 12, fontWeight: 600 }}>Filtros activos:</span>
                {chips.map(chip => (
                  <Chip key={chip.label} label={chip.label} onRemove={chip.clear} />
                ))}
                <button
                  onClick={() => setFiltrosAvanzados(FILTROS_VACIOS)}
                  style={{ background: "none", border: "1px solid #374151", borderRadius: 20, padding: "4px 12px", color: "#6b7280", fontSize: 12, cursor: "pointer", fontWeight: 600 }}
                >
                  Limpiar todo
                </button>
              </div>
            )}
 
            {/* Contador de resultados */}
            <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ color: "#6b7280", fontSize: 13 }}>
                {filtrados.length === jugadores.length - idsDescartados.size
                  ? `${filtrados.length} jugadores`
                  : <><span style={{ color: "#60a5fa", fontWeight: 700 }}>{filtrados.length}</span> de {jugadores.length - idsDescartados.size} jugadores</>
                }
              </span>
              {totalFiltrosActivos > 0 && (
                <span style={{ background: "#3b82f615", border: "1px solid #3b82f630", borderRadius: 6, padding: "2px 8px", color: "#60a5fa", fontSize: 11, fontWeight: 600 }}>
                  {totalFiltrosActivos} filtro{totalFiltrosActivos > 1 ? "s" : ""} aplicado{totalFiltrosActivos > 1 ? "s" : ""}
                </span>
              )}
            </div>
          </>
        )}
 
        {/* ── PESTAÑA ACTIVOS ── */}
        {pestana === "activos" && (
          <>
            {loading ? (
              <div style={{ textAlign: "center", padding: 60, color: "#6b7280" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>Cargando jugadores...
              </div>
            ) : filtrados.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, color: "#6b7280" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Sin resultados</div>
                <div style={{ fontSize: 13, marginBottom: 20 }}>Ningún jugador cumple los criterios actuales</div>
                <button onClick={() => { setBusqueda(""); setFiltroPosicion(""); setFiltroCategoria(""); setFiltrosAvanzados(FILTROS_VACIOS); }} style={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 8, padding: "8px 20px", color: "#9ca3af", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>
                  Limpiar todos los filtros
                </button>
              </div>
            ) : (
              <div style={{ background: "#1a1f2e", border: "1px solid #1f2937", borderRadius: 14, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#111827", borderBottom: "1px solid #1f2937" }}>
                      {["ID", "Jugador", "Posición", "Club", "Edad", "País", "Pie", "Nota", "Scout"].map(h => (
                        <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtrados.map((j, i) => (
                      <tr key={j.id || i}
                        onClick={() => window.location.href = `/jugadores/${encodeURIComponent(j.id)}`}
                        style={{ borderBottom: "1px solid #1f2937", cursor: "pointer" }}
                        onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = "#111827"}
                        onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}>
                        <td style={{ padding: "12px 16px", fontSize: 12, color: "#6b7280", fontFamily: "monospace" }}>{j.id}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #3b82f6, #2563eb)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{j.apellidos?.[0] || "?"}</div>
                            <div>
                              <div style={{ fontWeight: 700, color: "#fff", fontSize: 14 }}>{j.apellidos}</div>
                              <div style={{ color: "#9ca3af", fontSize: 12 }}>{j.nombre}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ background: getPosColor(j.posicion) + "20", color: getPosColor(j.posicion), border: `1px solid ${getPosColor(j.posicion)}40`, borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 600 }}>{j.posicion || "—"}</span>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 14, color: "#d1d5db" }}>{j.equipoActual || "—"}</td>
                        <td style={{ padding: "12px 16px", fontSize: 14, color: "#d1d5db" }}>{j.edad || "—"}</td>
                        <td style={{ padding: "12px 16px", fontSize: 14, color: "#d1d5db" }}>{j.pais || "—"}</td>
                        <td style={{ padding: "12px 16px", fontSize: 14, color: "#d1d5db" }}>{j.pie || "—"}</td>
                        <td style={{ padding: "12px 16px" }}>
                          {j.scoringIndex ? (
                            <span style={{ background: parseFloat(j.scoringIndex) >= 8 ? "#10b98120" : parseFloat(j.scoringIndex) >= 6 ? "#f59e0b20" : "#ef444420", color: parseFloat(j.scoringIndex) >= 8 ? "#10b981" : parseFloat(j.scoringIndex) >= 6 ? "#f59e0b" : "#ef4444", borderRadius: 6, padding: "3px 10px", fontSize: 13, fontWeight: 700 }}>{j.scoringIndex}</span>
                          ) : "—"}
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 13, color: "#9ca3af" }}>{j.scout || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
 
        {/* ── PESTAÑA DESCARTADOS ── */}
        {pestana === "descartados" && (
          <>
            {descartadosFiltrados.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, color: "#6b7280" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No hay jugadores descartados</div>
                <div style={{ fontSize: 13 }}>Los jugadores descartados desde su ficha aparecerán aquí con el motivo</div>
              </div>
            ) : (
              <>
                <div style={{ background: "#1a1f2e", border: "1px solid #ef444420", borderRadius: 12, padding: "14px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 20 }}>💡</span>
                  <span style={{ color: "#9ca3af", fontSize: 13 }}>Esta memoria evita proponer de nuevo jugadores ya analizados y rechazados. Haz clic para ver el motivo completo.</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {descartadosFiltrados.map((d, i) => (
                    <div key={i} onClick={() => setDescartadoDetalle(d)}
                      style={{ background: "#1a1f2e", border: "1px solid #ef444420", borderRadius: 14, padding: "18px 24px", cursor: "pointer", transition: "all 0.15s", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}
                      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = "#ef444050"}
                      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = "#ef444420"}>
                      <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#ef444415", border: "2px solid #ef444430", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 900, color: "#ef4444", flexShrink: 0 }}>{d.nombre[0]}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                          <span style={{ fontWeight: 700, color: "#fff", fontSize: 15 }}>{d.nombre}</span>
                          {d.posicion && <span style={{ background: getPosColor(d.posicion) + "20", color: getPosColor(d.posicion), border: `1px solid ${getPosColor(d.posicion)}40`, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>{d.posicion}</span>}
                          <span style={{ background: "#ef444415", color: "#ef4444", border: "1px solid #ef444430", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>❌ Descartado</span>
                        </div>
                        <div style={{ color: "#6b7280", fontSize: 12, marginTop: 4 }}>🏟️ {d.equipo || "—"} · 📅 {d.fecha} · 👤 {d.scout || "—"}</div>
                        <div style={{ color: "#9ca3af", fontSize: 13, marginTop: 6, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", maxWidth: 500 }}>📝 {d.motivo}</div>
                      </div>
                      <button onClick={e => { e.stopPropagation(); handleEliminarDescartado(d.id); }} style={{ background: "#451a03", border: "1px solid #f59e0b30", borderRadius: 8, color: "#f59e0b", padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>🔄 Reactivar</button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
 
        {/* ── PESTAÑA FAIR PLAY ── */}
        {pestana === "fairplay" && puedeVerFairPlay && <SimuladorFairPlay jugadores={jugadores} />}
        {pestana === "fairplay" && !puedeVerFairPlay && (
          <div style={{ textAlign: "center", padding: 80, color: "#6b7280" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#9ca3af", marginBottom: 8 }}>Acceso restringido</div>
            <div style={{ fontSize: 14 }}>Este módulo solo está disponible para el Director Deportivo y el Administrador</div>
          </div>
        )}
      </div>
    </div>
  );
}