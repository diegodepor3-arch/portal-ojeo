"use client";
import { useState, useEffect } from "react";
import Nav from "./Nav";
 
type Rol = "admin" | "scout" | "director" | "ojeador";
 
type Usuario = {
  nombre: string;
  email: string;
  telefono: string;
  foto: string | null;
  rol: Rol;
};
 
type OjeadorRegistrado = {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  password: string;
  fechaRegistro: string;
};
 
const CREDENCIALES_FIJAS: Record<string, Rol> = {
  "admin99": "admin",
  "scout2026": "scout",
  "director2026": "director",
};
 
const ROL_LABELS: Record<Rol, string> = {
  admin: "👑 Admin",
  scout: "🔭 Scout",
  director: "📊 Director Deportivo",
  ojeador: "👁️ Ojeador Externo",
};
 
const ROL_COLORES: Record<Rol, string> = {
  admin: "#10b981",
  scout: "#3b82f6",
  director: "#8b5cf6",
  ojeador: "#f59e0b",
};
 
function getOjeadoresRegistrados(): OjeadorRegistrado[] {
  try { return JSON.parse(localStorage.getItem("ojeadores_registrados") || "[]"); } catch { return []; }
}
function saveOjeadoresRegistrados(lista: OjeadorRegistrado[]) {
  try { localStorage.setItem("ojeadores_registrados", JSON.stringify(lista)); } catch {}
}
function generarPassword(nombre: string): string {
  const base = nombre.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
  return `ojeador_${base}`;
}
 
export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [montado, setMontado] = useState(false);
  const [autenticado, setAutenticado] = useState(false);
  const [password, setPassword] = useState("");
  const [usuario, setUsuario] = useState<Usuario>({ nombre: "", email: "", telefono: "", foto: null, rol: "ojeador" });
  const [isOpen, setIsOpen] = useState(false);
  const [logAccesos, setLogAccesos] = useState<{ ruta: string; hora: string; usuario: string }[]>([]);
  const [mostrarLog, setMostrarLog] = useState(false);
  const [error, setError] = useState("");
  const [pantalla, setPantalla] = useState<"login" | "registro">("login");
  const [esMobile, setEsMobile] = useState(false);
 
  // Registro
  const [regNombre, setRegNombre] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regTelefono, setRegTelefono] = useState("");
  const [regError, setRegError] = useState("");
  const [passwordGenerada, setPasswordGenerada] = useState("");
  const [registroCompletado, setRegistroCompletado] = useState(false);
 
  useEffect(() => {
    const auth = localStorage.getItem("scoutpro_auth") === "true";
    const rol = (localStorage.getItem("scoutpro_rol") as Rol) || "ojeador";
    const nombre = localStorage.getItem("scoutpro_nombre") || "";
    const email = localStorage.getItem("scoutpro_email") || "";
    const telefono = localStorage.getItem("scoutpro_telefono") || "";
    if (auth) { setAutenticado(true); setUsuario(u => ({ ...u, rol, nombre, email, telefono })); }
 
    const checkMobile = () => setEsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    setMontado(true);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
 
  useEffect(() => {
    if (!autenticado || !montado) return;
    const ruta = window.location.pathname;
    const entrada = { ruta, hora: new Date().toLocaleString("es-ES"), usuario: usuario.nombre || "Anónimo" };
    setLogAccesos(prev => [entrada, ...prev].slice(0, 50));
  }, [autenticado, montado]);
 
  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const rolFijo = CREDENCIALES_FIJAS[password];
    if (rolFijo) {
      setUsuario(u => ({ ...u, rol: rolFijo }));
      setAutenticado(true);
      localStorage.setItem("scoutpro_auth", "true");
      localStorage.setItem("scoutpro_rol", rolFijo);
      setError(""); return;
    }
    const ojeadores = getOjeadoresRegistrados();
    const ojeador = ojeadores.find(o => o.password === password);
    if (ojeador) {
      setUsuario({ nombre: ojeador.nombre, email: ojeador.email, telefono: ojeador.telefono, foto: null, rol: "ojeador" });
      setAutenticado(true);
      localStorage.setItem("scoutpro_auth", "true");
      localStorage.setItem("scoutpro_rol", "ojeador");
      localStorage.setItem("scoutpro_nombre", ojeador.nombre);
      localStorage.setItem("scoutpro_email", ojeador.email);
      localStorage.setItem("scoutpro_telefono", ojeador.telefono);
      localStorage.setItem("scoutpro_ojeador_id", ojeador.id);
      setError(""); return;
    }
    setError("Contraseña incorrecta");
  }
 
  function handleRegistro(e: React.FormEvent) {
    e.preventDefault();
    setRegError("");
    if (!regNombre.trim() || !regEmail.trim() || !regTelefono.trim()) { setRegError("Todos los campos son obligatorios"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail)) { setRegError("El correo no es válido"); return; }
    const ojeadores = getOjeadoresRegistrados();
    if (ojeadores.find(o => o.email === regEmail)) { setRegError("Ya existe un ojeador con ese correo"); return; }
    const pass = generarPassword(regNombre);
    const nuevo: OjeadorRegistrado = { id: Date.now().toString(), nombre: regNombre.trim(), email: regEmail.trim(), telefono: regTelefono.trim(), password: pass, fechaRegistro: new Date().toLocaleDateString("es-ES") };
    saveOjeadoresRegistrados([...ojeadores, nuevo]);
    setPasswordGenerada(pass);
    setRegistroCompletado(true);
  }
 
  function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setUsuario(u => ({ ...u, foto: reader.result as string }));
      reader.readAsDataURL(file);
    }
  }
 
  function guardarPerfil() {
    localStorage.setItem("scoutpro_nombre", usuario.nombre);
    localStorage.setItem("scoutpro_email", usuario.email);
    localStorage.setItem("scoutpro_telefono", usuario.telefono);
    if (usuario.rol === "ojeador") {
      const id = localStorage.getItem("scoutpro_ojeador_id");
      if (id) {
        const ojeadores = getOjeadoresRegistrados().map(o => o.id === id ? { ...o, nombre: usuario.nombre, email: usuario.email, telefono: usuario.telefono } : o);
        saveOjeadoresRegistrados(ojeadores);
      }
    }
    setIsOpen(false);
  }
 
  if (!montado) return null;
 
  if (!autenticado) {
    return (
      <div className="fixed inset-0 z-[10000] bg-[#0b0d17] flex items-center justify-center p-4">
        {pantalla === "login" ? (
          <form onSubmit={handleLogin} className="bg-[#1a1c2e] p-8 rounded-[32px] border border-slate-800 w-full max-w-sm text-center shadow-2xl">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl mx-auto mb-5 flex items-center justify-center text-2xl">🛡️</div>
            <h2 className="text-xl font-black mb-1 uppercase tracking-tighter text-white">ScoutPro Access</h2>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-5">Introduce tu clave de acceso</p>
            <div className="text-left mb-4 bg-[#0b0d17] rounded-2xl p-3 border border-slate-800">
              <p className="text-[9px] text-slate-500 uppercase font-bold mb-2">Claves del equipo:</p>
              {Object.entries(CREDENCIALES_FIJAS).map(([pass, rol]) => (
                <div key={pass} className="flex justify-between text-[10px] py-0.5">
                  <span className="text-slate-400 font-mono">{pass}</span>
                  <span style={{ color: ROL_COLORES[rol] }} className="font-bold">{ROL_LABELS[rol]}</span>
                </div>
              ))}
              {getOjeadoresRegistrados().length > 0 && (
                <>
                  <p className="text-[9px] text-slate-500 uppercase font-bold mb-1 mt-2">Ojeadores:</p>
                  {getOjeadoresRegistrados().map(o => (
                    <div key={o.id} className="flex justify-between text-[10px] py-0.5">
                      <span className="text-slate-400 font-mono">{o.password}</span>
                      <span style={{ color: ROL_COLORES["ojeador"] }} className="font-bold">👁️ {o.nombre}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
            <input type="password" placeholder="Contraseña..." className="w-full bg-[#0b0d17] p-4 rounded-2xl border border-slate-800 mb-2 outline-none focus:border-blue-500 text-center text-white" onChange={e => setPassword(e.target.value)} />
            {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
            <button className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all text-white mt-1">Entrar al Sistema</button>
            <div className="mt-4 pt-3 border-t border-slate-800">
              <p className="text-slate-500 text-[10px] mb-1">¿Eres ojeador nuevo?</p>
              <button type="button" onClick={() => setPantalla("registro")} className="text-[11px] font-bold text-amber-400 hover:underline">👁️ Registrarse como Ojeador →</button>
            </div>
          </form>
 
        ) : registroCompletado ? (
          <div className="bg-[#1a1c2e] p-8 rounded-[32px] border border-slate-800 w-full max-w-sm text-center shadow-2xl">
            <div className="w-14 h-14 bg-amber-500 rounded-2xl mx-auto mb-5 flex items-center justify-center text-2xl">✅</div>
            <h2 className="text-xl font-black mb-2 text-white">¡Registro completado!</h2>
            <p className="text-slate-400 text-xs mb-5">Guarda tu contraseña de acceso:</p>
            <div className="bg-[#0b0d17] rounded-2xl p-4 border border-amber-500/30 mb-5">
              <p className="text-[9px] text-slate-500 uppercase font-bold mb-1">Tu contraseña</p>
              <div className="text-amber-400 font-mono font-black text-base tracking-wider break-all">{passwordGenerada}</div>
              <p className="text-[9px] text-slate-600 mt-1">Anótala, no podrás recuperarla</p>
            </div>
            <button onClick={() => navigator.clipboard.writeText(passwordGenerada)} className="w-full bg-slate-800 py-3 rounded-2xl text-xs font-bold text-slate-300 mb-3">📋 Copiar contraseña</button>
            <button onClick={() => { setRegistroCompletado(false); setPantalla("login"); }} className="w-full bg-blue-600 py-4 rounded-2xl font-black uppercase text-xs text-white">Ir al Login →</button>
          </div>
 
        ) : (
          <form onSubmit={handleRegistro} className="bg-[#1a1c2e] p-8 rounded-[32px] border border-slate-800 w-full max-w-sm text-center shadow-2xl">
            <div className="w-14 h-14 bg-amber-500 rounded-2xl mx-auto mb-5 flex items-center justify-center text-2xl">👁️</div>
            <h2 className="text-xl font-black mb-1 uppercase tracking-tighter text-white">Registro de Ojeador</h2>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.1em] mb-5">Rellena tus datos</p>
            <div className="space-y-3 text-left mb-4">
              {[
                { label: "Nombre completo *", value: regNombre, set: setRegNombre, placeholder: "Diego García", type: "text" },
                { label: "Correo electrónico *", value: regEmail, set: setRegEmail, placeholder: "diego@ejemplo.com", type: "email" },
                { label: "Teléfono *", value: regTelefono, set: setRegTelefono, placeholder: "+34 600 000 000", type: "tel" },
              ].map(({ label, value, set, placeholder, type }) => (
                <div key={label}>
                  <label className="text-[9px] text-slate-400 uppercase font-bold block mb-1">{label}</label>
                  <input type={type} value={value} onChange={e => set(e.target.value)} placeholder={placeholder}
                    className="w-full bg-[#0b0d17] p-3 rounded-xl border border-slate-800 text-sm text-white outline-none focus:border-amber-500" />
                </div>
              ))}
            </div>
            {regNombre && (
              <div className="bg-[#0b0d17] rounded-xl p-3 border border-amber-500/20 mb-3 text-left">
                <p className="text-[9px] text-slate-500 uppercase font-bold mb-1">Tu contraseña será:</p>
                <p className="text-amber-400 font-mono font-bold text-sm break-all">{generarPassword(regNombre)}</p>
              </div>
            )}
            {regError && <p className="text-red-500 text-xs mb-2">{regError}</p>}
            <button type="submit" className="w-full bg-amber-500 hover:bg-amber-400 py-4 rounded-2xl font-black uppercase text-xs text-black mb-3">Crear mi cuenta</button>
            <button type="button" onClick={() => { setPantalla("login"); setRegError(""); }} className="text-[10px] font-bold text-slate-500 hover:underline">← Volver al login</button>
          </form>
        )}
      </div>
    );
  }
 
  // ── APP AUTENTICADA ───────────────────────────────────────────
  const perfilBtnStyle: React.CSSProperties = esMobile ? {
    // En móvil: botón pequeño abajo a la derecha, NO encima del nav
    position: "fixed",
    bottom: 20,
    right: 16,
    zIndex: 9999,
  } : {
    // En desktop: arriba a la derecha como siempre
    position: "fixed",
    top: 4,
    right: 24,
    zIndex: 9999,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
  };
 
  return (
    <>
      <div style={perfilBtnStyle}>
        {/* Botón perfil */}
        <div
          onClick={() => setIsOpen(!isOpen)}
          style={{
            display: "flex", alignItems: "center", gap: esMobile ? 0 : 10,
            background: "rgba(26,28,46,0.95)",
            backdropFilter: "blur(12px)",
            padding: esMobile ? "8px" : "6px 16px 6px 6px",
            borderRadius: esMobile ? "50%" : 40,
            border: "1px solid #374151",
            cursor: "pointer",
            boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
            width: esMobile ? 48 : "auto",
            height: esMobile ? 48 : "auto",
            justifyContent: "center",
          }}
        >
          <div style={{
            width: 34, height: 34, borderRadius: "50%",
            background: `linear-gradient(135deg, ${ROL_COLORES[usuario.rol]}40, ${ROL_COLORES[usuario.rol]}20)`,
            border: `2px solid ${ROL_COLORES[usuario.rol]}60`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 900, color: "#fff", flexShrink: 0, overflow: "hidden",
          }}>
            {usuario.foto
              ? <img src={usuario.foto} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
              : <span>{usuario.nombre ? usuario.nombre[0].toUpperCase() : "?"}</span>
            }
          </div>
          {!esMobile && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
              <span style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", color: ROL_COLORES[usuario.rol] }}>{ROL_LABELS[usuario.rol]}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{usuario.nombre || "Configurar Perfil"}</span>
            </div>
          )}
        </div>
 
        {/* Panel perfil */}
        {isOpen && (
          <div style={{
            ...(esMobile ? {
              position: "fixed",
              bottom: 72,
              right: 16,
              width: "calc(100vw - 32px)",
              maxWidth: 360,
            } : {
              marginTop: 8,
              width: 300,
            }),
            background: "#1a1c2e",
            border: "1px solid #374151",
            borderRadius: 24,
            boxShadow: "0 8px 48px rgba(0,0,0,0.6)",
            padding: 20,
            zIndex: 10000,
          }}>
            {/* Header rol */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #1f2937" }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: ROL_COLORES[usuario.rol] + "20", border: `2px solid ${ROL_COLORES[usuario.rol]}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, color: ROL_COLORES[usuario.rol] }}>
                {usuario.nombre?.[0]?.toUpperCase() || "?"}
              </div>
              <div>
                <div style={{ color: ROL_COLORES[usuario.rol], fontSize: 10, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em" }}>{ROL_LABELS[usuario.rol]}</div>
                <div style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>{usuario.nombre || "Sin nombre"}</div>
              </div>
              <button onClick={() => setIsOpen(false)} style={{ marginLeft: "auto", background: "#111827", border: "1px solid #374151", borderRadius: 8, color: "#6b7280", padding: "4px 8px", fontSize: 12, cursor: "pointer" }}>✕</button>
            </div>
 
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ color: "#9ca3af", fontSize: 10, fontWeight: 700, textTransform: "uppercase", cursor: "pointer", display: "block", textAlign: "center" }}>
                📷 Subir foto
                <input type="file" style={{ display: "none" }} onChange={handleFoto} accept="image/*" />
              </label>
 
              {[
                { placeholder: "Nombre completo", key: "nombre" },
                { placeholder: "Correo electrónico", key: "email" },
                { placeholder: "Teléfono", key: "telefono" },
              ].map(({ placeholder, key }) => (
                <input key={key} placeholder={placeholder}
                  style={{ width: "100%", background: "#0b0d17", border: "1px solid #374151", borderRadius: 10, padding: "10px 12px", fontSize: 13, color: "#fff", outline: "none", boxSizing: "border-box" }}
                  value={(usuario as Record<string, string>)[key] || ""}
                  onChange={e => setUsuario(u => ({ ...u, [key]: e.target.value }))}
                />
              ))}
 
              {/* Accesos rápidos */}
              <div style={{ paddingTop: 8, borderTop: "1px solid #1f2937" }}>
                <p style={{ color: "#4b5563", fontSize: 10, fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>Accesos rápidos</p>
                <a href="/viaje" onClick={() => setIsOpen(false)} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  background: "#3b82f610", border: "1px solid #3b82f630",
                  borderRadius: 10, padding: "10px 12px", textDecoration: "none", marginBottom: 6,
                }}>
                  <span style={{ fontSize: 18 }}>✈️</span>
                  <div>
                    <div style={{ color: "#60a5fa", fontWeight: 700, fontSize: 12 }}>Modo Viaje</div>
                    <div style={{ color: "#6b7280", fontSize: 10 }}>Informes desde el estadio</div>
                  </div>
                </a>
                {(usuario.rol === "ojeador" || usuario.rol === "admin") && (
                  <a href="/rendimiento" onClick={() => setIsOpen(false)} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    background: "#f59e0b10", border: "1px solid #f59e0b30",
                    borderRadius: 10, padding: "10px 12px", textDecoration: "none",
                  }}>
                    <span style={{ fontSize: 18 }}>📊</span>
                    <div>
                      <div style={{ color: "#f59e0b", fontWeight: 700, fontSize: 12 }}>{usuario.rol === "admin" ? "Panel de ojeadores" : "Mi rendimiento"}</div>
                      <div style={{ color: "#6b7280", fontSize: 10 }}>Estadísticas del equipo</div>
                    </div>
                  </a>
                )}
              </div>
 
              {usuario.rol === "admin" && (
                <button onClick={() => setMostrarLog(!mostrarLog)} style={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 10, color: "#9ca3af", padding: "8px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                  📋 {mostrarLog ? "Ocultar" : "Ver"} Registro ({logAccesos.length})
                </button>
              )}
              {mostrarLog && usuario.rol === "admin" && (
                <div style={{ background: "#0b0d17", borderRadius: 10, padding: 10, maxHeight: 120, overflowY: "auto" }}>
                  {logAccesos.map((a, i) => (
                    <div key={i} style={{ fontSize: 10, padding: "3px 0", borderBottom: "1px solid #1f2937", color: "#6b7280" }}>
                      <span style={{ color: "#3b82f6" }}>{a.ruta}</span> · {a.hora}
                    </div>
                  ))}
                </div>
              )}
 
              <button onClick={guardarPerfil} style={{ background: "#3b82f6", border: "none", borderRadius: 10, color: "#fff", padding: "12px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Guardar</button>
              <button onClick={() => {
                setAutenticado(false); setIsOpen(false);
                ["scoutpro_auth", "scoutpro_rol", "scoutpro_nombre", "scoutpro_email", "scoutpro_telefono", "scoutpro_ojeador_id"].forEach(k => localStorage.removeItem(k));
              }} style={{ background: "transparent", border: "none", color: "#ef4444", fontSize: 11, fontWeight: 700, cursor: "pointer", textTransform: "uppercase" }}>
                Cerrar Sesión
              </button>
            </div>
          </div>
        )}
      </div>
 
      <Nav />
      <main style={{ paddingBottom: esMobile ? 80 : 0 }} className="relative z-10">{children}</main>
    </>
  );
}