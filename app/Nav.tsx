"use client";
import { useState, useEffect } from "react";
 
const MENU = [
  {
    label: "👤 Jugadores",
    href: "/jugadores",
    items: [
      { href: "/jugadores", label: "👤 Jugadores" },
      { href: "/analisis", label: "📊 Análisis" },
      { href: "/comparador", label: "⚖️ Comparador" },
      { href: "/jugadores/historial", label: "📈 Historial de evolución" },
      { href: "/cantera", label: "🌱 Cantera" },
    ],
  },
  {
    label: "🧠 Entrenadores",
    href: "/entrenadores",
    items: [{ href: "/entrenadores", label: "🧠 Entrenadores" }],
  },
  {
    label: "⚽ Partidos",
    href: "/partidos",
    items: [{ href: "/partidos", label: "⚽ Partidos" }],
  },
  {
    label: "📺 Vídeos",
    href: "/videos",
    items: [{ href: "/videos", label: "📺 Vídeos" }],
  },
  {
    label: "📓 Diario",
    href: "/diario",
    items: [
      { href: "/diario", label: "📓 Diario" },
      { href: "/diario/notas-voz", label: "🎙️ Notas de voz" },
      { href: "/diario/chat", label: "💬 Chat de scouting" },
    ],
  },
  {
    label: "📅 Calendario",
    href: "/calendario",
    items: [{ href: "/calendario", label: "📅 Calendario" }],
  },
];
 
export default function Nav() {
  const [menuAbierto, setMenuAbierto] = useState<string | null>(null);
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const [submenuMovil, setSubmenuMovil] = useState<string | null>(null);
  const [path, setPath] = useState("");
  const [esMobile, setEsMobile] = useState(false);
 
  useEffect(() => {
    setPath(window.location.pathname);
    const checkMobile = () => setEsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
 
  // Cerrar menú móvil al cambiar de ruta
  useEffect(() => {
    setMenuMovilAbierto(false);
    setSubmenuMovil(null);
  }, [path]);
 
  return (
    <>
      <header style={{
        background: "rgba(10,14,20,0.97)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid #1f2937",
        padding: esMobile ? "0 16px" : "0 32px",
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 200,
      }}>
        {/* LOGO */}
        <a href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 22 }}>⚽</span>
          <span style={{ fontSize: 18, fontWeight: 900, color: "#fff", letterSpacing: "-0.5px" }}>
            Scout<span style={{ color: "#3b82f6" }}>Pro</span>
          </span>
        </a>
 
        {/* DESKTOP MENÚ */}
        {!esMobile && (
          <nav style={{ display: "flex", gap: 4, alignItems: "center" }}>
            {MENU.map(menu => {
              const activo = path.startsWith(menu.href) && menu.href !== "/";
              const abierto = menuAbierto === menu.label;
              return (
                <div key={menu.label} style={{ position: "relative" }}
                  onMouseEnter={() => setMenuAbierto(menu.label)}
                  onMouseLeave={() => setMenuAbierto(null)}>
                  <a href={menu.href} style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "7px 12px", borderRadius: 8,
                    fontSize: 13, fontWeight: activo ? 700 : 500,
                    color: activo ? "#fff" : "#9ca3af",
                    background: activo ? "#1f2937" : "transparent",
                    textDecoration: "none",
                    border: activo ? "1px solid #374151" : "1px solid transparent",
                    transition: "all 0.15s",
                  }}
                    onMouseEnter={e => { if (!activo) (e.currentTarget as HTMLAnchorElement).style.color = "#fff"; }}
                    onMouseLeave={e => { if (!activo) (e.currentTarget as HTMLAnchorElement).style.color = "#9ca3af"; }}>
                    {menu.label}
                    {menu.items.length > 1 && <span style={{ fontSize: 9, opacity: 0.6 }}>▼</span>}
                  </a>
                  {abierto && menu.items.length > 1 && (
                    <div style={{
                      position: "absolute", top: "100%", left: 0,
                      background: "#1a1f2e", border: "1px solid #1f2937",
                      borderRadius: 10, padding: "6px", minWidth: 220,
                      boxShadow: "0 8px 32px rgba(0,0,0,0.4)", zIndex: 300,
                    }}>
                      {menu.items.map(item => {
                        const itemActivo = path === item.href;
                        return (
                          <a key={item.href} href={item.href} style={{
                            display: "block", padding: "9px 14px", borderRadius: 7,
                            fontSize: 14, fontWeight: itemActivo ? 700 : 400,
                            color: itemActivo ? "#fff" : "#9ca3af",
                            background: itemActivo ? "#374151" : "transparent",
                            textDecoration: "none", transition: "all 0.1s",
                          }}
                            onMouseEnter={e => { if (!itemActivo) { (e.currentTarget as HTMLAnchorElement).style.background = "#111827"; (e.currentTarget as HTMLAnchorElement).style.color = "#fff"; } }}
                            onMouseLeave={e => { if (!itemActivo) { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; (e.currentTarget as HTMLAnchorElement).style.color = "#9ca3af"; } }}>
                            {item.label}
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        )}
 
        {/* DESKTOP BADGE */}
        {!esMobile && (
          <span style={{ background: "#10b981", color: "#fff", borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 600 }}>● EN VIVO</span>
        )}
 
        {/* MOBILE: badge + hamburguesa */}
        {esMobile && (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ background: "#10b981", color: "#fff", borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>● LIVE</span>
            <button
              onClick={() => setMenuMovilAbierto(!menuMovilAbierto)}
              style={{
                background: menuMovilAbierto ? "#1f2937" : "transparent",
                border: "1px solid #374151",
                borderRadius: 8, padding: "8px 10px",
                cursor: "pointer", color: "#fff", fontSize: 18,
                display: "flex", flexDirection: "column", gap: 4, alignItems: "center", justifyContent: "center",
                width: 40, height: 40,
              }}
            >
              {menuMovilAbierto ? (
                <span style={{ fontSize: 18, lineHeight: 1 }}>✕</span>
              ) : (
                <>
                  <span style={{ display: "block", width: 18, height: 2, background: "#fff", borderRadius: 2 }} />
                  <span style={{ display: "block", width: 18, height: 2, background: "#fff", borderRadius: 2 }} />
                  <span style={{ display: "block", width: 18, height: 2, background: "#fff", borderRadius: 2 }} />
                </>
              )}
            </button>
          </div>
        )}
      </header>
 
      {/* MENÚ MÓVIL DESPLEGABLE */}
      {esMobile && menuMovilAbierto && (
        <div style={{
          position: "fixed",
          top: 64,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(10,14,20,0.98)",
          backdropFilter: "blur(12px)",
          zIndex: 190,
          overflowY: "auto",
          padding: "16px",
        }}>
          {MENU.map(menu => {
            const activo = path.startsWith(menu.href) && menu.href !== "/";
            const submenuAbierto = submenuMovil === menu.label;
 
            return (
              <div key={menu.label} style={{ marginBottom: 4 }}>
                {menu.items.length > 1 ? (
                  // Item con submenu — solo toggle
                  <>
                    <button
                      onClick={() => setSubmenuMovil(submenuAbierto ? null : menu.label)}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "14px 16px", borderRadius: 12, border: "none",
                        background: activo ? "#1f2937" : "#111827",
                        color: activo ? "#fff" : "#9ca3af",
                        fontSize: 15, fontWeight: activo ? 700 : 500,
                        cursor: "pointer", textAlign: "left",
                      }}
                    >
                      <span>{menu.label}</span>
                      <span style={{ fontSize: 12, transition: "transform 0.2s", transform: submenuAbierto ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
                    </button>
                    {submenuAbierto && (
                      <div style={{ paddingLeft: 12, marginTop: 4, display: "flex", flexDirection: "column", gap: 2 }}>
                        {menu.items.map(item => {
                          const itemActivo = path === item.href;
                          return (
                            <a key={item.href} href={item.href} style={{
                              display: "block", padding: "12px 16px", borderRadius: 10,
                              fontSize: 14, fontWeight: itemActivo ? 700 : 400,
                              color: itemActivo ? "#fff" : "#9ca3af",
                              background: itemActivo ? "#374151" : "#0b0d17",
                              textDecoration: "none",
                              borderLeft: "2px solid #374151",
                            }}>
                              {item.label}
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  // Item sin submenu — enlace directo
                  <a href={menu.href} style={{
                    display: "flex", alignItems: "center",
                    padding: "14px 16px", borderRadius: 12,
                    background: activo ? "#1f2937" : "#111827",
                    color: activo ? "#fff" : "#9ca3af",
                    fontSize: 15, fontWeight: activo ? 700 : 500,
                    textDecoration: "none",
                    border: activo ? "1px solid #374151" : "1px solid transparent",
                  }}>
                    {menu.label}
                  </a>
                )}
              </div>
            );
          })}
 
          {/* Accesos rápidos móvil */}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #1f2937" }}>
            <p style={{ color: "#4b5563", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Accesos rápidos</p>
            <a href="/viaje" style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "14px 16px", borderRadius: 12,
              background: "#1a1f2e", border: "1px solid #3b82f630",
              textDecoration: "none", marginBottom: 8,
            }}>
              <span style={{ fontSize: 22 }}>✈️</span>
              <div>
                <div style={{ color: "#60a5fa", fontWeight: 700, fontSize: 14 }}>Modo Viaje</div>
                <div style={{ color: "#6b7280", fontSize: 12 }}>Informes rápidos desde el estadio</div>
              </div>
            </a>
            <a href="/rendimiento" style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "14px 16px", borderRadius: 12,
              background: "#1a1f2e", border: "1px solid #f59e0b30",
              textDecoration: "none",
            }}>
              <span style={{ fontSize: 22 }}>📊</span>
              <div>
                <div style={{ color: "#f59e0b", fontWeight: 700, fontSize: 14 }}>Mi rendimiento</div>
                <div style={{ color: "#6b7280", fontSize: 12 }}>Panel de estadísticas</div>
              </div>
            </a>
          </div>
        </div>
      )}
    </>
  );
}