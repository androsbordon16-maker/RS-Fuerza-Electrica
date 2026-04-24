import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

const ESTADO_BADGE = {
  borrador: 'bg-gray-100 text-gray-600',
  en_revision: 'bg-yellow-100 text-yellow-700',
  aprobado: 'bg-green-100 text-green-700',
  rechazado: 'bg-red-100 text-red-700',
}
const ESTADO_LABEL = {
  borrador: 'Borrador',
  en_revision: 'En revisión',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
}

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
    // Extraer técnicos únicos para filtro admin
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
    // Buscar reportes propios con cambios recientes de estado
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
      if (h.reportes?.estado === 'aprobado') {
        notifs.push({ tipo: 'aprobado', texto: `RS-${h.reportes.codigo_rs} — ${h.reportes.planta} fue aprobado ✓`, color: 'green' })
      }
    })
    ;(rechazados || []).forEach(h => {
      if (h.reportes?.estado === 'rechazado' && h.reportes?.tecnico_id === user.id) {
        notifs.push({ tipo: 'rechazado', texto: `RS-${h.reportes.codigo_rs} — ${h.reportes.planta} fue rechazado`, color: 'red' })
      }
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

  function formatFecha(f) {
    if (!f) return '—'
    // Already formatted like "LUNES 26/AGOSTO/2025"
    return f
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-900">Fuerza Eléctrica</h1>
            <p className="text-xs text-gray-500">{perfil?.nombre} · {perfil?.rol === 'admin' ? 'Administrador' : 'Técnico'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {perfil?.rol === 'admin' && (
            <button onClick={() => nav('/usuarios')} className="text-xs text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100">Usuarios</button>
          )}
          <button onClick={logout} className="text-xs text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100">Salir</button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">

        {/* Notificaciones */}
        {notificaciones.length > 0 && (
          <div className="mb-4 space-y-2">
            {notificaciones.map((n,i) => (
              <div key={i} className={`text-sm px-4 py-2.5 rounded-xl flex items-center gap-2 ${n.color === 'green' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                <span>{n.texto}</span>
              </div>
            ))}
          </div>
        )}

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input value={busqueda} onChange={e=>setBusqueda(e.target.value)}
            placeholder="Buscar por planta, sitio o RS..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <select value={filtroEstado} onChange={e=>setFiltroEstado(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="todos">Todos los estados</option>
            <option value="borrador">Borrador</option>
            <option value="en_revision">En revisión</option>
            <option value="aprobado">Aprobado</option>
            <option value="rechazado">Rechazado</option>
          </select>
          {perfil?.rol === 'admin' && tecnicos.length > 0 && (
            <select value={filtroTecnico} onChange={e=>setFiltroTecnico(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="todos">Todos los técnicos</option>
              {tecnicos.map(t => <option key={t.id} value={t.id}>{t.nombre || t.email}</option>)}
            </select>
          )}
          <button onClick={() => nav('/reporte/nuevo')}
            className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 transition-colors whitespace-nowrap">
            + Nuevo reporte
          </button>
        </div>

        {/* Stats admin */}
        {perfil?.rol === 'admin' && (
          <div className="grid grid-cols-4 gap-3 mb-6">
            {['todos','borrador','en_revision','aprobado'].map(e => (
              <div key={e} className="bg-white rounded-xl border border-gray-200 px-4 py-3">
                <p className="text-2xl font-bold text-gray-900">
                  {e === 'todos' ? reportes.length : reportes.filter(r => r.estado === e).length}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{e === 'todos' ? 'Total' : ESTADO_LABEL[e]}</p>
              </div>
            ))}
          </div>
        )}

        {/* Lista */}
        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">Cargando reportes...</div>
        ) : reportesFiltrados.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            {reportes.length === 0 ? 'Aún no hay reportes. ¡Crea el primero!' : 'Sin resultados.'}
          </div>
        ) : (
          <div className="space-y-2">
            {reportesFiltrados.map(r => (
              <div key={r.id} onClick={() => nav(`/reporte/${r.id}`)}
                className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center justify-between cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 font-bold text-sm">
                    {r.codigo_rs || '—'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{r.planta || 'Sin nombre'}</p>
                    <p className="text-xs text-gray-500">{r.sitio} · {formatFecha(r.fecha_servicio)}</p>
                    <p className="text-xs text-gray-400">
                      {r.usuarios?.nombre || r.usuarios?.email || '—'}
                      {r.tecnico_id === user?.id && ' (tú)'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${ESTADO_BADGE[r.estado]}`}>
                    {ESTADO_LABEL[r.estado]}
                  </span>
                  {perfil?.rol === 'admin' && (
                    <button onClick={e => eliminarReporte(e, r.id)}
                      className="text-xs px-2 py-1 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                      🗑
                    </button>
                  )}
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
