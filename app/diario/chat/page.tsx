"use client"
import { useState } from 'react';

export default function ChatScoutingPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [mensajes, setMensajes] = useState([
    { id: 1, remitente: "Sistema", texto: "Canal seguro activado. Registro auditable en marcha.", tiempo: "10:00", tipo: "sistema" }
  ]);
  const [nuevoMsg, setNuevoMsg] = useState("");

  // Función de acceso (El "Password" que pediste en el audio)
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "scout2026") { // Esta es la contraseña de acceso
      setIsAuthenticated(true);
    } else {
      alert("Acceso denegado: Credenciales de Scouter inválidas");
    }
  };

  const enviarMensaje = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoMsg.trim()) return;
    
    const msg = {
      id: Date.now(),
      remitente: "Scouter Principal",
      texto: nuevoMsg,
      tiempo: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      tipo: "usuario"
    };
    
    setMensajes([...mensajes, msg]);
    setNuevoMsg("");
  };

  // 1. PANTALLA DE BLOQUEO (PASSWORD)
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0b0d17] p-4">
        <div className="bg-[#1a1c2e] p-8 rounded-[35px] border border-slate-800 shadow-2xl w-full max-w-md text-center">
          <div className="text-4xl mb-4">🔐</div>
          <h2 className="text-xl font-black mb-2 uppercase tracking-tight text-white">Acceso Scouter</h2>
          <p className="text-slate-500 text-xs mb-6 uppercase font-bold tracking-widest">Introduce contraseña para desbloquear chat</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password" 
              placeholder="Contraseña de seguridad..." 
              className="w-full bg-[#0b0d17] p-4 rounded-2xl border border-slate-800 outline-none focus:border-blue-500 text-center transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all">
              Entrar al Canal
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. INTERFAZ DEL CHAT (REGISTRO AUDITABLE)
  return (
    <div className="min-h-screen bg-[#0b0d17] p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-4xl flex flex-col h-[85vh]">
        
        {/* Cabecera */}
        <header className="flex justify-between items-center mb-6 bg-[#1a1c2e] p-6 rounded-[25px] border border-slate-800">
          <div>
            <h1 className="text-xl font-black text-white">CHAT DE SCOUTING</h1>
            <p className="text-[10px] text-green-500 font-bold uppercase tracking-[0.2em]">● Scouter Online | Registro Activo</p>
          </div>
          <button onClick={() => setIsAuthenticated(false)} className="text-slate-500 hover:text-white text-xs font-bold">SALIR</button>
        </header>

        {/* Área de Mensajes */}
        <div className="flex-1 bg-[#1a1c2e]/50 border border-slate-800 rounded-[35px] p-6 overflow-y-auto mb-4 space-y-4 shadow-inner">
          {mensajes.map((m) => (
            <div key={m.id} className={`flex ${m.tipo === 'usuario' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-4 rounded-2xl ${
                m.tipo === 'usuario' 
                  ? 'bg-blue-600 rounded-tr-none text-white' 
                  : 'bg-[#0b0d17] border border-slate-800 rounded-tl-none text-slate-300'
              }`}>
                <p className="text-[10px] font-black opacity-50 uppercase mb-1">{m.remitente} • {m.tiempo}</p>
                <p className="text-sm font-medium">{m.texto}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <form onSubmit={enviarMensaje} className="flex gap-3">
          <input 
            type="text"
            placeholder="Escribe información confidencial sobre jugadores..."
            className="flex-1 bg-[#1a1c2e] border border-slate-800 p-4 rounded-2xl outline-none focus:border-blue-500 transition-all text-sm"
            value={nuevoMsg}
            onChange={(e) => setNuevoMsg(e.target.value)}
          />
          <button className="bg-blue-600 px-8 rounded-2xl font-black uppercase text-[10px] hover:bg-blue-500 transition-all">
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
}