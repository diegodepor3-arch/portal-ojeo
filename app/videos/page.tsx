"use client";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
 
// ── Types ──────────────────────────────────────────────────────────
type Clip = {
  id: string;
  jugador: string;
  equipo: string;
  categoria: "Gol" | "Asistencia" | "Duelo" | "Pérdida" | "Táctica" | "Otro";
  titulo: string;
  url: string;
  fecha: string;
  notas: string;
  anotaciones: Anotacion[];
};
 
type Anotacion = {
  id: string;
  tipo: "flecha" | "circulo" | "texto" | "rectangulo";
  x: number; y: number;
  x2?: number; y2?: number;
  texto?: string;
  color: string;
  timestamp: number;
};
 
type Herramienta = "flecha" | "circulo" | "texto" | "rectangulo" | "selector";
 
// ── Utilidades ─────────────────────────────────────────────────────
function embedUrl(url: string): string {
  if (!url) return "";
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?enablejsapi=1`;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return url;
}
 
function isEmbed(url: string): boolean {
  return url.includes("youtube") || url.includes("youtu.be") || url.includes("vimeo");
}
 
const CATEGORIAS = ["Gol", "Asistencia", "Duelo", "Pérdida", "Táctica", "Otro"] as const;
const CAT_COLORES: Record<string, string> = {
  Gol: "#10b981", Asistencia: "#3b82f6", Duelo: "#f59e0b",
  Pérdida: "#ef4444", Táctica: "#8b5cf6", Otro: "#6b7280",
};
const HERRAMIENTA_COLORES = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#fff", "#8b5cf6"];
 
// ── Componente principal ───────────────────────────────────────────
export default function Videos() {
  const [clips, setClips] = useState<Clip[]>([]);
  const [pestana, setPestana] = useState<"biblioteca" | "anotaciones" | "comparacion" | "ia">("biblioteca");
  const [clipSeleccionado, setClipSeleccionado] = useState<Clip | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroJugador, setFiltroJugador] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
 
  // 1. Obtener usuario y cargar clips
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      await cargarClips(user.id);
    }
    init();
  }, []);
 
  async function cargarClips(uid: string) {
    setCargando(true);
    const { data, error } = await supabase
      .from("video_clips")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });
 
    if (error) {
      console.error("Error cargando clips:", error.message);
      setCargando(false);
      return;
    }
 
    const parsed: Clip[] = (data || []).map((c: any) => ({
      id: c.id,
      jugador: c.jugador || "",
      equipo: c.equipo || "",
      categoria: c.categoria || "Otro",
      titulo: c.titulo || "",
      url: c.url || "",
      fecha: c.fecha || "",
      notas: c.notas || "",
      anotaciones: Array.isArray(c.anotaciones) ? c.anotaciones : [],
    }));
 
    setClips(parsed);
    setCargando(false);
  }
 
  // 2. Guardar nuevo clip en Supabase
  async function guardarClip(clip: Clip) {
    if (!userId) return;
    const { data, error } = await supabase.from("video_clips").insert({
      user_id: userId,
      titulo: clip.titulo,
      jugador: clip.jugador,
      equipo: clip.equipo,
      categoria: clip.categoria,
      url: clip.url,
      notas: clip.notas,
      anotaciones: clip.anotaciones,
      fecha: clip.fecha,
    }).select().single();
 
    if (error) { console.error("Error guardando clip:", error.message); return; }
    setClips(prev => [{ ...clip, id: data.id }, ...prev]);
  }
 
  // 3. Eliminar clip
  async function eliminarClip(id: string) {
    const { error } = await supabase.from("video_clips").delete().eq("id", id);
    if (error) { console.error("Error eliminando clip:", error.message); return; }
    setClips(prev => prev.filter(c => c.id !== id));
    if (clipSeleccionado?.id === id) setClipSeleccionado(null);
  }
 
  // 4. Actualizar anotaciones
  async function actualizarAnotaciones(clipId: string, anotaciones: Anotacion[]) {
    const { error } = await supabase
      .from("video_clips")
      .update({ anotaciones })
      .eq("id", clipId);
 
    if (error) { console.error("Error actualizando anotaciones:", error.message); return; }
    setClips(prev => prev.map(c => c.id === clipId ? { ...c, anotaciones } : c));
    setClipSeleccionado(prev => prev?.id === clipId ? { ...prev, anotaciones } : prev);
  }
 
  const jugadores = [...new Set(clips.map(c => c.jugador).filter(Boolean))];
  const filtrados = clips.filter(c => {
    const txt = busqueda.toLowerCase();
    return (
      (!busqueda || c.jugador.toLowerCase().includes(txt) || c.titulo.toLowerCase().includes(txt) || c.equipo.toLowerCase().includes(txt)) &&
      (!filtroCategoria || c.categoria === filtroCategoria) &&
      (!filtroJugador || c.jugador === filtroJugador)
    );
  });
 
  return (
    <div style={{ minHeight: "100vh", background: "#0f1117", color: "#e5e7eb", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 1300, margin: "0 auto", padding: "32px 24px" }}>
 
        {/* CABECERA */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: "#fff" }}>🎬 Vídeos</h1>
            <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 14 }}>{clips.length} clips · Biblioteca de análisis táctico</p>
          </div>
          <button onClick={() => setMostrarForm(true)} style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)", border: "none", borderRadius: 10, color: "#fff", padding: "10px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            + Añadir clip
          </button>
        </div>
 
        {/* PESTAÑAS */}
        <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "#1a1f2e", borderRadius: 12, padding: 4, width: "fit-content", border: "1px solid #1f2937" }}>
          {[
            { id: "biblioteca", label: "📚 Biblioteca" },
            { id: "anotaciones", label: "✏️ Anotaciones" },
            { id: "comparacion", label: "⚖️ Comparación" },
            { id: "ia", label: "🤖 Análisis IA" },
          ].map(p => (
            <button key={p.id} onClick={() => setPestana(p.id as typeof pestana)} style={{
              background: pestana === p.id ? "#3b82f6" : "transparent",
              border: "none", borderRadius: 9, padding: "8px 18px",
              color: pestana === p.id ? "#fff" : "#6b7280",
              fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.15s",
            }}>{p.label}</button>
          ))}
        </div>
 
        {cargando ? (
          <div style={{ textAlign: "center", padding: 80, color: "#6b7280" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>Cargando clips...
          </div>
        ) : (
          <>
            {pestana === "biblioteca" && (
              <Biblioteca
                clips={filtrados} jugadores={jugadores}
                busqueda={busqueda} setBusqueda={setBusqueda}
                filtroCategoria={filtroCategoria} setFiltroCategoria={setFiltroCategoria}
                filtroJugador={filtroJugador} setFiltroJugador={setFiltroJugador}
                onSeleccionar={(c: Clip) => { setClipSeleccionado(c); setPestana("anotaciones"); }}
                onEliminar={eliminarClip}
              />
            )}
            {pestana === "anotaciones" && (
              <Anotaciones clips={clips} clipInicial={clipSeleccionado} onActualizarAnotaciones={actualizarAnotaciones} />
            )}
            {pestana === "comparacion" && <Comparacion clips={clips} />}
            {pestana === "ia" && <AnalisisIA clips={clips} />}
          </>
        )}
      </div>
 
      {mostrarForm && (
        <ModalAddClip
          onGuardar={(clip: Clip) => { guardarClip(clip); setMostrarForm(false); }}
          onCerrar={() => setMostrarForm(false)}
        />
      )}
    </div>
  );
}
 
// ── BIBLIOTECA ─────────────────────────────────────────────────────
function Biblioteca({ clips, jugadores, busqueda, setBusqueda, filtroCategoria, setFiltroCategoria, filtroJugador, setFiltroJugador, onSeleccionar, onEliminar }: {
  clips: Clip[]; jugadores: string[];
  busqueda: string; setBusqueda: (v: string) => void;
  filtroCategoria: string; setFiltroCategoria: (v: string) => void;
  filtroJugador: string; setFiltroJugador: (v: string) => void;
  onSeleccionar: (c: Clip) => void; onEliminar: (id: string) => void;
}) {
  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="🔍 Buscar por jugador, título..." style={{ flex: 1, minWidth: 220, background: "#1a1f2e", border: "1px solid #1f2937", borderRadius: 10, padding: "10px 16px", color: "#fff", fontSize: 14, outline: "none" }} />
        <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)} style={{ background: "#1a1f2e", border: "1px solid #1f2937", borderRadius: 10, padding: "10px 14px", color: filtroCategoria ? "#fff" : "#6b7280", fontSize: 13, outline: "none" }}>
          <option value="">Todas las categorías</option>
          {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filtroJugador} onChange={e => setFiltroJugador(e.target.value)} style={{ background: "#1a1f2e", border: "1px solid #1f2937", borderRadius: 10, padding: "10px 14px", color: filtroJugador ? "#fff" : "#6b7280", fontSize: 13, outline: "none" }}>
          <option value="">Todos los jugadores</option>
          {jugadores.map((j: string) => <option key={j} value={j}>{j}</option>)}
        </select>
      </div>
 
      {clips.length === 0 ? (
        <div style={{ textAlign: "center", padding: 80, color: "#6b7280" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎬</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: "#9ca3af" }}>No hay clips todavía</div>
          <div style={{ fontSize: 14 }}>Añade URLs de YouTube/Vimeo para empezar</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {clips.map((clip: Clip) => (
            <div key={clip.id} style={{ background: "#1a1f2e", border: "1px solid #1f2937", borderRadius: 14, overflow: "hidden", transition: "border-color 0.15s" }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = "#3b82f640"}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = "#1f2937"}>
              <div style={{ background: "#111827", height: 160, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative" }}
                onClick={() => onSeleccionar(clip)}>
                {(clip.url.includes("youtube") || clip.url.includes("youtu.be")) ? (
                  <img
                    src={`https://img.youtube.com/vi/${clip.url.match(/(?:v=|youtu\.be\/)([^&\s]+)/)?.[1]}/hqdefault.jpg`}
                    style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.7 }}
                    alt=""
                  />
                ) : (
                  <div style={{ fontSize: 48 }}>🎬</div>
                )}
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#000000aa", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>▶️</div>
                </div>
                {clip.anotaciones?.length > 0 && (
                  <div style={{ position: "absolute", top: 8, right: 8, background: "#8b5cf6", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700, color: "#fff" }}>
                    ✏️ {clip.anotaciones.length}
                  </div>
                )}
              </div>
              <div style={{ padding: "14px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, color: "#fff", fontSize: 14 }}>{clip.titulo}</div>
                    <div style={{ color: "#6b7280", fontSize: 12, marginTop: 2 }}>👤 {clip.jugador} · 🏟️ {clip.equipo}</div>
                  </div>
                  <span style={{ background: CAT_COLORES[clip.categoria] + "20", color: CAT_COLORES[clip.categoria], border: `1px solid ${CAT_COLORES[clip.categoria]}40`, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
                    {clip.categoria}
                  </span>
                </div>
                {clip.notas && <div style={{ color: "#6b7280", fontSize: 12, marginBottom: 10, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{clip.notas}</div>}
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => onSeleccionar(clip)} style={{ flex: 1, background: "#3b82f620", border: "1px solid #3b82f630", borderRadius: 8, color: "#60a5fa", padding: "7px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>✏️ Anotar</button>
                  <button onClick={() => onEliminar(clip.id)} style={{ background: "#ef444415", border: "1px solid #ef444430", borderRadius: 8, color: "#ef4444", padding: "7px 10px", fontSize: 12, cursor: "pointer" }}>🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
 
// ── ANOTACIONES ────────────────────────────────────────────────────
function Anotaciones({ clips, clipInicial, onActualizarAnotaciones }: {
  clips: Clip[];
  clipInicial: Clip | null;
  onActualizarAnotaciones: (id: string, a: Anotacion[]) => void;
}) {
  const [clip, setClip] = useState<Clip | null>(clipInicial);
  const [herramienta, setHerramienta] = useState<Herramienta>("flecha");
  const [color, setColor] = useState("#ef4444");
  const [anotaciones, setAnotaciones] = useState<Anotacion[]>(clipInicial?.anotaciones || []);
  const [dibujando, setDibujando] = useState(false);
  const [inicio, setInicio] = useState({ x: 0, y: 0 });
  const [textoInput, setTextoInput] = useState("");
  const [esperandoTexto, setEsperandoTexto] = useState<{ x: number; y: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
 
  useEffect(() => {
    if (clipInicial) { setClip(clipInicial); setAnotaciones(clipInicial.anotaciones || []); }
  }, [clipInicial]);
 
  useEffect(() => { dibujarCanvas(); }, [anotaciones]);
 
  function dibujarCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    anotaciones.forEach(a => dibujarAnotacion(ctx, a));
  }
 
  function dibujarAnotacion(ctx: CanvasRenderingContext2D, a: Anotacion) {
    ctx.strokeStyle = a.color; ctx.fillStyle = a.color;
    ctx.lineWidth = 2.5; ctx.font = "bold 16px Segoe UI";
    if (a.tipo === "flecha" && a.x2 !== undefined && a.y2 !== undefined) {
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(a.x2, a.y2); ctx.stroke();
      const angle = Math.atan2(a.y2 - a.y, a.x2 - a.x);
      ctx.beginPath();
      ctx.moveTo(a.x2, a.y2);
      ctx.lineTo(a.x2 - 15 * Math.cos(angle - 0.4), a.y2 - 15 * Math.sin(angle - 0.4));
      ctx.lineTo(a.x2 - 15 * Math.cos(angle + 0.4), a.y2 - 15 * Math.sin(angle + 0.4));
      ctx.closePath(); ctx.fill();
    } else if (a.tipo === "circulo" && a.x2 !== undefined && a.y2 !== undefined) {
      const rx = Math.abs(a.x2 - a.x) / 2, ry = Math.abs(a.y2 - a.y) / 2;
      const cx = (a.x + a.x2) / 2, cy = (a.y + a.y2) / 2;
      ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
    } else if (a.tipo === "rectangulo" && a.x2 !== undefined && a.y2 !== undefined) {
      ctx.strokeRect(a.x, a.y, a.x2 - a.x, a.y2 - a.y);
    } else if (a.tipo === "texto" && a.texto) {
      ctx.fillText(a.texto, a.x, a.y);
    }
  }
 
  function getPosCanvas(e: React.MouseEvent): { x: number; y: number } {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  }
 
  function onMouseDown(e: React.MouseEvent) {
    if (herramienta === "selector") return;
    if (herramienta === "texto") { setEsperandoTexto(getPosCanvas(e)); return; }
    setDibujando(true); setInicio(getPosCanvas(e));
  }
 
  function onMouseMove(e: React.MouseEvent) {
    if (!dibujando) return;
    const pos = getPosCanvas(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    anotaciones.forEach(a => dibujarAnotacion(ctx, a));
    const preview: Anotacion = { id: "preview", tipo: herramienta as Anotacion["tipo"], x: inicio.x, y: inicio.y, x2: pos.x, y2: pos.y, color, timestamp: 0 };
    dibujarAnotacion(ctx, preview);
  }
 
  function onMouseUp(e: React.MouseEvent) {
    if (!dibujando) return;
    setDibujando(false);
    const pos = getPosCanvas(e);
    const nueva: Anotacion = { id: Date.now().toString(), tipo: herramienta as Anotacion["tipo"], x: inicio.x, y: inicio.y, x2: pos.x, y2: pos.y, color, timestamp: 0 };
    const nuevas = [...anotaciones, nueva];
    setAnotaciones(nuevas);
    if (clip) onActualizarAnotaciones(clip.id, nuevas);
  }
 
  function confirmarTexto() {
    if (!esperandoTexto || !textoInput.trim()) { setEsperandoTexto(null); setTextoInput(""); return; }
    const nueva: Anotacion = { id: Date.now().toString(), tipo: "texto", x: esperandoTexto.x, y: esperandoTexto.y, texto: textoInput, color, timestamp: 0 };
    const nuevas = [...anotaciones, nueva];
    setAnotaciones(nuevas);
    if (clip) onActualizarAnotaciones(clip.id, nuevas);
    setEsperandoTexto(null); setTextoInput("");
  }
 
  function deshacerUltima() {
    const nuevas = anotaciones.slice(0, -1);
    setAnotaciones(nuevas);
    if (clip) onActualizarAnotaciones(clip.id, nuevas);
  }
 
  function limpiarTodo() {
    setAnotaciones([]);
    if (clip) onActualizarAnotaciones(clip.id, []);
  }
 
  return (
    <div>
      {!clip ? (
        <div>
          <p style={{ color: "#9ca3af", marginBottom: 16, fontSize: 14 }}>Selecciona un clip de tu biblioteca para anotarlo:</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
            {clips.length === 0 ? (
              <div style={{ color: "#6b7280", padding: 40 }}>No hay clips. Añade uno desde Biblioteca.</div>
            ) : clips.map((c: Clip) => (
              <div key={c.id} onClick={() => { setClip(c); setAnotaciones(c.anotaciones || []); }}
                style={{ background: "#1a1f2e", border: "1px solid #1f2937", borderRadius: 12, padding: "14px 16px", cursor: "pointer" }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = "#3b82f6"}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = "#1f2937"}>
                <div style={{ fontWeight: 700, color: "#fff", fontSize: 14 }}>{c.titulo}</div>
                <div style={{ color: "#6b7280", fontSize: 12, marginTop: 4 }}>👤 {c.jugador}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
            <div>
              <button onClick={() => setClip(null)} style={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 8, color: "#9ca3af", padding: "6px 14px", fontSize: 13, cursor: "pointer", marginRight: 12 }}>← Cambiar clip</button>
              <span style={{ color: "#fff", fontWeight: 700 }}>{clip.titulo}</span>
              <span style={{ color: "#6b7280", fontSize: 13, marginLeft: 8 }}>· {anotaciones.length} anotaciones</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={deshacerUltima} style={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 8, color: "#9ca3af", padding: "6px 12px", fontSize: 12, cursor: "pointer" }}>↩ Deshacer</button>
              <button onClick={limpiarTodo} style={{ background: "#ef444415", border: "1px solid #ef444430", borderRadius: 8, color: "#ef4444", padding: "6px 12px", fontSize: 12, cursor: "pointer" }}>🗑️ Limpiar</button>
            </div>
          </div>
 
          <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
            {([
              { id: "flecha", label: "↗ Flecha" },
              { id: "circulo", label: "⭕ Círculo" },
              { id: "rectangulo", label: "▭ Rect." },
              { id: "texto", label: "T Texto" },
            ] as { id: Herramienta; label: string }[]).map(h => (
              <button key={h.id} onClick={() => setHerramienta(h.id)} style={{
                background: herramienta === h.id ? "#3b82f6" : "#1a1f2e",
                border: `1px solid ${herramienta === h.id ? "#3b82f6" : "#1f2937"}`,
                borderRadius: 8, color: herramienta === h.id ? "#fff" : "#9ca3af",
                padding: "7px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}>{h.label}</button>
            ))}
            <div style={{ display: "flex", gap: 6, marginLeft: 8 }}>
              {HERRAMIENTA_COLORES.map(c => (
                <div key={c} onClick={() => setColor(c)} style={{ width: 24, height: 24, borderRadius: "50%", background: c, cursor: "pointer", border: color === c ? "3px solid #fff" : "2px solid #374151" }} />
              ))}
            </div>
          </div>
 
          {esperandoTexto && (
            <div style={{ background: "#1a1f2e", border: "1px solid #3b82f6", borderRadius: 10, padding: "12px 16px", marginBottom: 12, display: "flex", gap: 10, alignItems: "center" }}>
              <input value={textoInput} onChange={e => setTextoInput(e.target.value)} onKeyDown={e => e.key === "Enter" && confirmarTexto()} placeholder="Escribe el texto..." autoFocus style={{ flex: 1, background: "#111827", border: "1px solid #374151", borderRadius: 8, padding: "8px 12px", color: "#fff", fontSize: 14, outline: "none" }} />
              <button onClick={confirmarTexto} style={{ background: "#3b82f6", border: "none", borderRadius: 8, color: "#fff", padding: "8px 16px", fontWeight: 700, cursor: "pointer" }}>OK</button>
              <button onClick={() => { setEsperandoTexto(null); setTextoInput(""); }} style={{ background: "#374151", border: "none", borderRadius: 8, color: "#9ca3af", padding: "8px 12px", cursor: "pointer" }}>✕</button>
            </div>
          )}
 
          <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", background: "#000", borderRadius: 12, overflow: "hidden" }}>
            {isEmbed(clip.url) ? (
              <iframe src={embedUrl(clip.url)} style={{ width: "100%", height: "100%", border: "none" }} allowFullScreen />
            ) : (
              <video src={clip.url} controls style={{ width: "100%", height: "100%" }} />
            )}
            <canvas
              ref={canvasRef} width={1280} height={720}
              onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp}
              style={{
                position: "absolute", inset: 0, width: "100%", height: "100%",
                cursor: herramienta === "texto" ? "text" : herramienta === "selector" ? "default" : "crosshair",
                pointerEvents: herramienta === "selector" ? "none" : "auto",
              }}
            />
          </div>
          <p style={{ color: "#6b7280", fontSize: 12, marginTop: 8 }}>💡 Las anotaciones se guardan automáticamente en Supabase.</p>
        </div>
      )}
    </div>
  );
}
 
// ── COMPARACIÓN ────────────────────────────────────────────────────
function Comparacion({ clips }: { clips: Clip[] }) {
  const [clipA, setClipA] = useState<string>("");
  const [clipB, setClipB] = useState<string>("");
  const A = clips.find(c => c.id === clipA);
  const B = clips.find(c => c.id === clipB);
 
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        {([{ label: "Jugador A", value: clipA, set: setClipA }, { label: "Jugador B", value: clipB, set: setClipB }] as { label: string; value: string; set: (v: string) => void }[]).map(({ label, value, set }) => (
          <div key={label}>
            <label style={{ color: "#9ca3af", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>{label}</label>
            <select value={value} onChange={e => set(e.target.value)} style={{ width: "100%", background: "#1a1f2e", border: "1px solid #1f2937", borderRadius: 10, padding: "10px 14px", color: value ? "#fff" : "#6b7280", fontSize: 14, outline: "none" }}>
              <option value="">Seleccionar clip...</option>
              {clips.map(c => <option key={c.id} value={c.id}>{c.jugador} — {c.titulo}</option>)}
            </select>
          </div>
        ))}
      </div>
 
      {!clipA && !clipB ? (
        <div style={{ textAlign: "center", padding: 60, color: "#6b7280" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚖️</div>
          Selecciona dos clips para comparar jugadores lado a lado
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {[A, B].map((clip, i) => (
            <div key={i} style={{ background: "#1a1f2e", border: "1px solid #1f2937", borderRadius: 14, overflow: "hidden" }}>
              {clip ? (
                <>
                  <div style={{ background: "#111827", padding: "10px 16px", borderBottom: "1px solid #1f2937", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 700, color: "#fff", fontSize: 14 }}>{clip.jugador}</div>
                      <div style={{ color: "#6b7280", fontSize: 12 }}>{clip.titulo}</div>
                    </div>
                    <span style={{ background: CAT_COLORES[clip.categoria] + "20", color: CAT_COLORES[clip.categoria], borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{clip.categoria}</span>
                  </div>
                  <div style={{ aspectRatio: "16/9", background: "#000" }}>
                    {isEmbed(clip.url) ? (
                      <iframe src={embedUrl(clip.url)} style={{ width: "100%", height: "100%", border: "none" }} allowFullScreen />
                    ) : (
                      <video src={clip.url} controls style={{ width: "100%", height: "100%" }} />
                    )}
                  </div>
                  {clip.notas && <div style={{ padding: "12px 16px", color: "#9ca3af", fontSize: 13 }}>{clip.notas}</div>}
                </>
              ) : (
                <div style={{ aspectRatio: "16/9", display: "flex", alignItems: "center", justifyContent: "center", color: "#374151", fontSize: 14 }}>Sin clip seleccionado</div>
              )}
            </div>
          ))}
        </div>
      )}
 
      {A && B && (
        <div style={{ background: "#1a1f2e", border: "1px solid #1f2937", borderRadius: 14, padding: 20, marginTop: 16 }}>
          <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.05em" }}>📊 Comparativa rápida</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 12, alignItems: "center" }}>
            {[
              { label: "Jugador", valA: A.jugador, valB: B.jugador },
              { label: "Club", valA: A.equipo, valB: B.equipo },
              { label: "Categoría", valA: A.categoria, valB: B.categoria },
              { label: "Anotaciones", valA: String(A.anotaciones?.length || 0), valB: String(B.anotaciones?.length || 0) },
              { label: "Notas", valA: A.notas || "—", valB: B.notas || "—" },
            ].map((row, i) => (
              <div key={i} style={{ display: "contents" }}>
                <div style={{ textAlign: "right", color: "#e5e7eb", fontSize: 13, fontWeight: 600 }}>{row.valA}</div>
                <div style={{ textAlign: "center", color: "#6b7280", fontSize: 11, fontWeight: 700, textTransform: "uppercase", whiteSpace: "nowrap" }}>{row.label}</div>
                <div style={{ textAlign: "left", color: "#e5e7eb", fontSize: 13, fontWeight: 600 }}>{row.valB}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
 
// ── ANÁLISIS IA ────────────────────────────────────────────────────
function AnalisisIA({ clips }: { clips: Clip[] }) {
  const [clipId, setClipId] = useState("");
  const [analisis, setAnalisis] = useState("");
  const [loading, setLoading] = useState(false);
  const [tipoAnalisis, setTipoAnalisis] = useState<"tactica" | "tecnica" | "fisico" | "informe">("tactica");
  const clip = clips.find(c => c.id === clipId);
 
  async function analizarClip() {
    if (!clip) return;
    setLoading(true); setAnalisis("");
    const prompts: Record<string, string> = {
      tactica: `Eres un analista táctico de fútbol experto. Analiza este clip del jugador ${clip.jugador} que juega en ${clip.equipo}. El clip es de categoría "${clip.categoria}" y se titula "${clip.titulo}". ${clip.notas ? `Notas del scout: ${clip.notas}.` : ""} Proporciona un análisis táctico detallado con: 1) Movimientos tácticos observados, 2) Posicionamiento, 3) Toma de decisiones, 4) Puntos fuertes y áreas de mejora táctica.`,
      tecnica: `Eres un analista técnico de fútbol. Para el clip del jugador ${clip.jugador} titulado "${clip.titulo}" (${clip.categoria}), analiza: 1) Técnica individual, 2) Control de balón, 3) Pase y recepción, 4) Calidad de la acción técnica. ${clip.notas ? `Contexto: ${clip.notas}.` : ""}`,
      fisico: `Analiza el rendimiento físico del jugador ${clip.jugador} en el clip "${clip.titulo}". Evalúa: 1) Velocidad y explosividad, 2) Duelos físicos, 3) Capacidad de presión, 4) Resistencia observada. ${clip.notas ? `Notas: ${clip.notas}.` : ""}`,
      informe: `Genera un informe completo de scouting del jugador ${clip.jugador} (${clip.equipo}) basado en el clip "${clip.titulo}" (${clip.categoria}). ${clip.notas ? `Observaciones: ${clip.notas}.` : ""} Incluye: valoración global, aspectos técnicos, tácticos y físicos, y recomendación final (Fichar / Seguir / Descartar) con justificación.`,
    };
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompts[tipoAnalisis] }],
        }),
      });
      const data = await res.json();
      setAnalisis(data.content?.map((b: { text?: string }) => b.text || "").join("\n") || "Sin respuesta");
    } catch {
      setAnalisis("Error al conectar con la IA.");
    }
    setLoading(false);
  }
 
  return (
    <div>
      <div style={{ background: "#1a1f2e", border: "1px solid #8b5cf640", borderRadius: 14, padding: 24, marginBottom: 20 }}>
        <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: "#fff" }}>🤖 Análisis automático con IA</h3>
        <p style={{ margin: "0 0 20px", color: "#6b7280", fontSize: 13 }}>Selecciona un clip y el tipo de análisis. La IA generará un informe basado en los metadatos y notas del clip.</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
          <div>
            <label style={{ color: "#9ca3af", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>Clip a analizar</label>
            <select value={clipId} onChange={e => setClipId(e.target.value)} style={{ width: "100%", background: "#111827", border: "1px solid #1f2937", borderRadius: 10, padding: "10px 14px", color: clipId ? "#fff" : "#6b7280", fontSize: 14, outline: "none" }}>
              <option value="">Seleccionar clip...</option>
              {clips.map(c => <option key={c.id} value={c.id}>{c.jugador} — {c.titulo} ({c.categoria})</option>)}
            </select>
          </div>
          <div>
            <label style={{ color: "#9ca3af", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>Tipo de análisis</label>
            <select value={tipoAnalisis} onChange={e => setTipoAnalisis(e.target.value as typeof tipoAnalisis)} style={{ width: "100%", background: "#111827", border: "1px solid #1f2937", borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: 14, outline: "none" }}>
              <option value="tactica">🧠 Análisis táctico</option>
              <option value="tecnica">⚽ Análisis técnico</option>
              <option value="fisico">💪 Análisis físico</option>
              <option value="informe">📄 Informe completo</option>
            </select>
          </div>
        </div>
        {clip && (
          <div style={{ background: "#111827", borderRadius: 10, padding: "12px 16px", marginBottom: 16, border: "1px solid #1f2937" }}>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <span style={{ color: "#6b7280", fontSize: 12 }}>Jugador: <span style={{ color: "#fff", fontWeight: 600 }}>{clip.jugador}</span></span>
              <span style={{ color: "#6b7280", fontSize: 12 }}>Club: <span style={{ color: "#fff", fontWeight: 600 }}>{clip.equipo}</span></span>
              <span style={{ color: "#6b7280", fontSize: 12 }}>Categoría: <span style={{ color: CAT_COLORES[clip.categoria], fontWeight: 700 }}>{clip.categoria}</span></span>
            </div>
            {clip.notas && <div style={{ color: "#9ca3af", fontSize: 12, marginTop: 8 }}>📝 {clip.notas}</div>}
          </div>
        )}
        <button onClick={analizarClip} disabled={!clipId || loading} style={{
          background: !clipId || loading ? "#374151" : "linear-gradient(135deg, #8b5cf6, #7c3aed)",
          border: "none", borderRadius: 10, color: "#fff", padding: "12px 28px", fontSize: 15, fontWeight: 700,
          cursor: !clipId || loading ? "not-allowed" : "pointer",
        }}>
          {loading ? "⏳ Analizando..." : "✨ Generar análisis IA"}
        </button>
      </div>
 
      {analisis && (
        <div style={{ background: "#1a1f2e", border: "1px solid #8b5cf640", borderRadius: 14, padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#fff" }}>📊 Resultado del análisis</h3>
            <button onClick={() => navigator.clipboard.writeText(analisis)} style={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 8, color: "#9ca3af", padding: "6px 12px", fontSize: 12, cursor: "pointer" }}>📋 Copiar</button>
          </div>
          <div style={{ background: "#111827", borderRadius: 10, padding: "20px 24px", color: "#d1d5db", fontSize: 14, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{analisis}</div>
        </div>
      )}
 
      {clips.length === 0 && (
        <div style={{ textAlign: "center", padding: 60, color: "#6b7280" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🤖</div>
          Añade clips desde la Biblioteca para poder analizarlos con IA
        </div>
      )}
    </div>
  );
}
 
// ── MODAL AÑADIR CLIP ──────────────────────────────────────────────
function ModalAddClip({ onGuardar, onCerrar }: { onGuardar: (c: Clip) => void; onCerrar: () => void }) {
  const [form, setForm] = useState({ jugador: "", equipo: "", titulo: "", url: "", categoria: "Táctica" as Clip["categoria"], notas: "" });
 
  function handleGuardar() {
    if (!form.titulo || !form.url || !form.jugador) return;
    onGuardar({ id: "", ...form, fecha: new Date().toLocaleDateString("es-ES"), anotaciones: [] });
  }
 
  return (
    <div style={{ position: "fixed", inset: 0, background: "#000000cc", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 24 }}>
      <div style={{ background: "#1a1f2e", border: "1px solid #374151", borderRadius: 20, padding: 32, width: "100%", maxWidth: 500, boxShadow: "0 24px 64px #00000080", maxHeight: "90vh", overflowY: "auto" }}>
        <h2 style={{ margin: "0 0 20px", fontSize: 20, fontWeight: 900, color: "#fff" }}>🎬 Añadir clip</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { key: "titulo", label: "Título del clip *", placeholder: "Ej: Gol de volea vs Atlético" },
            { key: "jugador", label: "Jugador *", placeholder: "Ej: Fernández, Daniel" },
            { key: "equipo", label: "Club", placeholder: "Ej: Real Madrid" },
            { key: "url", label: "URL del vídeo * (YouTube/Vimeo)", placeholder: "https://youtube.com/watch?v=..." },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label style={{ color: "#9ca3af", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>{label}</label>
              <input value={(form as Record<string, string>)[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder} style={{ width: "100%", background: "#111827", border: "1px solid #374151", borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
            </div>
          ))}
          <div>
            <label style={{ color: "#9ca3af", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Categoría</label>
            <select value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value as Clip["categoria"] })} style={{ width: "100%", background: "#111827", border: "1px solid #374151", borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: 14, outline: "none" }}>
              {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ color: "#9ca3af", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Notas del scout</label>
            <textarea value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} placeholder="Observaciones sobre el clip..." rows={3} style={{ width: "100%", background: "#111827", border: "1px solid #374151", borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: 14, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button onClick={onCerrar} style={{ flex: 1, background: "#111827", border: "1px solid #374151", borderRadius: 10, color: "#9ca3af", padding: "12px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
          <button onClick={handleGuardar} disabled={!form.titulo || !form.url || !form.jugador} style={{ flex: 1, background: form.titulo && form.url && form.jugador ? "linear-gradient(135deg, #3b82f6, #2563eb)" : "#374151", border: "none", borderRadius: 10, color: "#fff", padding: "12px", fontSize: 14, fontWeight: 700, cursor: form.titulo && form.url && form.jugador ? "pointer" : "not-allowed" }}>
            Guardar clip
          </button>
        </div>
      </div>
    </div>
  );
}