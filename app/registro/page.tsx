'use client'
 
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
 
export default function RegistroPage() {
  const router = useRouter()
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [exito, setExito] = useState('')
 
  const handleRegistro = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setExito('')
 
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nombre } }
    })
 
    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }
 
    const userId = data.user?.id
    if (!userId) {
      setError('Error al crear usuario')
      setLoading(false)
      return
    }
 
    const { error: perfilError } = await supabase
      .from('perfiles')
      .insert({
        id: userId,
        nombre,
        email,
        rol: 'ojeador',
        club: null,
        avatar_url: null,
      })
 
    if (perfilError) {
      setError('Error al crear perfil: ' + perfilError.message)
      setLoading(false)
      return
    }
 
    setExito('Cuenta creada correctamente')
    setTimeout(() => router.push('/dashboard'), 2000)
    setLoading(false)
  }
 
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
 
        * { box-sizing: border-box; margin: 0; padding: 0; }
 
        .registro-root {
          min-height: 100vh;
          background: #080c14;
          display: flex;
          font-family: 'DM Sans', sans-serif;
          position: relative;
          overflow: hidden;
        }
 
        /* Fondo animado */
        .bg-orb {
          position: fixed;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          z-index: 0;
        }
        .bg-orb-1 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%);
          top: -100px; left: -100px;
          animation: floatOrb1 12s ease-in-out infinite;
        }
        .bg-orb-2 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%);
          bottom: -80px; right: -80px;
          animation: floatOrb2 15s ease-in-out infinite;
        }
        @keyframes floatOrb1 {
          0%, 100% { transform: translate(0,0); }
          50% { transform: translate(40px, 30px); }
        }
        @keyframes floatOrb2 {
          0%, 100% { transform: translate(0,0); }
          50% { transform: translate(-30px, -20px); }
        }
 
        /* Grid decorativo */
        .bg-grid {
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 48px 48px;
          z-index: 0;
        }
 
        /* Layout principal */
        .registro-left {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 60px;
          position: relative;
          z-index: 1;
        }
 
        .registro-right {
          width: 480px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
          position: relative;
          z-index: 1;
        }
 
        /* Lado izquierdo — branding */
        .brand-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 80px;
        }
        .brand-icon {
          width: 40px; height: 40px;
          background: linear-gradient(135deg, #10b981, #059669);
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 24px rgba(16,185,129,0.3);
        }
        .brand-icon svg { width: 20px; height: 20px; color: white; }
        .brand-name {
          font-family: 'Syne', sans-serif;
          font-size: 15px;
          font-weight: 700;
          color: white;
          letter-spacing: 0.02em;
        }
        .brand-sub {
          font-size: 12px;
          color: #4b5563;
          font-weight: 400;
        }
 
        .left-headline {
          font-family: 'Syne', sans-serif;
          font-size: clamp(36px, 4vw, 56px);
          font-weight: 800;
          color: white;
          line-height: 1.1;
          letter-spacing: -0.02em;
          margin-bottom: 20px;
        }
        .left-headline span {
          background: linear-gradient(135deg, #10b981, #34d399);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
 
        .left-desc {
          color: #6b7280;
          font-size: 16px;
          line-height: 1.6;
          max-width: 420px;
          margin-bottom: 48px;
        }
 
        .features-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .feature-item {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #9ca3af;
          font-size: 14px;
        }
        .feature-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #10b981;
          flex-shrink: 0;
          box-shadow: 0 0 8px rgba(16,185,129,0.5);
        }
 
        /* Tarjeta de registro */
        .card {
          background: rgba(17, 24, 39, 0.8);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 24px;
          padding: 40px;
          width: 100%;
          backdrop-filter: blur(20px);
          box-shadow: 0 25px 60px rgba(0,0,0,0.4);
          animation: slideUp 0.5s ease forwards;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
 
        .card-title {
          font-family: 'Syne', sans-serif;
          font-size: 24px;
          font-weight: 700;
          color: white;
          margin-bottom: 6px;
        }
        .card-subtitle {
          color: #6b7280;
          font-size: 13px;
          margin-bottom: 32px;
        }
 
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 20px;
        }
 
        .input-wrapper {
          position: relative;
        }
        .input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #4b5563;
          width: 16px; height: 16px;
        }
        .form-input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 13px 14px 13px 40px;
          color: white;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
        }
        .form-input::placeholder { color: #4b5563; }
        .form-input:focus {
          border-color: rgba(16,185,129,0.4);
          background: rgba(16,185,129,0.04);
        }
 
        .error-box {
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.2);
          border-radius: 12px;
          padding: 12px 16px;
          color: #f87171;
          font-size: 13px;
          margin-bottom: 16px;
        }
 
        .success-box {
          background: rgba(16,185,129,0.08);
          border: 1px solid rgba(16,185,129,0.2);
          border-radius: 12px;
          padding: 12px 16px;
          margin-bottom: 16px;
        }
        .success-box p { color: #34d399; font-size: 13px; font-weight: 500; }
        .success-box span { color: #6b7280; font-size: 12px; }
 
        .btn-submit {
          width: 100%;
          background: linear-gradient(135deg, #10b981, #059669);
          border: none;
          border-radius: 12px;
          padding: 14px;
          color: white;
          font-size: 14px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.1s, box-shadow 0.2s;
          box-shadow: 0 4px 20px rgba(16,185,129,0.25);
          letter-spacing: 0.01em;
        }
        .btn-submit:hover:not(:disabled) {
          opacity: 0.92;
          transform: translateY(-1px);
          box-shadow: 0 6px 28px rgba(16,185,129,0.35);
        }
        .btn-submit:active:not(:disabled) { transform: translateY(0); }
        .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }
 
        .card-footer {
          text-align: center;
          margin-top: 20px;
          color: #4b5563;
          font-size: 13px;
        }
        .card-footer a {
          color: #10b981;
          text-decoration: none;
          font-weight: 500;
        }
        .card-footer a:hover { color: #34d399; }
 
        .divider {
          height: 1px;
          background: rgba(255,255,255,0.05);
          margin: 20px 0;
        }
 
        /* Responsive */
        @media (max-width: 900px) {
          .registro-left { display: none; }
          .registro-right { width: 100%; padding: 24px; }
        }
      `}</style>
 
      <div className="registro-root">
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
        <div className="bg-grid" />
 
        {/* Lado izquierdo — branding */}
        <div className="registro-left">
          <div className="brand-logo">
            <div className="brand-icon">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div>
              <div className="brand-name">Portal Ojeadores</div>
              <div className="brand-sub">Scouting privado</div>
            </div>
          </div>
 
          <h1 className="left-headline">
            Tu scouting,<br />
            <span>completamente privado</span>
          </h1>
          <p className="left-desc">
            Registra jugadores, analiza partidos y guarda tus informes. Solo tú tienes acceso a tus datos.
          </p>
 
          <div className="features-list">
            {[
              'Jugadores y seguimientos privados',
              'Informes y diario de scouting',
              'Calendario de partidos y eventos',
              'Acceso desde cualquier dispositivo',
            ].map(f => (
              <div className="feature-item" key={f}>
                <div className="feature-dot" />
                {f}
              </div>
            ))}
          </div>
        </div>
 
        {/* Lado derecho — formulario */}
        <div className="registro-right">
          <div className="card">
            <div className="card-title">Crear cuenta</div>
            <div className="card-subtitle">Elige tus credenciales para acceder siempre</div>
 
            <div className="form-group">
              <div className="input-wrapper">
                <svg className="input-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <input
                  className="form-input"
                  type="text"
                  placeholder="Tu nombre"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  required
                />
              </div>
 
              <div className="input-wrapper">
                <svg className="input-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <input
                  className="form-input"
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
 
              <div className="input-wrapper">
                <svg className="input-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <input
                  className="form-input"
                  type="password"
                  placeholder="Contraseña (mín. 6 caracteres)"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            </div>
 
            {error && <div className="error-box">{error}</div>}
 
            {exito && (
              <div className="success-box">
                <p>✅ {exito}</p>
                <span>Redirigiendo al dashboard...</span>
              </div>
            )}
 
            <button
              className="btn-submit"
              onClick={handleRegistro}
              disabled={loading}
            >
              {loading ? 'Creando cuenta...' : 'Crear cuenta de ojeador'}
            </button>
 
            <div className="divider" />
 
            <div className="card-footer">
              ¿Ya tienes cuenta?{' '}
              <a href="/login">Iniciar sesión</a>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}