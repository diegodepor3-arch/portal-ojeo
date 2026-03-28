'use client'
 
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { Syne, DM_Sans } from 'next/font/google'
 
const syne = Syne({ subsets: ['latin'], weight: ['700', '800'] })
const dmSans = DM_Sans({ subsets: ['latin'], weight: ['300', '400', '500'] })
 
export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
 
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Credenciales incorrectas')
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }
 
  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
 
        .login-root {
          min-height: 100vh;
          background: #080c14;
          display: flex;
          position: relative;
          overflow: hidden;
        }
        .bg-orb {
          position: fixed; border-radius: 50%; filter: blur(80px);
          pointer-events: none; z-index: 0;
        }
        .bg-orb-1 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%);
          top: -100px; left: -100px;
          animation: floatOrb1 12s ease-in-out infinite;
        }
        .bg-orb-2 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(37,99,235,0.08) 0%, transparent 70%);
          bottom: -80px; right: -80px;
          animation: floatOrb2 15s ease-in-out infinite;
        }
        @keyframes floatOrb1 {
          0%, 100% { transform: translate(0,0); } 50% { transform: translate(40px,30px); }
        }
        @keyframes floatOrb2 {
          0%, 100% { transform: translate(0,0); } 50% { transform: translate(-30px,-20px); }
        }
        .bg-grid {
          position: fixed; inset: 0;
          background-image: linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 48px 48px; z-index: 0;
        }
        .login-left {
          flex: 1; display: flex; flex-direction: column; justify-content: center;
          padding: 60px; position: relative; z-index: 1;
        }
        .login-right {
          width: 480px; display: flex; align-items: center; justify-content: center;
          padding: 40px; position: relative; z-index: 1;
        }
        .brand-logo { display: flex; align-items: center; gap: 12px; margin-bottom: 80px; }
        .brand-icon {
          width: 40px; height: 40px;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          border-radius: 12px; display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 24px rgba(59,130,246,0.3);
        }
        .brand-name { font-size: 15px; font-weight: 700; color: white; letter-spacing: 0.02em; }
        .brand-sub { font-size: 12px; color: #4b5563; }
        .left-headline {
          font-size: clamp(36px, 4vw, 56px); font-weight: 800; color: white;
          line-height: 1.1; letter-spacing: -0.02em; margin-bottom: 20px;
        }
        .left-headline span {
          background: linear-gradient(135deg, #3b82f6, #60a5fa);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .left-desc { color: #6b7280; font-size: 16px; line-height: 1.6; max-width: 420px; margin-bottom: 48px; }
        .features-list { display: flex; flex-direction: column; gap: 14px; }
        .feature-item { display: flex; align-items: center; gap: 12px; color: #9ca3af; font-size: 14px; }
        .feature-dot {
          width: 6px; height: 6px; border-radius: 50%; background: #3b82f6;
          flex-shrink: 0; box-shadow: 0 0 8px rgba(59,130,246,0.5);
        }
        .card {
          background: rgba(17,24,39,0.8); border: 1px solid rgba(255,255,255,0.06);
          border-radius: 24px; padding: 40px; width: 100%;
          backdrop-filter: blur(20px); box-shadow: 0 25px 60px rgba(0,0,0,0.4);
          animation: slideUp 0.5s ease forwards;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); }
        }
        .card-title { font-size: 24px; font-weight: 700; color: white; margin-bottom: 6px; }
        .card-subtitle { color: #6b7280; font-size: 13px; margin-bottom: 32px; }
        .form-group { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
        .input-wrapper { position: relative; }
        .input-icon {
          position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
          color: #4b5563; width: 16px; height: 16px;
        }
        .form-input {
          width: 100%; background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08); border-radius: 12px;
          padding: 13px 14px 13px 40px; color: white; font-size: 14px; outline: none;
          transition: border-color 0.2s, background 0.2s;
        }
        .form-input::placeholder { color: #4b5563; }
        .form-input:focus { border-color: rgba(59,130,246,0.5); background: rgba(59,130,246,0.04); }
        .error-box {
          background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2);
          border-radius: 12px; padding: 12px 16px; color: #f87171; font-size: 13px; margin-bottom: 16px;
        }
        .btn-submit {
          width: 100%; background: linear-gradient(135deg, #3b82f6, #2563eb);
          border: none; border-radius: 12px; padding: 14px; color: white;
          font-size: 14px; font-weight: 600; cursor: pointer;
          transition: opacity 0.2s, transform 0.1s, box-shadow 0.2s;
          box-shadow: 0 4px 20px rgba(59,130,246,0.35);
        }
        .btn-submit:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); box-shadow: 0 6px 28px rgba(59,130,246,0.5); }
        .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }
        .divider { height: 1px; background: rgba(255,255,255,0.05); margin: 20px 0; }
        .card-footer { text-align: center; color: #4b5563; font-size: 13px; }
        .card-footer a { color: #3b82f6; text-decoration: none; font-weight: 500; }
        .card-footer a:hover { color: #60a5fa; }
        @media (max-width: 900px) {
          .login-left { display: none; }
          .login-right { width: 100%; padding: 24px; }
        }
      `}</style>
 
      <div className={`login-root ${dmSans.className}`}>
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
        <div className="bg-grid" />
 
        <div className="login-left">
          <div className="brand-logo">
            <div className="brand-icon">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div>
              <div className={`brand-name ${syne.className}`}>Portal Ojeadores</div>
              <div className="brand-sub">Scouting privado</div>
            </div>
          </div>
 
          <h1 className={`left-headline ${syne.className}`}>
            Bienvenido<br /><span>de vuelta</span>
          </h1>
          <p className="left-desc">
            Accede a tu espacio privado de scouting. Todos tus jugadores, informes y anotaciones te están esperando.
          </p>
 
          <div className="features-list">
            {['Tus jugadores, solo visibles para ti', 'Informes y diario sincronizados', 'Calendario de partidos y eventos', 'Acceso seguro desde cualquier lugar'].map(f => (
              <div className="feature-item" key={f}>
                <div className="feature-dot" />{f}
              </div>
            ))}
          </div>
        </div>
 
        <div className="login-right">
          <div className="card">
            <div className={`card-title ${syne.className}`}>Iniciar sesión</div>
            <div className="card-subtitle">Introduce tus credenciales para acceder</div>
 
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <div className="input-wrapper">
                  <svg className="input-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <input className="form-input" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div className="input-wrapper">
                  <svg className="input-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <input className="form-input" type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
              </div>
 
              {error && <div className="error-box">{error}</div>}
 
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? 'Entrando...' : 'Entrar al portal'}
              </button>
            </form>
 
            <div className="divider" />
            <div className="card-footer">
              ¿No tienes cuenta?{' '}<a href="/registro">Crear cuenta</a>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}