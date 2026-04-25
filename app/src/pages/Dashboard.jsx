import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

const ESTADO_CONFIG = {
  borrador:    { label: 'Borrador',    bg: 'rgba(255,255,255,0.08)', color: '#9ca3af', border: 'rgba(156,163,175,0.3)', dot: '#6b7280' },
  en_revision: { label: 'En revisión', bg: 'rgba(251,191,36,0.15)',  color: '#f59e0b', border: 'rgba(245,158,11,0.4)',  dot: '#f59e0b' },
  aprobado:    { label: 'Aprobado',    bg: 'rgba(34,197,94,0.15)',   color: '#22c55e', border: 'rgba(34,197,94,0.4)',   dot: '#22c55e' },
  rechazado:   { label: 'Rechazado',   bg: 'rgba(239,68,68,0.15)',   color: '#ef4444', border: 'rgba(239,68,68,0.4)',   dot: '#ef4444' },
}

const LOGO_URL = 'https://wlxijxrbhuecnopybdwc.supabase.co/storage/v1/object/public/templates/logo-fuerza-electrica.jpg'

export default function Dashboard() {
  const { perfil, logout, user } = useAuth()
  const nav = useNavigate()
  const [reportes, setReportes] = useState([])
  const [tecnicos, setTecnicos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [filtroTecnico, setFiltroTecnico] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const [notificaciones, setNotificaciones] = useState([])

  useEffect(() => { if (user) { cargarReportes(); cargarNotificaciones() } }, [user, perfil])

  async function cargarReportes() {
    const { data } = await supabase
      .from('reportes')
      .select('*, usuarios(id, nombre, email)')
      .order('created_at', { ascending: false })
    setReportes(data || [])
    if (perfil?.rol === 'admin') {
      const unicos = []
      const ids = new Set()
      ;(data || []).forEach(r => {
        if (r.usuarios && !ids.has(r.usuarios.id)) {
          ids.add(r.usuarios.id)
          unicos.push(r.usuarios)
        }
      })
      setTecnicos(unicos)
    }
    setLoading(false)
  }

  async function cargarNotificaciones() {
    if (!user) return
    const { data } = await supabase
      .from('historial')
      .select('*, reportes(codigo_rs, planta, estado)')
      .eq('accion', 'Estado cambiado a aprobado')
      .order('created_at', { ascending: false })
      .limit(5)
    const { data: rechazados } = await supabase
      .from('historial')
      .select('*, reportes(codigo_rs, planta, estado, tecnico_id)')
      .eq('accion', 'Estado cambiado a rechazado')
      .order('created_at', { ascending: false })
      .limit(5)
    const notifs = []
    ;(data || []).forEach(h => {
      if (h.reportes?.estado === 'aprobado')
        notifs.push({ tipo: 'aprobado', texto: `RS-${h.reportes.codigo_rs} — ${h.reportes.planta} fue aprobado ✓`, color: 'green' })
    })
    ;(rechazados || []).forEach(h => {
      if (h.reportes?.estado === 'rechazado' && h.reportes?.tecnico_id === user.id)
        notifs.push({ tipo: 'rechazado', texto: `RS-${h.reportes.codigo_rs} — ${h.reportes.planta} fue rechazado`, color: 'red' })
    })
    setNotificaciones(notifs.slice(0, 3))
  }

  async function eliminarReporte(e, id) {
    e.stopPropagation()
    if (!confirm('¿Eliminar este reporte? Esta acción no se puede deshacer.')) return
    await supabase.from('fotos').delete().eq('reporte_id', id)
    await supabase.from('historial').delete().eq('reporte_id', id)
    await supabase.from('reportes').delete().eq('id', id)
    cargarReportes()
  }

  const reportesFiltrados = reportes.filter(r => {
    const matchEstado = filtroEstado === 'todos' || r.estado === filtroEstado
    const matchTecnico = filtroTecnico === 'todos' || r.usuarios?.id === filtroTecnico
    const matchBusqueda = busqueda === '' ||
      (r.planta || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      (r.sitio || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      (r.codigo_rs || '').toLowerCase().includes(busqueda.toLowerCase())
    return matchEstado && matchTecnico && matchBusqueda
  })

  const statsConfig = [
    { key: 'todos',       label: 'Total',       icon: '📋' },
    { key: 'borrador',    label: 'Borrador',    icon: '📝' },
    { key: 'en_revision', label: 'En revisión', icon: '⏳' },
    { key: 'aprobado',    label: 'Aprobado',    icon: '✅' },
  ]

  const inputStyle = {
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(146,102,26,0.4)',
    borderRadius: '10px',
    padding: '10px 14px',
    fontSize: '13px',
    color: '#e2e8f0',
    outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#111008', color: '#e2e8f0' }}>

      {/* Header */}
      <div style={{
        background: 'rgba(25,18,5,0.98)',
        borderBottom: '1px solid rgba(180,83,9,0.3)',
        padding: '0 1.5rem',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 50,
        backdropFilter: 'blur(12px)',
        boxShadow: '0 2px 20px rgba(0,0,0,0.5)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src={LOGO_URL} alt="logo" style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '8px' }} />
          <div>
            <p style={{ fontSize: '14px', fontWeight: '700', color: '#f59e0b', margin: 0 }}>Fuerza Eléctrica</p>
            <p style={{ fontSize: '11px', color: '#92661a', margin: 0 }}>{perfil?.nombre} · {perfil?.rol === 'admin' ? 'Administrador' : 'Técnico'}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {perfil?.rol === 'admin' && (
            <button onClick={() => nav('/usuarios')} style={{
              background: 'rgba(180,83,9,0.12)', border: '1px solid rgba(180,83,9,0.3)',
              color: '#d97706', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', cursor: 'pointer',
              fontWeight: '600',
            }}>Usuarios</button>
          )}
          <button onClick={logout} style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            color: '#9ca3af', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', cursor: 'pointer',
          }}>Salir</button>
        </div>
      </div>

      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '1.5rem 1rem' }}>

        {/* Notificaciones */}
        {notificaciones.length > 0 && (
          <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {notificaciones.map((n, i) => (
              <div key={i} style={{
                padding: '10px 16px', borderRadius: '10px', fontSize: '13px',
                background: n.color === 'green' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                border: `1px solid ${n.color === 'green' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                color: n.color === 'green' ? '#4ade80' : '#f87171',
              }}>{n.texto}</div>
            ))}
          </div>
        )}

        {/* Stats admin */}
        {perfil?.rol === 'admin' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '1.5rem' }}>
            {statsConfig.map(s => (
              <div key={s.key} style={{
                background: 'rgba(180,83,9,0.08)',
                border: '1px solid rgba(180,83,9,0.3)',
                borderRadius: '14px', padding: '1rem',
                textAlign: 'center',
                boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
              }}>
                <div style={{ fontSize: '22px', marginBottom: '4px' }}>{s.icon}</div>
                <p style={{ fontSize: '26px', fontWeight: '700', color: '#f59e0b', margin: 0 }}>
                  {s.key === 'todos' ? reportes.length : reportes.filter(r => r.estado === s.key).length}
                </p>
                <p style={{ fontSize: '11px', color: '#92661a', margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filtros */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '1.25rem' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#b45309" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </div>
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar por planta, sitio o RS..."
              style={{ ...inputStyle, width: '100%', paddingLeft: '36px' }}
              onFocus={e => { e.target.style.borderColor = 'rgba(180,83,9,0.7)'; e.target.style.boxShadow = '0 0 0 3px rgba(180,83,9,0.1)' }}
              onBlur={e => { e.target.style.borderColor = 'rgba(146,102,26,0.4)'; e.target.style.boxShadow = 'none' }}
            />
          </div>
          <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
            style={{ ...inputStyle, minWidth: '160px', cursor: 'pointer' }}>
            <option value="todos" style={{ background: '#1a0f02' }}>Todos los estados</option>
            <option value="borrador" style={{ background: '#1a0f02' }}>Borrador</option>
            <option value="en_revision" style={{ background: '#1a0f02' }}>En revisión</option>
            <option value="aprobado" style={{ background: '#1a0f02' }}>Aprobado</option>
            <option value="rechazado" style={{ background: '#1a0f02' }}>Rechazado</option>
          </select>
          {perfil?.rol === 'admin' && tecnicos.length > 0 && (
            <select value={filtroTecnico} onChange={e => setFiltroTecnico(e.target.value)}
              style={{ ...inputStyle, minWidth: '160px', cursor: 'pointer' }}>
              <option value="todos" style={{ background: '#1a0f02' }}>Todos los técnicos</option>
              {tecnicos.map(t => <option key={t.id} value={t.id} style={{ background: '#1a0f02' }}>{t.nombre || t.email}</option>)}
            </select>
          )}
          <button onClick={() => nav('/reporte/nuevo')} style={{
            background: 'linear-gradient(135deg,#f59e0b,#b45309)',
            color: '#0a0a0a', fontWeight: '700', fontSize: '13px',
            border: 'none', borderRadius: '10px', padding: '10px 18px',
            cursor: 'pointer', whiteSpace: 'nowrap',
            boxShadow: '0 4px 15px rgba(180,83,9,0.35)',
          }}>+ Nuevo reporte</button>
        </div>

        {/* Lista de reportes */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#92661a', fontSize: '13px' }}>Cargando reportes...</div>
        ) : reportesFiltrados.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#92661a', fontSize: '13px' }}>
            {reportes.length === 0 ? '¡Crea tu primer reporte!' : 'Sin resultados.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {reportesFiltrados.map(r => {
              const cfg = ESTADO_CONFIG[r.estado] || ESTADO_CONFIG.borrador
              return (
                <div key={r.id} onClick={() => nav(`/reporte/${r.id}`)}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(180,83,9,0.2)',
                    borderRadius: '14px', padding: '14px 16px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    cursor: 'pointer', transition: 'all 0.15s',
                    boxShadow: '0 1px 8px rgba(0,0,0,0.3)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.border = '1px solid rgba(180,83,9,0.5)'
                    e.currentTarget.style.background = 'rgba(180,83,9,0.07)'
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.4)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.border = '1px solid rgba(180,83,9,0.2)'
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                    e.currentTarget.style.boxShadow = '0 1px 8px rgba(0,0,0,0.3)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '10px',
                      background: 'rgba(180,83,9,0.2)', border: '1px solid rgba(180,83,9,0.35)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '12px', fontWeight: '700', color: '#f59e0b',
                      flexShrink: 0,
                    }}>
                      {r.codigo_rs || '—'}
                    </div>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: '600', color: '#f0e6d3', margin: '0 0 2px' }}>{r.planta || 'Sin nombre'}</p>
                      <p style={{ fontSize: '12px', color: '#92661a', margin: '0 0 2px' }}>{r.sitio} · {r.fecha_servicio || '—'}</p>
                      <p style={{ fontSize: '11px', color: '#6b4f2a', margin: 0 }}>
                        {r.usuarios?.nombre || r.usuarios?.email || '—'}
                        {r.tecnico_id === user?.id && ' (tú)'}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      fontSize: '11px', fontWeight: '600', padding: '4px 10px', borderRadius: '20px',
                      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
                      display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap',
                    }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: cfg.dot, display: 'inline-block' }}/>
                      {cfg.label}
                    </span>
                    {perfil?.rol === 'admin' && (
                      <button onClick={e => eliminarReporte(e, r.id)} style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: '14px', padding: '4px', borderRadius: '6px', color: '#6b7280',
                      }}>🗑</button>
                    )}
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#92661a" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                    </svg>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <style>{`
        input::placeholder { color: #6b4f2a; }
        select option { background: #1a0f02; color: #e2e8f0; }
      `}</style>
    </div>
  )
}
