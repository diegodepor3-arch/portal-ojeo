"use client";
import { useEffect, useRef, useState } from "react";

type Nota = {
  id: number;
  texto: string;
  fecha: string;
  duracion: string;
};

export default function NotasVoz() {
  const [grabando, setGrabando] = useState(false);
  const [transcripcion, setTranscripcion] = useState("");
  const [notas, setNotas] = useState<Nota[]>([]);
  const [error, setError] = useState("");
  const [segundos, setSegundos] = useState(0);
  const [montado, setMontado] = useState(false);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    setMontado(true);
    try {
      const guardadas = localStorage.getItem("notas-voz-diario");
      if (guardadas) setNotas(JSON.parse(guardadas));
    } catch {}
  }, []);

  function guardarNota(texto: string, duracion: string) {
    const nueva: Nota = { id: Date.now(), texto, fecha: new Date().toLocaleString("es-ES"), duracion };
    const actualizadas = [nueva, ...notas];
    setNotas(actualizadas);
    localStorage.setItem("notas-voz-diario", JSON.stringify(actualizadas));
  }

  function iniciarGrabacion() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setError("Usa Chrome para grabar voz."); return; }
    setError(""); setTranscripcion(""); setSegundos(0);
    const r = new SR();
    r.lang = "es-ES"; r.continuous = true; r.interimResults = true;
    r.onresult = (e: any) => {
      let t = "";
      for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
      setTranscripcion(t);
    };
    r.onerror = (e: any) => { setError("Error al grabar: " + e.error); setGrabando(false); clearInterval(timerRef.current); };
    r.start();
    recognitionRef.current = r;
    setGrabando(true);
    timerRef.current = setInterval(() => setSegundos(s => s + 1), 1000);
  }

  function detenerGrabacion() {
    recognitionRef.current?.stop();
    setGrabando(false);
    clearInterval(timerRef.current);
    const dur = `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, "0")}`;
    if (transcripcion.trim()) guardarNota(transcripcion.trim(), dur);
  }

  function eliminarNota(id: number) {
    const act = notas.filter(n => n.id !== id);
    setNotas(act);
    localStorage.setItem("notas-voz-diario", JSON.stringify(act));
  }

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  if (!montado) return null;

  return (
    <div style={{ minHeight: "100vh", background: "#0f1117", color: "#e5e7eb", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: "#fff" }}>🎙️ Notas de voz</h1>
          <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 14 }}>Graba desde el estadio — se transcribe automáticamente</p>
        </div>
        <div style={{
          background: "linear-gradient(135deg, #1a1f2e, #111827)",
          border: `2px solid ${grabando ? "#ef4444" : "#1f2937"}`,
          borderRadius: 20, padding: "40px 32px", textAlign: "center", marginBottom: 32,
        }}>
          {grabando && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444", animation: "pulse 1s infinite" }} />
                <span style={{ color: "#ef4444", fontWeight: 700, fontSize: 14 }}>GRABANDO</span>
                <span style={{ color: "#9ca3af", fontSize: 14 }}>{fmt(segundos)}</span>
              </div>
              {transcripcion && (
                <div style={{ background: "#0f1117", border: "1px solid #1f2937", borderRadius: 10, padding: "12px 16px", color: "#d1d5db", fontSize: 14, lineHeight: 1.6, textAlign: "left", minHeight: 60 }}>
                  {transcripcion}
                </div>
              )}
            </div>
          )}

          <button onClick={grabando ? detenerGrabacion : iniciarGrabacion} style={{
            width: 80, height: 80, borderRadius: "50%", border: "none", cursor: "pointer",
            background: grabando ? "linear-gradient(135deg, #ef4444, #dc2626)" : "linear-gradient(135deg, #3b82f6, #2563eb)",
            color: "#fff", fontSize: 32,
            boxShadow: grabando ? "0 0 30px #ef444460" : "0 0 20px #3b82f660",
          }}>
            {grabando ? "⏹" : "🎙"}
          </button>

          <p style={{ margin: "16px 0 0", color: "#6b7280", fontSize: 13 }}>
            {grabando ? "Pulsa para detener y guardar" : "Pulsa para empezar a grabar"}
          </p>
          {error && <div style={{ marginTop: 16, color: "#ef4444", fontSize: 13 }}>{error}</div>}
        </div>

        {notas.length > 0 && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#9ca3af", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Notas guardadas ({notas.length})
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {notas.map(n => (
                <div key={n.id} style={{ background: "#1a1f2e", border: "1px solid #1f2937", borderRadius: 14, padding: "18px 20px", display: "flex", gap: 16, alignItems: "flex-start" }}>
                  <div style={{ fontSize: 24, marginTop: 2 }}>🎙️</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: "#e5e7eb", fontSize: 14, lineHeight: 1.6, marginBottom: 8 }}>{n.texto}</div>
                    <div style={{ color: "#6b7280", fontSize: 12 }}>📅 {n.fecha} · ⏱ {n.duracion}</div>
                  </div>
                  <button onClick={() => eliminarNota(n.id)} style={{ background: "transparent", border: "none", color: "#6b7280", cursor: "pointer", fontSize: 16, padding: 4 }}>✕</button>
                </div>
              ))}
            </div>
          </div>
        )}

        <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
      </div>
    </div>
  );
}