import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Usuarios() {
  const nav = useNavigate()
  const { perfil } = useAuth()
  const [usuarios, setUsuarios] = useState([])
  const [form, setForm] = useState({ nombre:'', email:'', password:'', rol:'tecnico' })
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (perfil?.rol !== 'admin') nav('/')
    cargar()
  }, [perfil])

  async function cargar() {
    const { data } = await supabase.from('usuarios').select('*').order('created_at')
    setUsuarios(data || [])
  }

  async function crearUsuario(e) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.admin.createUser({
      email: form.email, password: form.password,
      user_metadata: { nombre: form.nombre, rol: form.rol },
      email_confirm: true
    })
    if (error) {
      const { error: e2 } = await supabase.auth.signUp({
        email: form.email, password: form.password,
        options: { data: { nombre: form.nombre, rol: form.rol } }
      })
      if (e2) { setMsg('Error: ' + e2.message); setLoading(false); return }
    }
    setMsg('Usuario creado. El técnico puede entrar con esas credenciales.')
    setForm({ nombre:'', email:'', password:'', rol:'tecnico' })
    setTimeout(() => cargar(), 1000)
    setLoading(false)
  }

  async function toggleActivo(u) {
    await supabase.from('usuarios').update({ activo: !u.activo }).eq('id', u.id)
    cargar()
  }

  async function eliminarUsuario(u) {
    if (!confirm(`¿Eliminar a ${u.nombre}? Esta acción no se puede deshacer.`)) return
    await supabase.from('usuarios').delete().eq('id', u.id)
    cargar()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <button onClick={()=>nav('/')} className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-sm font-semibold text-gray-900">Gestión de usuarios</h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Agregar técnico</h2>
          <form onSubmit={crearUsuario} className="space-y-3">
            <input required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nombre completo" value={form.nombre} onChange={e=>setForm(p=>({...p,nombre:e.target.value}))} />
            <input required type="email" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Correo electrónico" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} />
            <input required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Contraseña temporal" value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))} />
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={form.rol} onChange={e=>setForm(p=>({...p,rol:e.target.value}))}>
              <option value="tecnico">Técnico</option>
              <option value="admin">Administrador</option>
            </select>
            {msg && <p className="text-xs text-green-600 bg-green-50 rounded-lg px-3 py-2">{msg}</p>}
            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Creando...' : 'Crear usuario'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {usuarios.map(u => (
            <div key={u.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{u.nombre}</p>
                <p className="text-xs text-gray-500">{u.email} · {u.rol}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={()=>toggleActivo(u)}
                  className={`text-xs px-3 py-1 rounded-full font-medium ${u.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {u.activo ? 'Activo' : 'Inactivo'}
                </button>
                <button onClick={()=>eliminarUsuario(u)}
                  className="text-xs px-3 py-1 rounded-full font-medium bg-red-100 text-red-600 hover:bg-red-200">
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
