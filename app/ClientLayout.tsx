"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Nav from "./Nav";

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxpQTkl1mrCtAYEBewlOMSCrFVo_34YXMRqMyREPBc62JLpkHs8yKNDheTcu94hqFp-ZQ/exec";

type Rol = "admin" | "scout" | "director" | "ojeador";
type Ojeador = { id: string; nombre: string; email: string; password: string };

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const esModoViaje = pathname === "/viaje"; 
  
  const [montado, setMontado] = useState(false);
  const [autenticado, setAutenticado] = useState(false);
  const [password, setPassword] = useState("");
  const [ojeadoresCache, setOjeadoresCache] = useState<Ojeador[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [pantalla, setPantalla] = useState<"login" | "registro">("login");
  const [usuario, setUsuario] = useState({ nombre: "", rol: "ojeador" as Rol, foto: null as string | null });

  const [regNombre, setRegNombre] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [passwordGenerada, setPasswordGenerada] = useState("");

  const refreshData = async () => {
    try {
      const res = await fetch(`${APPS_SCRIPT_URL}?action=getOjeadores&t=${Date.now()}`);
      const data = await res.json();
      if (Array.isArray(data)) setOjeadoresCache(data);
    } catch (e) { console.log("Error de conexión"); }
  };

  useEffect(() => {
    setMontado(true);
    const auth = localStorage.getItem("scoutpro_auth") === "true";
    if (auth) {
      setAutenticado(true);
      setUsuario({
        nombre: localStorage.getItem("scoutpro_nombre") || "Usuario",
        rol: (localStorage.getItem("scoutpro_rol") as Rol) || "ojeador",
        foto: localStorage.getItem("scoutpro_foto") || null
      });
    }
    refreshData();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "admin99") {
      setUsuario({ nombre: "Administrador", rol: "admin", foto: null });
      setAutenticado(true);
      localStorage.setItem("scoutpro_auth", "true");
      localStorage.setItem("scoutpro_rol", "admin");
      return;
    }
    const ojeador = ojeadoresCache.find(o => o.password.trim() === password.trim());
    if (ojeador) {
      setUsuario({ nombre: ojeador.nombre, rol: "ojeador", foto: null });
      setAutenticado(true);
      localStorage.setItem("scoutpro_auth", "true");
      localStorage.setItem("scoutpro_nombre", ojeador.nombre);
      localStorage.setItem("scoutpro_rol", "ojeador");
    } else { alert("⚠️ Clave incorrecta."); }
  };

  const handleRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    const pass = `oj_${regNombre.toLowerCase().split(" ")[0]}${Math.floor(Math.random()*89)+10}`;
    const nuevo = { action: "registrarOjeador", id: Date.now().toString(), nombre: regNombre, email: regEmail, password: pass };
    setOjeadoresCache(prev => [...prev, { ...nuevo, password: pass }]);
    await fetch(APPS_SCRIPT_URL, { method: "POST", mode: "no-cors", body: JSON.stringify(nuevo) });
    setPasswordGenerada(pass);
  };

  const eliminarTodo = async () => {
    if (!confirm("⚠️ ¿BORRAR TODA LA NUBE?")) return;
    setOjeadoresCache([]);
    await fetch(APPS_SCRIPT_URL, { method: "POST", mode: "no-cors", body: JSON.stringify({ action: "borrarTodos" }) });
    refreshData();
  };

  if (!montado) return null;

  if (!autenticado) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#0b0d17] flex items-center justify-center p-4 text-white">
        <div className="bg-[#1a1c2e] p-10 rounded-[40px] border border-slate-800 w-full max-w-sm shadow-2xl">
          {pantalla === "login" ? (
            <div className="text-center">
              <h2 className="text-2xl font-black mb-8 uppercase italic text-blue-500 tracking-tighter">ScoutPro</h2>
              <form onSubmit={handleLogin}>
                <input type="password" placeholder="Clave de acceso..." className="w-full bg-black p-5 rounded-3xl mb-5 text-center border border-slate-700 outline-none focus:border-blue-500 transition-all" onChange={e => setPassword(e.target.value)} />
                <button className="w-full bg-blue-600 hover:bg-blue-500 py-5 rounded-3xl font-black uppercase text-sm shadow-lg shadow-blue-500/20 transition-all">ENTRAR</button>
              </form>
              <button onClick={() => setPantalla("registro")} className="mt-8 text-[11px] text-slate-500 hover:text-amber-500 font-bold uppercase transition-colors">Nuevo Registro →</button>
            </div>
          ) : (
            <div className="text-center">
              <h2 className="text-xl font-black mb-6 uppercase">Registro Global</h2>
              {passwordGenerada ? (
                <div className="bg-black p-8 rounded-3xl border border-amber-500/30">
                  <p className="text-[10px] text-slate-400 mb-2 uppercase">Tu clave privada:</p>
                  <p className="text-3xl text-amber-400 font-mono font-black mb-8 tracking-tighter">{passwordGenerada}</p>
                  <button onClick={() => {setPantalla("login"); setPasswordGenerada("")}} className="w-full bg-blue-600 py-4 rounded-xl font-bold uppercase transition-all">Ir al Login</button>
                </div>
              ) : (
                <form onSubmit={handleRegistro} className="space-y-3">
                  <input placeholder="Nombre completo" className="w-full bg-black p-4 rounded-2xl border border-slate-700 outline-none" onChange={e => setRegNombre(e.target.value)} required />
                  <input type="email" placeholder="Correo electrónico" className="w-full bg-black p-4 rounded-2xl border border-slate-700 outline-none" onChange={e => setRegEmail(e.target.value)} required />
                  <button className="w-full bg-amber-500 hover:bg-amber-400 py-4 rounded-2xl text-black font-black uppercase text-[10px] mt-3 transition-all">Registrar en Base de Datos</button>
                  <button type="button" onClick={() => setPantalla("login")} className="block w-full text-[10px] text-slate-500 mt-4 uppercase font-bold hover:text-white transition-colors">Volver</button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      {!esModoViaje && (
        <div className="fixed top-4 right-6 z-[9999] flex items-center gap-4">
          {/* ICONO MENSAJERÍA */}
          <a href="/mensajeria" className="w-10 h-10 bg-[#1a1c2e]/90 rounded-full border border-slate-800 flex items-center justify-center text-lg hover:bg-slate-800 transition-all no-underline relative">
            🔔 <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[8px] flex items-center justify-center font-bold text-white shadow-sm">1</span>
          </a>

          <div onClick={() => setIsOpen(!isOpen)} className="bg-[#1a1c2e]/90 backdrop-blur-md p-1.5 pr-5 rounded-full border border-slate-800 flex items-center gap-3 cursor-pointer hover:border-blue-500 transition-all shadow-xl">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center font-black text-white uppercase text-xs">
              {usuario.foto ? <img src={usuario.foto} className="w-full h-full object-cover rounded-full" /> : usuario.nombre[0]}
            </div>
            <div className="text-white text-right">
              <div className="text-[7px] font-black text-blue-400 uppercase tracking-tighter">{usuario.rol}</div>
              <div className="text-[11px] font-bold leading-tight">{usuario.nombre}</div>
            </div>
          </div>

          {isOpen && (
            <div className="absolute top-14 right-0 w-64 bg-[#1a1c2e] border border-slate-800 rounded-[32px] p-6 shadow-2xl animate-in fade-in slide-in-from-top-2">
              <div className="space-y-3">
                {/* OPCIONES SEGÚN ROL RESTAURADAS */}
                {(usuario.rol === "admin" || usuario.rol === "director") && (
                  <a href="/informes" className="block w-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 p-3 rounded-2xl text-[10px] font-black border border-amber-500/20 text-center no-underline uppercase tracking-widest transition-all">
                    📋 Informes Ojeadores
                  </a>
                )}

                <a href="/viaje" className="block w-full bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 p-3 rounded-2xl text-[10px] font-black border border-blue-500/20 text-center no-underline uppercase tracking-widest transition-all">
                  ✈️ Modo Viaje
                </a>

                {usuario.rol === "admin" && (
                  <button onClick={eliminarTodo} className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 p-3 rounded-2xl text-[10px] font-black border border-red-500/20 uppercase tracking-widest transition-all">
                    🗑️ Borrar Nube ({ojeadoresCache.length})
                  </button>
                )}
                
                <hr className="border-white/5 my-2" />
                
                <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="w-full bg-slate-800/50 text-slate-400 p-3 rounded-xl text-[10px] font-bold uppercase hover:text-white transition-colors">Cerrar Sesión</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* NAVEGACIÓN PRINCIPAL */}
      {!esModoViaje && <Nav />}
      
      <main className={`relative z-10 ${esModoViaje ? 'pt-0' : 'pt-4'}`}>
        {children}
      </main>
    </>
  );
}