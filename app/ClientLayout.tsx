"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Nav from "./Nav";
 
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwVmP41H4_j56ZqAM4lggPuch-z_l8MgGYhlhde-Ry8jZxdDbjjL3G6QxrJaTHsIVRI6g/exec";
 
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
 
// ── Caché local ───────────────────────────────────────────────────
function getOjeadoresLocal(): OjeadorRegistrado[] {
  try { return JSON.parse(localStorage.getItem("ojeadores_registrados") || "[]"); } catch { return []; }
}
function saveOjeadoresLocal(lista: OjeadorRegistrado[]) {
  try { localStorage.setItem("ojeadores_registrados", JSON.stringify(lista)); } catch {}
}
 
// ── API Google Sheets via Apps Script ────────────────────────────
async function fetchOjeadoresRemoto(): Promise<OjeadorRegistrado[]> {
  try {
    const res = await fetch(`${APPS_SCRIPT_URL}?action=getOjeadores`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}
 
async function registrarOjeadorRemoto(ojeador: OjeadorRegistrado): Promise<{ ok?: boolean; error?: string }> {
  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify({ action: "registrarOjeador", ...ojeador }),
    });
    return await res.json();
  } catch { return { error: "Sin conexión" }; }
}
 
function generarPassword(nombre: string): string {
  const base = nombre.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
  return `ojeador_${base}`;
}
 
export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const esModoViaje = pathname === "/viaje";
 
  const [montado, setMontado] = useState(false);
  const [autenticado, setAutenticado] = useState(false);
  const [password, setPassword] = useState("");
  const [usuario, setUsuario] = useState<Usuario>({ nombre: "", email: "", telefono: "", foto: null, rol: "ojeador" });
  const [isOpen, setIsOpen] = useState(false);
  const [logAccesos, setLogAccesos] = useState<{ ruta: string; hora: string; usuario: string }[]>([]);
  const [mostrarLog, setMostrarLog] = useState(false);
  const [error, setError] = useState("");
  const [pantalla, setPantalla] = useState<"login" | "registro">("login");
  const [ojeadoresCache, setOjeadoresCache] = useState<OjeadorRegistrado[]>([]);
  const [cargandoOjeadores, setCargandoOjeadores] = useState(false);
 
  // Registro
  const [regNombre, setRegNombre] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regTelefono, setRegTelefono] = useState("");
  const [regError, setRegError] = useState("");
  const [passwordGenerada, setPasswordGenerada] = useState("");
  const [registroCompletado, setRegistroCompletado] = useState(false);
  const [guardandoRegistro, setGuardandoRegistro] = useState(false);
 
  useEffect(() => {
    const auth = localStorage.getItem("scoutpro_auth") === "true";
    const rol = (localStorage.getItem("scoutpro_rol") as Rol) || "ojeador";
    const nombre = localStorage.getItem("scoutpro_nombre") || "";
    const email = localStorage.getItem("scoutpro_email") || "";
    const telefono = localStorage.getItem("scoutpro_telefono") || "";
    if (auth) { setAutenticado(true); setUsuario(u => ({ ...u, rol, nombre, email, telefono })); }
    setMontado(true);
 
    // Caché local inmediata + actualización remota
    setOjeadoresCache(getOjeadoresLocal());
    setCargandoOjeadores(true);
    fetchOjeadoresRemoto().then(remotos => {
      if (remotos.length > 0) {
        setOjeadoresCache(remotos);
        saveOjeadoresLocal(remotos);
      }
      setCargandoOjeadores(false);
    });
  }, []);
 
  useEffect(() => {
    if (!autenticado || !montado) return;
    const ruta = window.location.pathname;
    setLogAccesos(prev => [{ ruta, hora: new Date().toLocaleString("es-ES"), usuario: usuario.nombre || "Anónimo" }, ...prev].slice(0, 50));
  }, [autenticado, montado]);
 
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
 
    // Credenciales fijas
    const rolFijo = CREDENCIALES_FIJAS[password];
    if (rolFijo) {
      setUsuario(u => ({ ...u, rol: rolFijo }));
      setAutenticado(true);
      localStorage.setItem("scoutpro_auth", "true");
      localStorage.setItem("scoutpro_rol", rolFijo);
      setError(""); return;
    }
 
    // Buscar ojeador — primero caché, luego remoto
    let ojeadores = ojeadoresCache.length > 0 ? ojeadoresCache : await fetchOjeadoresRemoto();
    let ojeador = ojeadores.find(o => o.password === password);
 
    // Si no encontró, forzar recarga remota por si la caché estaba desactualizada
    if (!ojeador) {
      ojeadores = await fetchOjeadoresRemoto();
      saveOjeadoresLocal(ojeadores);
      setOjeadoresCache(ojeadores);
      ojeador = ojeadores.find(o => o.password === password);
    }
 
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
 
  async function handleRegistro(e: React.FormEvent) {
    e.preventDefault();
    setRegError("");
    if (!regNombre.trim() || !regEmail.trim() || !regTelefono.trim()) {
      setRegError("Todos los campos son obligatorios"); return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail)) {
      setRegError("El correo no es válido"); return;
    }
 
    // Verificar duplicado en remoto
    const remotos = await fetchOjeadoresRemoto();
    if (remotos.find(o => o.email === regEmail)) {
      setRegError("Ya existe un ojeador con ese correo"); return;
    }
 
    const pass = generarPassword(regNombre);
    const nuevo: OjeadorRegistrado = {
      id: Date.now().toString(),
      nombre: regNombre.trim(),
      email: regEmail.trim(),
      telefono: regTelefono.trim(),
      password: pass,
      fechaRegistro: new Date().toLocaleDateString("es-ES"),
    };
 
    setGuardandoRegistro(true);
    const resultado = await registrarOjeadorRemoto(nuevo);
    setGuardandoRegistro(false);
 
    if (resultado.error) { setRegError(resultado.error); return; }
 
    const actualizados = [...remotos, nuevo];
    setOjeadoresCache(actualizados);
    saveOjeadoresLocal(actualizados);
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
    setIsOpen(false);
  }
 
  if (!montado) return null;
 
 
  if (!autenticado) {
    return (
      <div className="fixed inset-0 z-[10000] bg-[#0b0d17] flex items-center justify-center p-4">
        {pantalla === "login" ? (
          <form onSubmit={handleLogin} className="bg-[#1a1c2e] p-10 rounded-[40px] border border-slate-800 w-full max-w-sm text-center shadow-2xl">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto mb-6 flex items-center justify-center text-2xl shadow-lg shadow-blue-500/20">🛡️</div>
            <h2 className="text-2xl font-black mb-2 uppercase tracking-tighter text-white">ScoutPro Access</h2>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-6">Introduce tu clave de acceso</p>
            <div className="text-left mb-4 bg-[#0b0d17] rounded-2xl p-4 border border-slate-800">
              <p className="text-[9px] text-slate-500 uppercase font-bold mb-2">Claves del equipo:</p>
              {Object.entries(CREDENCIALES_FIJAS).map(([pass, rol]) => (
                <div key={pass} className="flex justify-between text-[10px] py-1">
                  <span className="text-slate-400 font-mono">{pass}</span>
                  <span style={{ color: ROL_COLORES[rol] }} className="font-bold">{ROL_LABELS[rol]}</span>
                </div>
              ))}
              {ojeadoresCache.length > 0 && (
                <>
                  <p className="text-[9px] text-slate-500 uppercase font-bold mb-2 mt-3">
                    Ojeadores {cargandoOjeadores ? "⏳" : `(${ojeadoresCache.length})`}:
                  </p>
                  {ojeadoresCache.map(o => (
                    <div key={o.id} className="flex justify-between text-[10px] py-1">
                      <span className="text-slate-400 font-mono">{o.password}</span>
                      <span style={{ color: ROL_COLORES["ojeador"] }} className="font-bold">👁️ {o.nombre}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
            <input type="password" placeholder="Contraseña..."
              className="w-full bg-[#0b0d17] p-4 rounded-2xl border border-slate-800 mb-2 outline-none focus:border-blue-500 text-center text-white"
              onChange={e => setPassword(e.target.value)} />
            {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
            <button className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all text-white mt-2">
              Entrar al Sistema
            </button>
            <div className="mt-4 pt-4 border-t border-slate-800">
              <p className="text-slate-500 text-[10px] mb-2">¿Eres ojeador nuevo?</p>
              <button type="button" onClick={() => setPantalla("registro")} className="text-[11px] font-bold text-amber-400 hover:underline">
                👁️ Registrarse como Ojeador Externo →
              </button>
            </div>
          </form>
 
        ) : registroCompletado ? (
          <div className="bg-[#1a1c2e] p-10 rounded-[40px] border border-slate-800 w-full max-w-sm text-center shadow-2xl">
            <div className="w-16 h-16 bg-amber-500 rounded-2xl mx-auto mb-6 flex items-center justify-center text-2xl">✅</div>
            <h2 className="text-xl font-black mb-2 text-white">¡Registro completado!</h2>
            <p className="text-slate-400 text-xs mb-6">Cuenta creada y guardada en el sistema. Guarda tu contraseña:</p>
            <div className="bg-[#0b0d17] rounded-2xl p-5 border border-amber-500/30 mb-6">
              <p className="text-[10px] text-slate-500 uppercase font-bold mb-2">Tu contraseña de acceso</p>
              <div className="text-amber-400 font-mono font-black text-lg tracking-wider">{passwordGenerada}</div>
              <p className="text-[10px] text-slate-600 mt-2">Anótala, no podrás recuperarla</p>
            </div>
            <button onClick={() => navigator.clipboard.writeText(passwordGenerada)}
              className="w-full bg-slate-800 py-3 rounded-2xl text-xs font-bold text-slate-300 mb-3">📋 Copiar contraseña</button>
            <button onClick={() => { setRegistroCompletado(false); setPantalla("login"); setPassword(""); setRegNombre(""); setRegEmail(""); setRegTelefono(""); }}
              className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-black uppercase text-xs text-white">
              Ir al Login →
            </button>
          </div>
 
        ) : (
          <form onSubmit={handleRegistro} className="bg-[#1a1c2e] p-10 rounded-[40px] border border-slate-800 w-full max-w-sm text-center shadow-2xl">
            <div className="w-16 h-16 bg-amber-500 rounded-2xl mx-auto mb-6 flex items-center justify-center text-2xl">👁️</div>
            <h2 className="text-xl font-black mb-2 uppercase tracking-tighter text-white">Registro de Ojeador</h2>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.15em] mb-6">Rellena tus datos para unirte</p>
            <div className="space-y-3 text-left mb-4">
              <div>
                <label className="text-[9px] text-slate-400 uppercase font-bold block mb-1">Nombre completo *</label>
                <input value={regNombre} onChange={e => setRegNombre(e.target.value)} placeholder="Ej: Diego García"
                  className="w-full bg-[#0b0d17] p-3 rounded-xl border border-slate-800 text-sm text-white outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="text-[9px] text-slate-400 uppercase font-bold block mb-1">Correo electrónico *</label>
                <input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="diego@ejemplo.com"
                  className="w-full bg-[#0b0d17] p-3 rounded-xl border border-slate-800 text-sm text-white outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="text-[9px] text-slate-400 uppercase font-bold block mb-1">Teléfono *</label>
                <input type="tel" value={regTelefono} onChange={e => setRegTelefono(e.target.value)} placeholder="+34 600 000 000"
                  className="w-full bg-[#0b0d17] p-3 rounded-xl border border-slate-800 text-sm text-white outline-none focus:border-amber-500" />
              </div>
            </div>
            {regNombre && (
              <div className="bg-[#0b0d17] rounded-xl p-3 border border-amber-500/20 mb-4 text-left">
                <p className="text-[9px] text-slate-500 uppercase font-bold mb-1">Tu contraseña será:</p>
                <p className="text-amber-400 font-mono font-bold text-sm">{generarPassword(regNombre)}</p>
              </div>
            )}
            {regError && <p className="text-red-500 text-xs mb-3">{regError}</p>}
            <button type="submit" disabled={guardandoRegistro}
              className="w-full bg-amber-500 hover:bg-amber-400 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all text-black mb-3 disabled:opacity-50">
              {guardandoRegistro ? "⏳ Guardando en el sistema..." : "Crear mi cuenta"}
            </button>
            <button type="button" onClick={() => { setPantalla("login"); setRegError(""); }}
              className="text-[10px] font-bold text-slate-500 hover:underline">← Volver al login</button>
          </form>
        )}
      </div>
    );
  }
 
  return (
    <>
      {!esModoViaje && (
        <div className="fixed top-4 right-6 z-[9999] flex flex-col items-end">
          <div onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-3 bg-[#1a1c2e]/90 backdrop-blur-md p-2 pr-5 rounded-full border border-slate-800 cursor-pointer hover:border-blue-500 transition-all shadow-2xl">
            <div className="w-10 h-10 bg-slate-800 rounded-full overflow-hidden flex items-center justify-center border border-slate-700">
              {usuario.foto
                ? <img src={usuario.foto} className="w-full h-full object-cover" alt="" />
                : <span className="text-white text-xs font-bold">{usuario.nombre ? usuario.nombre[0].toUpperCase() : "?"}</span>
              }
            </div>
            <div className="flex flex-col text-right">
              <span className="text-[9px] font-black uppercase tracking-widest leading-none mb-1" style={{ color: ROL_COLORES[usuario.rol] }}>{ROL_LABELS[usuario.rol]}</span>
              <span className="text-xs font-bold text-white">{usuario.nombre || "Configurar Perfil"}</span>
            </div>
          </div>
 
          {isOpen && (
            <div className="mt-4 w-80 bg-[#1a1c2e] border border-slate-800 rounded-[30px] shadow-2xl p-6">
              <h3 className="text-[10px] font-black text-white uppercase tracking-widest mb-4 text-center">Mi Perfil</h3>
              <div className="space-y-3">
                <label className="text-[9px] text-blue-400 font-black uppercase cursor-pointer block text-center hover:underline">
                  📷 Subir foto
                  <input type="file" className="hidden" onChange={handleFoto} accept="image/*" />
                </label>
                <input placeholder="Nombre completo" className="w-full bg-[#0b0d17] p-3 rounded-xl border border-slate-800 text-xs text-white outline-none focus:border-blue-500" value={usuario.nombre} onChange={e => setUsuario(u => ({ ...u, nombre: e.target.value }))} />
                <input placeholder="Correo electrónico" className="w-full bg-[#0b0d17] p-3 rounded-xl border border-slate-800 text-xs text-white outline-none focus:border-blue-500" value={usuario.email} onChange={e => setUsuario(u => ({ ...u, email: e.target.value }))} />
                <input placeholder="Teléfono" className="w-full bg-[#0b0d17] p-3 rounded-xl border border-slate-800 text-xs text-white outline-none focus:border-blue-500" value={usuario.telefono} onChange={e => setUsuario(u => ({ ...u, telefono: e.target.value }))} />
 
                <div className="pt-2 border-t border-slate-800">
                  <p className="text-[9px] text-slate-500 uppercase font-bold mb-2">Accesos rápidos</p>
                  <a href="/viaje" onClick={() => setIsOpen(false)} className="flex items-center gap-3 w-full bg-blue-600/10 border border-blue-500/30 py-3 px-4 rounded-xl text-xs font-bold text-blue-400 mb-2 hover:bg-blue-600/20 transition-all" style={{ textDecoration: "none" }}>
                    <span className="text-lg">✈️</span>
                    <div>
                      <div className="font-black">Modo Viaje</div>
                      <div className="text-[10px] text-slate-500 font-normal">Informes rápidos desde el estadio</div>
                    </div>
                  </a>
                  {(usuario.rol === "ojeador" || usuario.rol === "admin") && (
                    <a href="/rendimiento" onClick={() => setIsOpen(false)} className="flex items-center gap-3 w-full bg-amber-500/10 border border-amber-500/30 py-3 px-4 rounded-xl text-xs font-bold text-amber-400 mb-2 hover:bg-amber-500/20 transition-all" style={{ textDecoration: "none" }}>
                      <span className="text-lg">📊</span>
                      <div>
                        <div className="font-black">{usuario.rol === "admin" ? "Panel de ojeadores" : "Mi rendimiento"}</div>
                        <div className="text-[10px] text-slate-500 font-normal">{usuario.rol === "admin" ? "Rendimiento de todo el equipo" : "Estadísticas de mis informes"}</div>
                      </div>
                    </a>
                  )}
                </div>
 
                {usuario.rol === "admin" && (
                  <button onClick={() => setMostrarLog(!mostrarLog)} className="w-full bg-slate-800 py-2 rounded-xl text-[10px] font-bold text-slate-300 uppercase">
                    📋 {mostrarLog ? "Ocultar" : "Ver"} Registro ({logAccesos.length})
                  </button>
                )}
                {mostrarLog && usuario.rol === "admin" && (
                  <div className="bg-[#0b0d17] rounded-xl p-3 max-h-40 overflow-y-auto">
                    {logAccesos.length === 0
                      ? <p className="text-slate-600 text-[10px] text-center">Sin accesos</p>
                      : logAccesos.map((a, i) => (
                        <div key={i} className="text-[10px] py-1 border-b border-slate-800">
                          <span className="text-blue-400">{a.ruta}</span>
                          <span className="text-slate-500 ml-2">{a.hora}</span>
                          <span className="text-green-400 ml-2">{a.usuario}</span>
                        </div>
                      ))
                    }
                  </div>
                )}
                <button onClick={guardarPerfil} className="w-full bg-blue-600 py-3 rounded-xl font-black uppercase text-[10px] text-white">Guardar</button>
                <button onClick={() => {
                  setAutenticado(false); setIsOpen(false);
                  localStorage.removeItem("scoutpro_auth"); localStorage.removeItem("scoutpro_rol");
                  localStorage.removeItem("scoutpro_nombre"); localStorage.removeItem("scoutpro_email");
                  localStorage.removeItem("scoutpro_telefono"); localStorage.removeItem("scoutpro_ojeador_id");
                }} className="w-full text-[9px] font-bold text-red-500 uppercase hover:underline">
                  Cerrar Sesión
                </button>
              </div>
            </div>
          )}
        </div>
      )}
 
      {!esModoViaje && <Nav />}
      <main className="relative z-10">{children}</main>
    </>
  );
}