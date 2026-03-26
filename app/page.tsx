"use client";
import { useState, useEffect } from "react";

const STATS = [
  { label: "Jugadores en seguimiento", value: "2.400+", icon: "👤" },
  { label: "Informes generados", value: "8.900+", icon: "📋" },
  { label: "Ojeadores activos", value: "340+", icon: "🔭" },
  { label: "Países cubiertos", value: "28", icon: "🌍" },
];

const FEATURES = [
  { icon: "⚡", title: "Tiempo real", desc: "Sincronización automática con Google Sheets. Cualquier cambio aparece al instante." },
  { icon: "📊", title: "Radares y estadísticas", desc: "Visualiza las habilidades de cada jugador con gráficos radar interactivos." },
  { icon: "🔍", title: "Búsqueda avanzada", desc: "Filtra por posición, edad, país, nota y más para encontrar al jugador perfecto." },
  { icon: "📄", title: "Informes en PDF", desc: "Genera fichas profesionales listas para enviar al director deportivo." },
  { icon: "⚖️", title: "Comparador", desc: "Compara 2 o 3 jugadores lado a lado para tomar la mejor decisión." },
  { icon: "🏟️", title: "Cantera", desc: "Sección dedicada al scouting de jugadores Sub-12 a Sub-18." },
];

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#080c14", color: "#e5e7eb", fontFamily: "'Segoe UI', system-ui, sans-serif", overflowX: "hidden" }}>

      {/* NAV */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 200, padding: "0 40px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", background: scrolled ? "rgba(8,12,20,0.95)" : "transparent", backdropFilter: scrolled ? "blur(12px)" : "none", borderBottom: scrolled ? "1px solid #1f2937" : "none", transition: "all 0.3s" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 26 }}>⚽</span>
          <span style={{ fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: "-0.5px" }}>
            Scout<span style={{ color: "#3b82f6" }}>Pro</span>
          </span>
        </div>
        <a href="/jugadores" style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "#fff", borderRadius: 8, padding: "9px 22px", fontSize: 14, fontWeight: 700, textDecoration: "none", boxShadow: "0 4px 15px rgba(59,130,246,0.4)" }}>
          Entrar →
        </a>
      </nav>

      {/* HERO */}
      <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "120px 24px 80px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", width: 600, height: 600, background: "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundImage: "radial-gradient(circle, #1f2937 1px, transparent 1px)", backgroundSize: "40px 40px", opacity: 0.15, pointerEvents: "none" }} />

        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 20, padding: "6px 16px", fontSize: 13, color: "#93c5fd", marginBottom: 28, fontWeight: 600 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#3b82f6", display: "inline-block" }} />
          Plataforma profesional de scouting
        </div>

        <h1 style={{ fontSize: "clamp(42px, 7vw, 80px)", fontWeight: 900, lineHeight: 1.05, margin: "0 0 24px", color: "#fff", letterSpacing: "-2px", maxWidth: 800 }}>
          El scouting de fútbol,{" "}
          <span style={{ background: "linear-gradient(135deg, #3b82f6, #60a5fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            reinventado
          </span>
        </h1>

        <p style={{ fontSize: 18, color: "#9ca3af", maxWidth: 560, lineHeight: 1.7, margin: "0 0 40px" }}>
          Gestiona tu base de jugadores, genera informes profesionales y toma decisiones más inteligentes. Todo sincronizado con Google Sheets en tiempo real.
        </p>

        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
          <a href="/jugadores" style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "#fff", borderRadius: 10, padding: "14px 32px", fontSize: 16, fontWeight: 700, textDecoration: "none", boxShadow: "0 8px 25px rgba(59,130,246,0.4)" }}>Ver jugadores →</a>
          <a href="#features" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid #374151", color: "#d1d5db", borderRadius: 10, padding: "14px 32px", fontSize: 16, fontWeight: 600, textDecoration: "none" }}>Ver funciones</a>
        </div>

        <div style={{ marginTop: 70, background: "linear-gradient(135deg, #1a1f2e, #111827)", border: "1px solid #1f2937", borderRadius: 16, padding: "20px 28px", display: "flex", gap: 24, flexWrap: "wrap", justifyContent: "center", boxShadow: "0 25px 60px rgba(0,0,0,0.5)", maxWidth: 700 }}>
          {STATS.map(s => (
            <div key={s.label} style={{ textAlign: "center", minWidth: 120 }}>
              <div style={{ fontSize: 26, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#fff" }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ padding: "100px 24px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <h2 style={{ fontSize: 40, fontWeight: 900, color: "#fff", letterSpacing: "-1px", margin: 0 }}>Todo lo que necesitas</h2>
          <p style={{ color: "#6b7280", fontSize: 16, marginTop: 12 }}>Herramientas profesionales para ojeadores modernos</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{ background: "linear-gradient(135deg, #1a1f2e, #111827)", border: "1px solid #1f2937", borderRadius: 14, padding: "28px 24px", transition: "border-color 0.2s, transform 0.2s", cursor: "default" }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#3b82f6"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#1f2937"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; }}>
              <div style={{ fontSize: 32, marginBottom: 14 }}>{f.icon}</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: "#fff", marginBottom: 8 }}>{f.title}</div>
              <div style={{ fontSize: 14, color: "#9ca3af", lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "80px 24px", textAlign: "center" }}>
        <div style={{ background: "linear-gradient(135deg, #1a1f2e, #111827)", border: "1px solid #1f2937", borderRadius: 20, padding: "60px 40px", maxWidth: 700, margin: "0 auto", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "-50%", left: "50%", transform: "translateX(-50%)", width: 400, height: 400, background: "radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)", pointerEvents: "none" }} />
          <h2 style={{ fontSize: 36, fontWeight: 900, color: "#fff", margin: "0 0 16px", letterSpacing: "-1px" }}>Empieza ahora mismo</h2>
          <p style={{ color: "#9ca3af", fontSize: 16, marginBottom: 32 }}>Tu base de jugadores te está esperando</p>
          <a href="/jugadores" style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "#fff", borderRadius: 10, padding: "14px 36px", fontSize: 16, fontWeight: 700, textDecoration: "none", boxShadow: "0 8px 25px rgba(59,130,246,0.4)", display: "inline-block" }}>Abrir ScoutPro →</a>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid #1f2937", padding: "24px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span>⚽</span>
          <span style={{ fontWeight: 800, color: "#fff" }}>Scout<span style={{ color: "#3b82f6" }}>Pro</span></span>
        </div>
        <span style={{ color: "#6b7280", fontSize: 13 }}>Plataforma profesional de scouting de fútbol</span>
      </footer>
    </div>
  );
}