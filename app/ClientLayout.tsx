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
  const [ojeadores, setOjeadores] = useState<Ojeador[]>([]);
  const [password, setPassword] = useState("");
  const [usuario, setUsuario] = useState({ nombre: "", rol: "ojeador" as Rol });
  const [isOpen, setIsOpen] = useState(false);
  const [pantalla, setPantalla] = useState<"login" | "registro">("login");

  // Formulario registro
  const [regNombre, setRegNombre] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [passGen, setPassGen] = useState("");

  // 1. CARGAR DATOS DE LA NUBE
  const refreshData = async () => {
    try {
      const res = await fetch(`${APPS_SCRIPT_URL}?action=getOjeadores`);
      const data = await res.json();
      if (Array.isArray(data)) setOjeadores(data);
    } catch (e) {
      console.log("Esperando conexión con Google Sheets...");
    }
  };

  useEffect(() => {
    setMontado(true);
    if (localStorage.getItem("scoutpro_auth") === "true") {
      setAutenticado(true);
      setUsuario({
        nombre: localStorage.getItem("scoutpro_nombre") || "Admin",
        rol: (localStorage.getItem("scoutpro_rol") as Rol) || "admin"
      });
    }
    refreshData();
  }, []);

  // 2. LOGICA DE ACCESO
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "admin99") {
      setAutenticado(true);
      setUsuario({ nombre: "Admin", rol: "admin" });
      localStorage.setItem("scoutpro_auth", "true");
      localStorage.setItem("scoutpro_rol", "admin");
      return;
    }
    const ojeador = ojeadores.find(o => o.password === password);
    if (ojeador) {
      setAutenticado(true);
      setUsuario({ nombre: ojeador.nombre, rol: "ojeador" });
      localStorage.setItem("scoutpro_auth", "true");
      localStorage.setItem("scoutpro_nombre", ojeador.nombre);
      localStorage.setItem("scoutpro_rol", "ojeador");
    } else {
      alert("Clave no encontrada en la nube");
    }
  };

  // 3. REGISTRO Y BORRADO GLOBAL
  const registrarOjeador = async (e: React.FormEvent) => {
    e.preventDefault();
    const nuevaPass = `oj_${regNombre.toLowerCase().split(" ")[0]}${Math.floor(Math.random()*99)}`;
    const nuevo = { action: "registrarOjeador", id: Date.now().toString(), nombre: regNombre, email: regEmail, password: nuevaPass };
    
    await fetch(APPS_SCRIPT_URL, { method: "POST", mode: "no-cors", body: JSON.stringify(nuevo) });
    setPassGen(nuevaPass);
    setTimeout(refreshData, 1500);
  };

  const eliminarTodo = async () => {
    if (!confirm("¿BORRAR TODA LA NUBE?")) return;
    setOjeadores([]);
    await fetch(APPS_SCRIPT_URL, { method: "POST", mode: "no-cors", body: JSON.stringify({ action: "borrarTodos" }) });
    alert("Nube limpiada.");
    setTimeout(refreshData, 1500);
  };

  if (!montado) return null;

  if (!autenticado) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#0b0d17] flex items-center justify-center p-4 text-white">
        <div className="bg-[#1a1c2e] p-8 rounded-[40px] border border-slate-800 w-full max-w-sm shadow-2xl">
          {pantalla === "login" ? (
            <div className="text-center">
              <h2 className="text-xl font-black mb-4 uppercase">ScoutPro Cloud</h2>
              <div className="bg-black/40 p-4 rounded-2xl mb-4 text-left text-[10px] max-h-32 overflow-y-auto">
                <p className="text-blue-400 font-bold mb-1">CLAVES EN LA NUBE:</p>
                {ojeadores.map(o => (
                  <div key={o.id} className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-amber-500">{o.password}</span>
                    <span className="text-slate-400">{o.nombre}</span>
                  </div>
                ))}
              </div>
              <form onSubmit={handleLogin}>
                <input type="password" placeholder="Clave..." className="w-full bg-black p-4 rounded-2xl mb-4 text-center border border-slate-700" onChange={e => setPassword(e.target.value)} />
                <button className="w-full bg-blue-600 py-4 rounded-2xl font-bold uppercase text-xs">Entrar</button>
              </form>
              <button onClick={() => setPantalla("registro")} className="mt-4 text-[10px] text-slate-500 font-bold uppercase">Registrarse →</button>
            </div>
          ) : (
            <div className="text-center">
              <h2 className="text-xl font-black mb-6">NUEVO OJEADOR</h2>
              {passGen ? (
                <div className="bg-black p-6 rounded-3xl border border-amber-500/30">
                  <p className="text-[10px] text-slate-400 mb-2 uppercase">Tu clave es:</p>
                  <p className="text-2xl text-amber-400 font-mono font-bold mb-6">{passGen}</p>
                  <button onClick={() => {setPantalla("login"); setPassGen("")}} className="w-full bg-blue-600 py-4 rounded-xl font-bold">VOLVER</button>
                </div>
              ) : (
                <form onSubmit={registrarOjeador} className="space-y-3">
                  <input placeholder="Nombre" className="w-full bg-black p-4 rounded-2xl border border-slate-700" onChange={e => setRegNombre(e.target.value)} required />
                  <input placeholder="Email" className="w-full bg-black p-4 rounded-2xl border border-slate-700" onChange={e => setRegEmail(e.target.value)} required />
                  <button className="w-full bg-amber-500 py-4 rounded-2xl text-black font-black uppercase text-xs">Guardar en Nube</button>
                  <button type="button" onClick={() => setPantalla("login")} className="block w-full text-[10px] text-slate-500 mt-2 uppercase">Cancelar</button>
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
        <div onClick={() => setIsOpen(!isOpen)} className="bg-[#1a1c2e] p-2 pr-5 rounded-full border border-slate-800 flex items-center gap-3 cursor-pointer">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center font-bold text-white uppercase">{usuario.nombre[0]}</div>
          <div className="text-white text-right">
            <div className="text-[8px] font-bold text-blue-400 uppercase">{usuario.rol}</div>
            <div className="text-xs font-bold">{usuario.nombre}</div>
          </div>
        </div>
        {isOpen && (
          <div className="mt-3 w-64 bg-[#1a1c2e] border border-slate-800 rounded-[32px] p-6 shadow-2xl">
            {usuario.rol === "admin" && (
              <button onClick={eliminarTodo} className="w-full bg-red-500/10 text-red-500 p-4 rounded-2xl text-[10px] font-black border border-red-500/20 mb-4 uppercase">
                🗑️ Limpiar Nube ({ojeadores.length})
              </button>
            )}
            <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="w-full bg-slate-800/50 text-slate-400 p-3 rounded-xl text-[10px] font-bold uppercase">Cerrar Sesión</button>
          </div>
        )}
      </div>
      {!esModoViaje && <Nav />}
      <main className="relative z-10">{children}</main>
    </>
  );
}