"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Nav from "./Nav";

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwVmP41H4_j56ZqAM4lggPuch-z_l8MgGYhlhde-Ry8jZxdDbjjL3G6QxrJaTHsIVRI6g/exec";

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
  const [usuario, setUsuario] = useState({ nombre: "", rol: "ojeador" as Rol });

  // Formulario de registro
  const [regNombre, setRegNombre] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [passwordGenerada, setPasswordGenerada] = useState("");

  // 1. CARGA DE DATOS (POR DETRÁS, NO SE MUESTRA)
  const refreshData = async () => {
    try {
      const res = await fetch(`${APPS_SCRIPT_URL}?action=getOjeadores&t=${Date.now()}`);
      const data = await res.json();
      if (Array.isArray(data)) setOjeadoresCache(data);
    } catch (e) {
      console.log("Error de conexión");
    }
  };

  useEffect(() => {
    setMontado(true);
    if (localStorage.getItem("scoutpro_auth") === "true") {
      setAutenticado(true);
      setUsuario({
        nombre: localStorage.getItem("scoutpro_nombre") || "Usuario",
        rol: (localStorage.getItem("scoutpro_rol") as Rol) || "ojeador"
      });
    }
    refreshData();
  }, []);

  // 2. LÓGICA DE ACCESO
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "admin99") {
      setUsuario({ nombre: "Administrador", rol: "admin" });
      setAutenticado(true);
      localStorage.setItem("scoutpro_auth", "true");
      localStorage.setItem("scoutpro_rol", "admin");
      return;
    }
    
    // Trim para quitar espacios accidentales
    const ojeador = ojeadoresCache.find(o => o.password.trim() === password.trim());
    if (ojeador) {
      setUsuario({ nombre: ojeador.nombre, rol: "ojeador" });
      setAutenticado(true);
      localStorage.setItem("scoutpro_auth", "true");
      localStorage.setItem("scoutpro_nombre", ojeador.nombre);
      localStorage.setItem("scoutpro_rol", "ojeador");
    } else {
      alert("⚠️ Clave incorrecta o no registrada.");
    }
  };

  // 3. REGISTRO Y BORRADO (SOLO ADMIN)
  const handleRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    const pass = `oj_${regNombre.toLowerCase().split(" ")[0]}${Math.floor(Math.random()*89)+10}`;
    const nuevo = { action: "registrarOjeador", id: Date.now().toString(), nombre: regNombre, email: regEmail, password: pass };
    
    // Lo añadimos al instante a la memoria para que pueda entrar ya
    setOjeadoresCache(prev => [...prev, { ...nuevo, password: pass }]);
    
    await fetch(APPS_SCRIPT_URL, { method: "POST", mode: "no-cors", body: JSON.stringify(nuevo) });
    setPasswordGenerada(pass);
    setRegNombre(""); setRegEmail("");
  };

  const eliminarTodo = async () => {
    if (!confirm("⚠️ ¿BORRAR TODA LA NUBE? Esta acción es irreversible.")) return;
    setOjeadoresCache([]);
    await fetch(APPS_SCRIPT_URL, { method: "POST", mode: "no-cors", body: JSON.stringify({ action: "borrarTodos" }) });
    alert("Nube limpiada.");
    refreshData();
  };

  if (!montado) return null;

  if (!autenticado) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#0b0d17] flex items-center justify-center p-4 text-white">
        <div className="bg-[#1a1c2e] p-10 rounded-[40px] border border-slate-800 w-full max-w-sm shadow-2xl">
          {pantalla === "login" ? (
            <div className="text-center">
              <h2 className="text-2xl font-black mb-8 uppercase tracking-tighter">ScoutPro Access</h2>
              
              {/* YA NO HAY LISTA DE OJEADORES AQUÍ */}

              <form onSubmit={handleLogin}>
                <input 
                  type="password" 
                  placeholder="Introduce tu clave privada..." 
                  className="w-full bg-black p-5 rounded-3xl mb-5 text-center border border-slate-700 focus:border-blue-500 outline-none transition-all placeholder:text-slate-600" 
                  onChange={e => setPassword(e.target.value)} 
                />
                <button className="w-full bg-blue-600 hover:bg-blue-500 py-5 rounded-3xl font-black uppercase text-sm tracking-widest transition-colors">ENTRAR AL SISTEMA</button>
              </form>
              <button onClick={() => setPantalla("registro")} className="mt-8 text-[11px] text-slate-500 hover:text-amber-500 font-bold uppercase transition-colors">
                Regístrate como nuevo ojeador →
              </button>
            </div>
          ) : (
            <div className="text-center">
              <h2 className="text-xl font-black mb-6 uppercase tracking-tight">Registro Global</h2>
              {passwordGenerada ? (
                <div className="bg-black p-8 rounded-3xl border border-amber-500/30">
                  <p className="text-[10px] text-slate-400 mb-2 uppercase font-bold">⚠️ Registro exitoso. Guarda tu clave:</p>
                  <p className="text-3xl text-amber-400 font-mono font-black mb-8 tracking-tighter">{passwordGenerada}</p>
                  <button onClick={() => {setPantalla("login"); setPasswordGenerada("")}} className="w-full bg-blue-600 py-4 rounded-xl font-bold">IR AL LOGIN</button>
                </div>
              ) : (
                <form onSubmit={handleRegistro} className="space-y-3">
                  <input placeholder="Nombre completo" className="w-full bg-black p-4 rounded-2xl border border-slate-700 outline-none" onChange={e => setRegNombre(e.target.value)} required />
                  <input type="email" placeholder="Email" className="w-full bg-black p-4 rounded-2xl border border-slate-700 outline-none" onChange={e => setRegEmail(e.target.value)} required />
                  <button className="w-full bg-amber-500 py-4 rounded-2xl text-black font-black uppercase text-xs mt-3">Crear cuenta global</button>
                  <button type="button" onClick={() => setPantalla("login")} className="block w-full text-[10px] text-slate-500 mt-4 uppercase font-bold hover:underline">Volver</button>
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
      <div className="fixed top-4 right-6 z-[9999]">
        <div onClick={() => setIsOpen(!isOpen)} className="bg-[#1a1c2e]/90 backdrop-blur-md p-2 pr-5 rounded-full border border-slate-800 flex items-center gap-3 cursor-pointer hover:border-blue-500 transition-all shadow-xl">
          <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center font-black text-white shadow-lg shadow-blue-500/20">{usuario.nombre[0]}</div>
          <div className="text-white text-right">
            <div className="text-[8px] font-blackleading-none mb-1 text-blue-400 uppercase tracking-tighter">{usuario.rol}</div>
            <div className="text-xs font-bold">{usuario.nombre}</div>
          </div>
        </div>
        {isOpen && (
          <div className="mt-3 w-64 bg-[#1a1c2e] border border-slate-800 rounded-[32px] p-6 shadow-2xl">
            <div className="space-y-4">
              {usuario.rol === "admin" && (
                <button 
                  onClick={eliminarTodo} 
                  className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 p-4 rounded-2xl text-[10px] font-black border border-red-500/20 transition-all uppercase tracking-widest"
                >
                  🗑️ Borrar Base de Datos Global
                </button>
              )}
              <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="w-full bg-slate-800/50 text-slate-400 p-3 rounded-xl text-[10px] font-bold uppercase hover:text-white transition-colors">Cerrar Sesión</button>
            </div>
          </div>
        )}
      </div>
      {!esModoViaje && <Nav />}
      <main className="relative z-10">{children}</main>
    </>
  );
}