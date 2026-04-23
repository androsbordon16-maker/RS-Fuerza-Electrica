import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) cargarPerfil(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) cargarPerfil(session.user.id)
      else { setPerfil(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function cargarPerfil(uid) {
    let data = null
    for (let i = 0; i < 3; i++) {
      const { data: d } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', uid)
        .single()
      if (d) { data = d; break }
      await new Promise(r => setTimeout(r, 500))
    }
    if (!data) {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: newProfile } = await supabase
        .from('usuarios')
        .upsert({ id: uid, nombre: user?.email?.split('@')[0] || 'Usuario', email: user?.email, rol: 'tecnico' })
        .select()
        .single()
      data = newProfile
    }
    setPerfil(data)
    setLoading(false)
  }

  async function login(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  async function logout() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, perfil, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
