"use client"
import { useState } from "react";

export function PerfilUsuario() {
  const [isOpen, setIsOpen] = useState(false);
  
  // Estado inicial vacío para que el usuario ponga sus datos reales
  const [user, setUser] = useState({
    nombre: "",
    email: "",
    telefono: "",
    foto: null as string | null,
    rol: "Usuario",
    informes: 0
  });

  const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setUser({ ...user, foto: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed top-4 right-6 z-[100] flex flex-col items-end">
      {/* Botón de Perfil */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 bg-[#1a1c2e] p-2 pr-5 rounded-full border border-slate-800 cursor-pointer hover:border-blue-500 transition-all shadow-2xl"
      >
        <div className="w-10 h-10 bg-slate-800 rounded-full overflow-hidden flex items-center justify-center border border-slate-700">
          {user.foto ? (
            <img src={user.foto} alt="Perfil" className="w-full h-full object-cover" />
          ) : (
            <span className="font-black text-white text-xs">{user.nombre ? user.nombre[0].toUpperCase() : "?"}</span>
          )}
        </div>
        <div className="flex flex-col text-right">
          <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest leading-none mb-1">{user.rol}</span>
          <span className="text-xs font-bold text-white">{user.nombre || "Configurar Perfil"}</span>
        </div>
      </div>

      {/* Panel de Registro/Edición */}
      {isOpen && (
        <div className="mt-4 w-80 bg-[#1a1c2e] border border-slate-800 rounded-[30px] shadow-2xl p-6 animate-in fade-in zoom-in duration-200">
          <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6 text-center">Mis Datos Reales</h3>
          
          <div className="space-y-4">
            <div className="flex flex-col items-center mb-2">
              <label className="text-[10px] text-blue-500 font-black uppercase cursor-pointer hover:underline">
                Subir mi Foto
                <input type="file" className="hidden" onChange={handleFoto} accept="image/*" />
              </label>
            </div>

            <input 
              placeholder="Nombre y Apellidos"
              className="w-full bg-[#0b0d17] p-3 rounded-xl border border-slate-800 text-xs text-white outline-none focus:border-blue-500"
              value={user.nombre}
              onChange={(e) => setUser({...user, nombre: e.target.value})}
            />
            <input 
              placeholder="Correo Electrónico"
              className="w-full bg-[#0b0d17] p-3 rounded-xl border border-slate-800 text-xs text-white outline-none focus:border-blue-500"
              value={user.email}
              onChange={(e) => setUser({...user, email: e.target.value})}
            />
            <input 
              placeholder="Teléfono (Registro Auditable)"
              className="w-full bg-[#0b0d17] p-3 rounded-xl border border-slate-800 text-xs text-white outline-none focus:border-blue-500"
              value={user.telefono}
              onChange={(e) => setUser({...user, telefono: e.target.value})}
            />
          </div>

          <button 
            onClick={() => { setIsOpen(false); alert("Perfil actualizado correctamente"); }}
            className="w-full mt-6 bg-blue-600 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20"
          >
            Guardar mis datos
          </button>
        </div>
      )}
    </div>
  );
}