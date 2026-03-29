"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
 
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
  const { perfil, signOut } = useAuth();
  const [menuAbierto, setMenuAbierto] = useState<string | null>(null);
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const [submenuMovil, setSubmenuMovil] = useState<string | null>(null);
  const [path, setPath] = useState("");
  const [esMobile, setEsMobile] = useState(false);
  const [perfilAbierto, setPerfilAbierto] = useState(false);
 
  const esAdmin = perfil?.rol === "admin" || perfil?.rol === "director";
 
  useEffect(() => {
    setPath(window.location.pathname);
    const checkMobile = () => setEsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
 
  useEffect(() => {
    setMenuMovilAbierto(false);
    setSubmenuMovil(null);
  }, [path]);
 
  const dropdownStyle = {
    position: "absolute" as const,
    top: "calc(100% + 8px)",
    left: 0,
    background: "#0f1623",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: "6px",
    minWidth: 220,
    boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
    zIndex: 300,
  };
 
  const dropdownItem = (activo: boolean) => ({
    display: "block",
    padding: "9px 14px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: activo ? 700 : 400,
    color: activo ? "#fff" : "#9ca3af",
    background: activo ? "rgba(255,255,255,0.06)" : "transparent",
    textDecoration: "none",
    transition: "all 0.1s",
    cursor: "pointer",
  });
 
  return (
    <>
      <header style={{
        background: "rgba(8,12,20,0.97)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: esMobile ? "0 16px" : "0 28px",
        height: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 200,
        gap: 16,
      }}>
        {/* LOGO */}
        <a href="/dashboard" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 20 }}>⚽</span>
          <span style={{ fontSize: 17, fontWeight: 900, color: "#fff", letterSpacing: "-0.5px" }}>
            Scout<span style={{ color: "#3b82f6" }}>Pro</span>
          </span>
        </a>
 
        {/* DESKTOP MENÚ */}
        {!esMobile && (
          <nav style={{ display: "flex", gap: 2, alignItems: "center", flex: 1, justifyContent: "center" }}>
            {MENU.map(menu => {
              const activo = path.startsWith(menu.href) && menu.href !== "/";
              const abierto = menuAbierto === menu.label;
              return (
                <div key={menu.label} style={{ position: "relative" }}
                  onMouseEnter={() => setMenuAbierto(menu.label)}
                  onMouseLeave={() => setMenuAbierto(null)}>
                  <a href={menu.href} style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "6px 11px", borderRadius: 8,
                    fontSize: 13, fontWeight: activo ? 600 : 400,
                    color: activo ? "#fff" : "#9ca3af",
                    background: activo ? "rgba(255,255,255,0.06)" : "transparent",
                    textDecoration: "none",
                    transition: "all 0.15s",
                  }}
                    onMouseEnter={e => { if (!activo) (e.currentTarget as HTMLAnchorElement).style.color = "#fff"; }}
                    onMouseLeave={e => { if (!activo) (e.currentTarget as HTMLAnchorElement).style.color = "#9ca3af"; }}>
                    {menu.label}
                    {menu.items.length > 1 && <span style={{ fontSize: 8, opacity: 0.5 }}>▼</span>}
                  </a>
                  {abierto && menu.items.length > 1 && (
                    <div style={dropdownStyle}>
                      {menu.items.map(item => {
                        const itemActivo = path === item.href;
                        return (
                          <a key={item.href} href={item.href}
                            style={dropdownItem(itemActivo)}
                            onMouseEnter={e => { if (!itemActivo) { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLAnchorElement).style.color = "#fff"; } }}
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
 
        {/* DERECHA: modo viaje + admin + perfil */}
        {!esMobile && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
 
            {/* Modo viaje — todos */}
            <a href="/viaje" style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 12px", borderRadius: 8,
              background: path === "/viaje" ? "rgba(59,130,246,0.12)" : "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: path === "/viaje" ? "#60a5fa" : "#9ca3af",
              fontSize: 12, fontWeight: 600, textDecoration: "none",
              transition: "all 0.15s",
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = "#fff"; (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.15)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = path === "/viaje" ? "#60a5fa" : "#9ca3af"; (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.08)"; }}>
              ✈️ Modo Viaje
            </a>
 
            {/* Admin dropdown — solo admin/director */}
            {esAdmin && (
              <div style={{ position: "relative" }}
                onMouseEnter={() => setMenuAbierto("admin")}
                onMouseLeave={() => setMenuAbierto(null)}>
                <button style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "6px 12px", borderRadius: 8,
                  background: "rgba(245,158,11,0.1)",
                  border: "1px solid rgba(245,158,11,0.2)",
                  color: "#f59e0b", fontSize: 12, fontWeight: 600,
                  cursor: "pointer", transition: "all 0.15s",
                }}>
                  👑 Admin <span style={{ fontSize: 8, opacity: 0.7 }}>▼</span>
                </button>
                {menuAbierto === "admin" && (
                  <div style={{ ...dropdownStyle, left: "auto", right: 0, minWidth: 200 }}>
                    <a href="/informes" style={dropdownItem(path === "/informes")}
                      onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLAnchorElement).style.color = "#fff"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = path === "/informes" ? "rgba(255,255,255,0.06)" : "transparent"; (e.currentTarget as HTMLAnchorElement).style.color = path === "/informes" ? "#fff" : "#9ca3af"; }}>
                      📊 Panel de informes
                    </a>
                    <a href="/rendimiento" style={dropdownItem(path === "/rendimiento")}
                      onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLAnchorElement).style.color = "#fff"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; (e.currentTarget as HTMLAnchorElement).style.color = "#9ca3af"; }}>
                      📈 Rendimiento global
                    </a>
                    <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "6px 0" }} />
                    <div style={{ padding: "6px 14px 4px", fontSize: 10, color: "#4b5563", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      Gestión de usuarios
                    </div>
                    <a href="/informes" style={dropdownItem(false)}
                      onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLAnchorElement).style.color = "#fff"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; (e.currentTarget as HTMLAnchorElement).style.color = "#9ca3af"; }}>
                      👥 Ver todos los ojeadores
                    </a>
                  </div>
                )}
              </div>
            )}
 
            {/* Perfil */}
            <div style={{ position: "relative" }}
              onMouseEnter={() => setPerfilAbierto(true)}
              onMouseLeave={() => setPerfilAbierto(false)}>
              <button style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "5px 10px 5px 6px", borderRadius: 10,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                cursor: "pointer", transition: "all 0.15s",
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700, color: "#fff",
                }}>
                  {perfil?.nombre?.charAt(0)?.toUpperCase() ?? "?"}
                </div>
                <div style={{ textAlign: "left" }}>
                  <div style={{ color: "#fff", fontSize: 12, fontWeight: 600, lineHeight: 1.2 }}>{perfil?.nombre?.split(" ")[0]}</div>
                  <div style={{ color: "#4b5563", fontSize: 10, textTransform: "capitalize" }}>{perfil?.rol}</div>
                </div>
                <span style={{ fontSize: 8, color: "#4b5563" }}>▼</span>
              </button>
 
              {perfilAbierto && (
                <div style={{ ...dropdownStyle, left: "auto", right: 0, minWidth: 180 }}>
                  <div style={{ padding: "10px 14px 8px", borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: 6 }}>
                    <div style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>{perfil?.nombre}</div>
                    <div style={{ color: "#4b5563", fontSize: 11 }}>{perfil?.email}</div>
                  </div>
                  <a href="/dashboard" style={dropdownItem(false)}
                    onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLAnchorElement).style.color = "#fff"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; (e.currentTarget as HTMLAnchorElement).style.color = "#9ca3af"; }}>
                    🏠 Dashboard
                  </a>
                  <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "6px 0" }} />
                  <button onClick={signOut} style={{
                    ...dropdownItem(false),
                    width: "100%", border: "none", background: "transparent",
                    color: "#ef4444", textAlign: "left",
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.08)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
                    🚪 Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
 
        {/* MOBILE */}
        {esMobile && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <a href="/viaje" style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 8, color: "#60a5fa", padding: "5px 10px", fontSize: 11, fontWeight: 700, textDecoration: "none" }}>✈️</a>
            <button onClick={() => setMenuMovilAbierto(!menuMovilAbierto)} style={{
              background: menuMovilAbierto ? "#1f2937" : "transparent",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8, cursor: "pointer", color: "#fff",
              width: 38, height: 38, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 4,
            }}>
              {menuMovilAbierto ? <span style={{ fontSize: 16 }}>✕</span> : <>
                <span style={{ display: "block", width: 16, height: 2, background: "#fff", borderRadius: 2 }} />
                <span style={{ display: "block", width: 16, height: 2, background: "#fff", borderRadius: 2 }} />
                <span style={{ display: "block", width: 16, height: 2, background: "#fff", borderRadius: 2 }} />
              </>}
            </button>
          </div>
        )}
      </header>
 
      {/* MENÚ MÓVIL */}
      {esMobile && menuMovilAbierto && (
        <div style={{
          position: "fixed", top: 60, left: 0, right: 0, bottom: 0,
          background: "rgba(8,12,20,0.98)", backdropFilter: "blur(16px)",
          zIndex: 190, overflowY: "auto", padding: "16px",
        }}>
          {MENU.map(menu => {
            const activo = path.startsWith(menu.href) && menu.href !== "/";
            const submenuAbierto = submenuMovil === menu.label;
            return (
              <div key={menu.label} style={{ marginBottom: 4 }}>
                {menu.items.length > 1 ? (
                  <>
                    <button onClick={() => setSubmenuMovil(submenuAbierto ? null : menu.label)} style={{
                      width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "13px 16px", borderRadius: 10, border: "none",
                      background: activo ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.02)",
                      color: activo ? "#fff" : "#9ca3af", fontSize: 14, fontWeight: activo ? 600 : 400,
                      cursor: "pointer", textAlign: "left",
                    }}>
                      <span>{menu.label}</span>
                      <span style={{ fontSize: 10, transition: "transform 0.2s", transform: submenuAbierto ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
                    </button>
                    {submenuAbierto && (
                      <div style={{ paddingLeft: 12, marginTop: 4, display: "flex", flexDirection: "column", gap: 2 }}>
                        {menu.items.map(item => (
                          <a key={item.href} href={item.href} style={{
                            display: "block", padding: "11px 16px", borderRadius: 8,
                            fontSize: 13, color: path === item.href ? "#fff" : "#9ca3af",
                            background: path === item.href ? "rgba(255,255,255,0.06)" : "transparent",
                            textDecoration: "none", borderLeft: "2px solid rgba(255,255,255,0.08)",
                          }}>
                            {item.label}
                          </a>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <a href={menu.href} style={{
                    display: "flex", alignItems: "center",
                    padding: "13px 16px", borderRadius: 10,
                    background: activo ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.02)",
                    color: activo ? "#fff" : "#9ca3af", fontSize: 14, fontWeight: activo ? 600 : 400,
                    textDecoration: "none",
                  }}>
                    {menu.label}
                  </a>
                )}
              </div>
            );
          })}
 
          {/* Admin móvil */}
          {esAdmin && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <p style={{ color: "#f59e0b", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, paddingLeft: 4 }}>👑 Admin</p>
              <a href="/informes" style={{ display: "block", padding: "13px 16px", borderRadius: 10, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)", color: "#f59e0b", fontSize: 14, fontWeight: 600, textDecoration: "none", marginBottom: 4 }}>
                📊 Panel de informes
              </a>
              <a href="/rendimiento" style={{ display: "block", padding: "13px 16px", borderRadius: 10, background: "rgba(255,255,255,0.02)", color: "#9ca3af", fontSize: 14, textDecoration: "none" }}>
                📈 Rendimiento global
              </a>
            </div>
          )}
 
          {/* Perfil móvil */}
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #3b82f6, #2563eb)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#fff" }}>
                {perfil?.nombre?.charAt(0)?.toUpperCase() ?? "?"}
              </div>
              <div>
                <div style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>{perfil?.nombre}</div>
                <div style={{ color: "#4b5563", fontSize: 12, textTransform: "capitalize" }}>{perfil?.rol}</div>
              </div>
            </div>
            <button onClick={signOut} style={{ width: "100%", padding: "13px 16px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", color: "#ef4444", fontSize: 14, fontWeight: 600, cursor: "pointer", textAlign: "left" }}>
              🚪 Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </>
  );
}