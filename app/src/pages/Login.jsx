import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

const LOGO_URL = 'https://wlxijxrbhuecnopybdwc.supabase.co/storage/v1/object/public/templates/logo-fuerza-electrica.png'

export default function Login() {
  const { login, user } = useAuth()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { if (user) nav('/', { replace: true }) }, [user])

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await login(email, password)
    if (error) setError('Correo o contraseña incorrectos')
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      position: 'relative',
      overflow: 'hidden',
      background: '#0e0e0e',
    }}>

      <svg style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none'}}
        viewBox="0 0 800 700" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="glowCenter" cx="50%" cy="45%" r="40%">
            <stop offset="0%" stopColor="#b45309" stopOpacity="0.35"/>
            <stop offset="100%" stopColor="#0e0e0e" stopOpacity="0"/>
          </radialGradient>
        </defs>
        <rect width="800" height="700" fill="#0e0e0e"/>
        <rect width="800" height="700" fill="url(#glowCenter)"/>
        <line x1="0" y1="80" x2="180" y2="80" stroke="#92661a" strokeWidth="1.2"/>
        <line x1="180" y1="80" x2="200" y2="100" stroke="#92661a" strokeWidth="1.2"/>
        <line x1="200" y1="100" x2="280" y2="100" stroke="#92661a" strokeWidth="1.2"/>
        <circle cx="280" cy="100" r="4" fill="none" stroke="#92661a" strokeWidth="1.5"/>
        <line x1="280" y1="100" x2="280" y2="60" stroke="#92661a" strokeWidth="1.2"/>
        <circle cx="280" cy="60" r="3" fill="#b45309"/>
        <line x1="0" y1="200" x2="120" y2="200" stroke="#78501a" strokeWidth="1"/>
        <line x1="120" y1="200" x2="145" y2="175" stroke="#78501a" strokeWidth="1"/>
        <line x1="145" y1="175" x2="230" y2="175" stroke="#78501a" strokeWidth="1"/>
        <circle cx="230" cy="175" r="3" fill="#78501a"/>
        <line x1="230" y1="175" x2="230" y2="140" stroke="#78501a" strokeWidth="1"/>
        <circle cx="230" cy="140" r="2" fill="#92661a"/>
        <line x1="0" y1="580" x2="150" y2="580" stroke="#92661a" strokeWidth="1.2"/>
        <line x1="150" y1="580" x2="175" y2="555" stroke="#92661a" strokeWidth="1.2"/>
        <line x1="175" y1="555" x2="290" y2="555" stroke="#92661a" strokeWidth="1.2"/>
        <circle cx="290" cy="555" r="4" fill="none" stroke="#92661a" strokeWidth="1.5"/>
        <line x1="290" y1="555" x2="290" y2="620" stroke="#92661a" strokeWidth="1.2"/>
        <line x1="0" y1="440" x2="100" y2="440" stroke="#78501a" strokeWidth="1"/>
        <line x1="100" y1="440" x2="120" y2="460" stroke="#78501a" strokeWidth="1"/>
        <line x1="120" y1="460" x2="200" y2="460" stroke="#78501a" strokeWidth="1"/>
        <circle cx="200" cy="460" r="2.5" fill="#92661a"/>
        <line x1="800" y1="80" x2="620" y2="80" stroke="#92661a" strokeWidth="1.2"/>
        <line x1="620" y1="80" x2="600" y2="100" stroke="#92661a" strokeWidth="1.2"/>
        <line x1="600" y1="100" x2="520" y2="100" stroke="#92661a" strokeWidth="1.2"/>
        <circle cx="520" cy="100" r="4" fill="none" stroke="#92661a" strokeWidth="1.5"/>
        <line x1="520" y1="100" x2="520" y2="60" stroke="#92661a" strokeWidth="1.2"/>
        <circle cx="520" cy="60" r="3" fill="#b45309"/>
        <line x1="800" y1="200" x2="680" y2="200" stroke="#78501a" strokeWidth="1"/>
        <line x1="680" y1="200" x2="655" y2="225" stroke="#78501a" strokeWidth="1"/>
        <line x1="655" y1="225" x2="570" y2="225" stroke="#78501a" strokeWidth="1"/>
        <circle cx="570" cy="225" r="3" fill="#78501a"/>
        <line x1="570" y1="225" x2="570" y2="260" stroke="#78501a" strokeWidth="1"/>
        <circle cx="570" cy="260" r="2" fill="#92661a"/>
        <line x1="800" y1="580" x2="650" y2="580" stroke="#92661a" strokeWidth="1.2"/>
        <line x1="650" y1="580" x2="625" y2="555" stroke="#92661a" strokeWidth="1.2"/>
        <line x1="625" y1="555" x2="510" y2="555" stroke="#92661a" strokeWidth="1.2"/>
        <circle cx="510" cy="555" r="4" fill="none" stroke="#92661a" strokeWidth="1.5"/>
        <line x1="510" y1="555" x2="510" y2="620" stroke="#92661a" strokeWidth="1.2"/>
        <line x1="800" y1="440" x2="700" y2="440" stroke="#78501a" strokeWidth="1"/>
        <line x1="700" y1="440" x2="680" y2="420" stroke="#78501a" strokeWidth="1"/>
        <line x1="680" y1="420" x2="600" y2="420" stroke="#78501a" strokeWidth="1"/>
        <circle cx="600" cy="420" r="2.5" fill="#92661a"/>
        <line x1="340" y1="0" x2="340" y2="80" stroke="#78501a" strokeWidth="1"/>
        <circle cx="340" cy="80" r="3" fill="#92661a"/>
        <line x1="460" y1="0" x2="460" y2="70" stroke="#78501a" strokeWidth="1"/>
        <circle cx="460" cy="70" r="3" fill="#92661a"/>
        <line x1="340" y1="700" x2="340" y2="620" stroke="#78501a" strokeWidth="1"/>
        <circle cx="340" cy="620" r="3" fill="#92661a"/>
        <line x1="460" y1="700" x2="460" y2="630" stroke="#78501a" strokeWidth="1"/>
        <circle cx="460" cy="630" r="3" fill="#92661a"/>
        <circle cx="60" cy="340" r="5" fill="none" stroke="#78501a" strokeWidth="1.5"/>
        <circle cx="60" cy="340" r="2" fill="#92661a"/>
        <circle cx="740" cy="340" r="5" fill="none" stroke="#78501a" strokeWidth="1.5"/>
        <circle cx="740" cy="340" r="2" fill="#92661a"/>
        <circle cx="150" cy="60" r="3" fill="none" stroke="#78501a" strokeWidth="1"/>
        <circle cx="650" cy="60" r="3" fill="none" stroke="#78501a" strokeWidth="1"/>
        <circle cx="150" cy="640" r="3" fill="none" stroke="#78501a" strokeWidth="1"/>
        <circle cx="650" cy="640" r="3" fill="none" stroke="#78501a" strokeWidth="1"/>
      </svg>

      <div style={{
        position:'absolute', top:'5%', left:'50%', transform:'translateX(-50%)',
        width:'300px', height:'300px', borderRadius:'50%',
        background:'radial-gradient(circle, rgba(180,83,9,0.3) 0%, transparent 65%)',
        pointerEvents:'none', filter:'blur(20px)'
      }}/>

      {/* Logo */}
      <div style={{position:'relative', zIndex:10, textAlign:'center', marginBottom:'1.25rem'}}>
        <img
          src={LOGO_URL}
          alt="Fuerza Eléctrica"
          style={{
            width:'180px',
            height:'180px',
            objectFit:'contain',
            filter:'drop-shadow(0 0 28px rgba(180,83,9,0.55))',
          }}
        />
      </div>

      {/* Card formulario */}
      <div style={{position:'relative', zIndex:10, width:'100%', maxWidth:'360px'}}>
        <div style={{
          background:'rgba(30,25,20,0.78)',
          backdropFilter:'blur(16px)',
          border:'1px solid rgba(146,102,26,0.3)',
          borderRadius:'18px',
          padding:'1.75rem',
          boxShadow:'0 8px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.03)'
        }}>
          <form onSubmit={handleLogin} style={{display:'flex', flexDirection:'column', gap:'1rem'}}>

            <div>
              <label style={{display:'block', fontSize:'11px', color:'#92661a', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:'600', marginBottom:'6px'}}>Correo</label>
              <div style={{position:'relative'}}>
                <div style={{position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)'}}>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#b45309" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                </div>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                  style={{
                    width:'100%', boxSizing:'border-box',
                    paddingLeft:'36px', paddingRight:'12px', paddingTop:'12px', paddingBottom:'12px',
                    fontSize:'14px', color:'#e2e8f0',
                    background:'rgba(255,255,255,0.06)',
                    border:'1px solid rgba(146,102,26,0.25)',
                    borderRadius:'10px', outline:'none',
                  }}
                  onFocus={e=>{e.target.style.borderColor='rgba(180,83,9,0.7)'; e.target.style.boxShadow='0 0 0 3px rgba(180,83,9,0.12)'}}
                  onBlur={e=>{e.target.style.borderColor='rgba(146,102,26,0.25)'; e.target.style.boxShadow='none'}}
                  placeholder="tecnico@ejemplo.com" required />
              </div>
            </div>

            <div>
              <label style={{display:'block', fontSize:'11px', color:'#92661a', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:'600', marginBottom:'6px'}}>Contraseña</label>
              <div style={{position:'relative'}}>
                <div style={{position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)'}}>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#b45309" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                  </svg>
                </div>
                <input type={showPwd ? 'text' : 'password'} value={password} onChange={e=>setPassword(e.target.value)}
                  style={{
                    width:'100%', boxSizing:'border-box',
                    paddingLeft:'36px', paddingRight:'40px', paddingTop:'12px', paddingBottom:'12px',
                    fontSize:'14px', color:'#e2e8f0',
                    background:'rgba(255,255,255,0.06)',
                    border:'1px solid rgba(146,102,26,0.25)',
                    borderRadius:'10px', outline:'none',
                  }}
                  onFocus={e=>{e.target.style.borderColor='rgba(180,83,9,0.7)'; e.target.style.boxShadow='0 0 0 3px rgba(180,83,9,0.12)'}}
                  onBlur={e=>{e.target.style.borderColor='rgba(146,102,26,0.25)'; e.target.style.boxShadow='none'}}
                  placeholder="••••••••" required />
                <button type="button" onClick={()=>setShowPwd(p=>!p)}
                  style={{position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#6b7280', padding:0}}>
                  {showPwd ? (
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                  ) : (
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div style={{display:'flex', alignItems:'center', gap:'8px', fontSize:'12px', color:'#f87171', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:'10px', padding:'10px 12px'}}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{flexShrink:0}}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{
                width:'100%', padding:'13px',
                background: loading ? 'rgba(180,83,9,0.5)' : 'linear-gradient(135deg,#f59e0b 0%,#b45309 100%)',
                color:'#0a0a0a', fontWeight:'700', fontSize:'13px',
                letterSpacing:'0.1em', textTransform:'uppercase',
                border:'none', borderRadius:'10px',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(180,83,9,0.35)',
                transition:'all 0.2s', marginTop:'4px'
              }}>
              {loading ? (
                <span style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'8px'}}>
                  <svg style={{animation:'spin 1s linear infinite', width:'14px', height:'14px'}} fill="none" viewBox="0 0 24 24">
                    <circle style={{opacity:0.25}} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path style={{opacity:0.75}} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Entrando...
                </span>
              ) : '⚡ Entrar'}
            </button>
          </form>
        </div>

        <p style={{textAlign:'center', fontSize:'11px', color:'#4b3a1a', marginTop:'1.25rem'}}>
          Fuerza Eléctrica © {new Date().getFullYear()}
        </p>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input::placeholder { color: #4b5563; }
      `}</style>
    </div>
  )
}
