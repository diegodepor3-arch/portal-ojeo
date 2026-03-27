"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
 
const LIGAS_DISPONIBLES = [
  { id: 2021, nombre: "Premier League", pais: "Inglaterra", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { id: 2014, nombre: "LaLiga", pais: "España", flag: "🇪🇸" },
  { id: 2019, nombre: "Serie A", pais: "Italia", flag: "🇮🇹" },
  { id: 2002, nombre: "Bundesliga", pais: "Alemania", flag: "🇩🇪" },
  { id: 2015, nombre: "Ligue 1", pais: "Francia", flag: "🇫🇷" },
  { id: 2003, nombre: "Eredivisie", pais: "Países Bajos", flag: "🇳🇱" },
  { id: 2017, nombre: "Primeira Liga", pais: "Portugal", flag: "🇵🇹" },
  { id: 2016, nombre: "Championship", pais: "Inglaterra 2ª", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
];
 
type Partido = {
  id: number;
  fecha: string;
  fechaISO: string;
  hora: string;
  local: string;
  visitante: string;
  estadio: string;
  competicion: string;
  estado: string;
  golesLocal: number | null;
  golesVisitante: number | null;
};
 
type Jugador = {
  id: string;
  apellidos: string;
  nombre: string;
  equipoActual: string;
  posicion: string;
};
 
function jugadoresEnPartido(partido: Partido, jugadores: Jugador[]): Jugador[] {
  return jugadores.filter((j) => {
    const equipo = j.equipoActual.toLowerCase();
    return (
      partido.local.toLowerCase().includes(equipo) ||
      partido.visitante.toLowerCase().includes(equipo) ||
      equipo.includes(partido.local.toLowerCase()) ||
      equipo.includes(partido.visitante.toLowerCase())
    );
  });
}
 
export default function Partidos() {
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [loading, setLoading] = useState(false);
  const [ligaSeleccionada, setLigaSeleccionada] = useState<number | null>(null);
  const [busquedaEquipo, setBusquedaEquipo] = useState("");
  const [error, setError] = useState("");
  const [enCalendario, setEnCalendario] = useState<number[]>([]);
  const [toast, setToast] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
 
  // 1. Obtener usuario logueado y cargar sus datos
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      await cargarJugadores(user.id);
      await cargarCalendario(user.id);
    }
    init();
  }, []);
 
  // 2. Cargar jugadores del radar desde Supabase (filtrados por user_id)
  async function cargarJugadores(uid: string) {
    const { data, error } = await supabase
      .from("jugadores")
      .select("id, apellidos, nombre, equipo_actual, posicion")
      .eq("user_id", uid);
 
    if (error) {
      console.error("Error cargando jugadores:", error.message);
      return;
    }
 
    const parsed: Jugador[] = (data || []).map((j: any) => ({
      id: j.id,
      apellidos: j.apellidos || "",
      nombre: j.nombre || "",
      equipoActual: j.equipo_actual || "",
      posicion: j.posicion || "",
    }));
 
    setJugadores(parsed);
  }
 
  // 3. Cargar partidos guardados en calendario desde Supabase
  async function cargarCalendario(uid: string) {
    const { data, error } = await supabase
      .from("calendario_partidos")
      .select("partido_id")
      .eq("user_id", uid);
 
    if (error) {
      console.error("Error cargando calendario:", error.message);
      return;
    }
 
    setEnCalendario((data || []).map((p: any) => p.partido_id));
  }
 
  function mostrarToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }
 
  // 4. Añadir partido al calendario en Supabase
  async function handleAñadirCalendario(partido: Partido) {
    if (!userId) return;
 
    const yaExiste = enCalendario.includes(partido.id);
    if (yaExiste) {
      mostrarToast("⚠️ Este partido ya está en el calendario");
      return;
    }
 
    const { error } = await supabase.from("calendario_partidos").insert({
      user_id: userId,
      partido_id: partido.id,
      fecha: new Date(partido.fechaISO).toDateString(),
      hora: partido.hora,
      equipos: `${partido.local} vs ${partido.visitante}`,
      estado: "Pendiente",
      competicion: partido.competicion,
      estadio: partido.estadio,
    });
 
    if (error) {
      console.error("Error guardando partido:", error.message);
      mostrarToast("❌ Error al guardar el partido");
      return;
    }
 
    setEnCalendario((prev) => [...prev, partido.id]);
    mostrarToast(`✅ "${partido.local} vs ${partido.visitante}" añadido al calendario`);
  }
 
  // 5. Cargar partidos desde la API externa de fútbol
  async function cargarPartidos(ligaId: number) {
    setLoading(true);
    setError("");
    setLigaSeleccionada(ligaId);
    try {
      const hoy = new Date();
      const enUnaSemana = new Date(hoy.getTime() + 7 * 24 * 60 * 60 * 1000);
      const desde = hoy.toISOString().split("T")[0];
      const hasta = enUnaSemana.toISOString().split("T")[0];
 
      const res = await fetch(`/api/partidos?liga=${ligaId}&desde=${desde}&hasta=${hasta}`);
      const data = await res.json();
 
      if (!data.matches) {
        setError("No se encontraron partidos");
        setLoading(false);
        return;
      }
 
      const lista: Partido[] = data.matches.map((m: any) => ({
        id: m.id,
        fechaISO: m.utcDate,
        fecha: new Date(m.utcDate).toLocaleDateString("es-ES", {
          weekday: "long",
          day: "numeric",
          month: "long",
        }),
        hora: new Date(m.utcDate).toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        local: m.homeTeam.name,
        visitante: m.awayTeam.name,
        estadio: m.venue || "—",
        competicion: data.competition.name,
        estado: m.status,
        golesLocal: m.score.fullTime.home,
        golesVisitante: m.score.fullTime.away,
      }));
 
      setPartidos(lista);
    } catch {
      setError("Error al cargar partidos. Comprueba la API key.");
    }
    setLoading(false);
  }
 
  const partidosFiltrados = partidos.filter((p) => {
    if (!busquedaEquipo) return true;
    const texto = busquedaEquipo.toLowerCase();
    return (
      p.local.toLowerCase().includes(texto) ||
      p.visitante.toLowerCase().includes(texto)
    );
  });
 
  return (
    <div style={{ minHeight: "100vh", background: "#0f1117", color: "#e5e7eb", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
 
        {/* TOAST */}
        {toast && (
          <div style={{
            position: "fixed", top: 24, right: 24, zIndex: 999,
            background: "#1a1f2e", border: "1px solid #3b82f640",
            borderRadius: 12, padding: "14px 20px",
            color: "#e5e7eb", fontSize: 14, fontWeight: 600,
            boxShadow: "0 8px 32px #00000060",
          }}>
            {toast}
          </div>
        )}
 
        {/* CABECERA */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: "#fff" }}>📅 Partidos</h1>
          <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 14 }}>
            Próximos partidos esta semana · Jugadores en tu radar destacados
          </p>
        </div>
 
        {/* SELECTOR DE LIGAS */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ color: "#9ca3af", fontSize: 13, marginBottom: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Selecciona una liga
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {LIGAS_DISPONIBLES.map((liga) => (
              <button
                key={liga.id}
                onClick={() => cargarPartidos(liga.id)}
                style={{
                  background: ligaSeleccionada === liga.id ? "#3b82f6" : "#1a1f2e",
                  border: `1px solid ${ligaSeleccionada === liga.id ? "#3b82f6" : "#1f2937"}`,
                  borderRadius: 10, padding: "10px 16px",
                  color: ligaSeleccionada === liga.id ? "#fff" : "#9ca3af",
                  fontSize: 13, fontWeight: 600, cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {liga.flag} {liga.nombre}
              </button>
            ))}
          </div>
        </div>
 
        {/* BUSCADOR */}
        {partidos.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <input
              value={busquedaEquipo}
              onChange={(e) => setBusquedaEquipo(e.target.value)}
              placeholder="🔍 Buscar por equipo..."
              style={{
                width: "100%", maxWidth: 400,
                background: "#1a1f2e", border: "1px solid #1f2937",
                borderRadius: 10, padding: "10px 16px",
                color: "#fff", fontSize: 14, outline: "none",
              }}
            />
          </div>
        )}
 
        {/* ESTADOS */}
        {loading && (
          <div style={{ textAlign: "center", padding: 60, color: "#6b7280" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>Cargando partidos...
          </div>
        )}
        {error && (
          <div style={{ background: "#451a03", border: "1px solid #f59e0b40", borderRadius: 12, padding: 20, color: "#f59e0b" }}>
            ⚠️ {error}
          </div>
        )}
        {!loading && !error && ligaSeleccionada && partidosFiltrados.length === 0 && (
          <div style={{ textAlign: "center", padding: 60, color: "#6b7280" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            No hay partidos esta semana en esta liga
          </div>
        )}
        {!loading && !ligaSeleccionada && (
          <div style={{ textAlign: "center", padding: 60, color: "#6b7280" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>👆</div>
            Selecciona una liga para ver los próximos partidos
          </div>
        )}
 
        {/* LISTA DE PARTIDOS */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {partidosFiltrados.map((partido) => {
            const enRadar = jugadoresEnPartido(partido, jugadores);
            const yaEnCalendario = enCalendario.includes(partido.id);
            return (
              <div
                key={partido.id}
                style={{
                  background: "#1a1f2e",
                  border: `1px solid ${enRadar.length > 0 ? "#3b82f640" : "#1f2937"}`,
                  borderRadius: 14, padding: "20px 24px",
                  boxShadow: enRadar.length > 0 ? "0 0 20px #3b82f610" : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
 
                  {/* FECHA Y HORA */}
                  <div style={{ minWidth: 120 }}>
                    <div style={{ color: "#6b7280", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>{partido.fecha}</div>
                    <div style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>{partido.hora}</div>
                  </div>
 
                  {/* EQUIPOS */}
                  <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                    <div style={{ textAlign: "right", flex: 1 }}>
                      <div style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>{partido.local}</div>
                    </div>
                    <div style={{
                      background: "#111827", border: "1px solid #374151",
                      borderRadius: 8, padding: "6px 14px",
                      color: "#6b7280", fontWeight: 900, fontSize: 14,
                      minWidth: 60, textAlign: "center",
                    }}>
                      {partido.estado === "FINISHED"
                        ? `${partido.golesLocal} - ${partido.golesVisitante}`
                        : "VS"}
                    </div>
                    <div style={{ textAlign: "left", flex: 1 }}>
                      <div style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>{partido.visitante}</div>
                    </div>
                  </div>
 
                  {/* ESTADIO + BOTÓN CALENDARIO */}
                  <div style={{ minWidth: 140, textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                    <div>
                      <div style={{ color: "#6b7280", fontSize: 12 }}>🏟️ {partido.estadio}</div>
                      <div style={{ color: "#6b7280", fontSize: 11, marginTop: 2 }}>{partido.competicion}</div>
                    </div>
                    <button
                      onClick={() => handleAñadirCalendario(partido)}
                      style={{
                        background: yaEnCalendario ? "#10b98120" : "#3b82f620",
                        border: `1px solid ${yaEnCalendario ? "#10b98140" : "#3b82f640"}`,
                        borderRadius: 8, padding: "6px 12px",
                        color: yaEnCalendario ? "#10b981" : "#60a5fa",
                        fontSize: 12, fontWeight: 700,
                        cursor: yaEnCalendario ? "default" : "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      {yaEnCalendario ? "✓ En calendario" : "📅 Añadir al calendario"}
                    </button>
                  </div>
                </div>
 
                {/* JUGADORES EN RADAR */}
                {enRadar.length > 0 && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #1f2937" }}>
                    <div style={{ color: "#3b82f6", fontSize: 12, fontWeight: 700, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      🎯 {enRadar.length} jugador{enRadar.length > 1 ? "es" : ""} en tu radar
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {enRadar.map((j) => (
                        <a
                          key={j.id}
                          href={`/jugadores/${encodeURIComponent(j.id)}`}
                          style={{
                            background: "#3b82f620", border: "1px solid #3b82f640",
                            borderRadius: 8, padding: "6px 12px",
                            color: "#93c5fd", fontSize: 13, fontWeight: 600,
                            textDecoration: "none", display: "flex", alignItems: "center", gap: 6,
                          }}
                        >
                          <div style={{
                            width: 24, height: 24, borderRadius: "50%",
                            background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 11, fontWeight: 700, color: "#fff",
                          }}>
                            {j.apellidos?.[0] || "?"}
                          </div>
                          {j.apellidos}, {j.nombre}
                          <span style={{ color: "#6b7280", fontSize: 11 }}>· {j.posicion}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
 