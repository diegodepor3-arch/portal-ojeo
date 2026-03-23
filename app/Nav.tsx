"use client";
import { useState } from "react";
 
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
    items: [
      { href: "/entrenadores", label: "🧠 Entrenadores" },
    ],
  },
  {
    label: "⚽ Partidos",
    href: "/partidos",
    items: [
      { href: "/partidos", label: "⚽ Partidos" },
    ],
  },
  {
    label: "📺 Vídeos",
    href: "/videos",
    items: [
      { href: "/videos", label: "📺 Vídeos" },
    ],
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
    items: [
      { href: "/calendario", label: "📅 Calendario" },
    ],
  },
];
 
export default function Nav() {
  const [menuAbierto, setMenuAbierto] = useState<string | null>(null);
  const path = typeof window !== "undefined" ? window.location.pathname : "";
 
  return (
    <header style={{
      background: "rgba(10,14,20,0.97)",
      backdropFilter: "blur(12px)",
      borderBottom: "1px solid #1f2937",
      padding: "0 32px",
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
        <span style={{ fontSize: 24 }}>⚽</span>
        <span style={{ fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: "-0.5px" }}>
          Scout<span style={{ color: "#3b82f6" }}>Pro</span>
        </span>
      </a>
 
      {/* MENÚ */}
      <nav style={{ display: "flex", gap: 4, alignItems: "center" }}>
        {MENU.map(menu => {
          const activo = path.startsWith(menu.href) && menu.href !== "/";
          const abierto = menuAbierto === menu.label;
 
          return (
            <div
              key={menu.label}
              style={{ position: "relative" }}
              onMouseEnter={() => setMenuAbierto(menu.label)}
              onMouseLeave={() => setMenuAbierto(null)}
            >
              <a
                href={menu.href}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "7px 14px", borderRadius: 8,
                  fontSize: 14, fontWeight: activo ? 700 : 500,
                  color: activo ? "#fff" : "#9ca3af",
                  background: activo ? "#1f2937" : "transparent",
                  textDecoration: "none",
                  border: activo ? "1px solid #374151" : "1px solid transparent",
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => {
                  if (!activo) (e.currentTarget as HTMLAnchorElement).style.color = "#fff";
                }}
                onMouseLeave={e => {
                  if (!activo) (e.currentTarget as HTMLAnchorElement).style.color = "#9ca3af";
                }}
              >
                {menu.label}
                {menu.items.length > 1 && (
                  <span style={{ fontSize: 10, opacity: 0.6 }}>▼</span>
                )}
              </a>
 
              {/* DROPDOWN */}
              {abierto && menu.items.length > 1 && (
                <div style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  background: "#1a1f2e",
                  border: "1px solid #1f2937",
                  borderRadius: 10,
                  padding: "6px",
                  minWidth: 220,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                  zIndex: 300,
                }}>
                  {menu.items.map(item => {
                    const itemActivo = path === item.href;
                    return (
                      <a
                        key={item.href}
                        href={item.href}
                        style={{
                          display: "block",
                          padding: "9px 14px",
                          borderRadius: 7,
                          fontSize: 14,
                          fontWeight: itemActivo ? 700 : 400,
                          color: itemActivo ? "#fff" : "#9ca3af",
                          background: itemActivo ? "#374151" : "transparent",
                          textDecoration: "none",
                          transition: "all 0.1s",
                        }}
                        onMouseEnter={e => {
                          if (!itemActivo) {
                            (e.currentTarget as HTMLAnchorElement).style.background = "#111827";
                            (e.currentTarget as HTMLAnchorElement).style.color = "#fff";
                          }
                        }}
                        onMouseLeave={e => {
                          if (!itemActivo) {
                            (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                            (e.currentTarget as HTMLAnchorElement).style.color = "#9ca3af";
                          }
                        }}
                      >
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
 
      {/* BADGE */}
      <div style={{ display: "flex", alignItems: "center" }}>
        <span style={{
          background: "#10b981",
          color: "#fff",
          borderRadius: 20,
          padding: "3px 12px",
          fontSize: 12,
          fontWeight: 600,
        }}>● EN VIVO</span>
      </div>
    </header>
  );
}