import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const SECCIONES = ['Encabezado','Planta DC','Dist. y Rect.','Tablero AC','Bancos','Temp. Baterías','Temp. Distribución','Temp. Rectificadores','Temp. Tablero AC']
const MARCAS_BATERIA = ['HUAWEI','VERTIV','ENERSYS','CANBAT','VISION','FIAMM','NETSURE','OTRA']
const CIUDADES = ['CUERNAVACA, MORELOS.','TUXTLA GUTIÉRREZ, CHIAPAS.','OCOZOCOAUTLA, CHIAPAS.','TLAXCALA, TLAXCALA.','JOJUTLA, MORELOS.','TEPOZTLÁN, MORELOS.','APAN, HIDALGO.','TONALÁ, CHIAPAS.','OTRA']
const PLANTAS = ['PLANTA ALPHA "A"','PLANTA ALPHA','PLANTA ASSY 2000','PLANTA CXPS-E3','PLANTA VERTIV 7100','PLANTA NETSURE 701','PLANTA ARGUS ASSY 800','PLANTA VORTEX','OTRA']
const DIAS = ['DOMINGO','LUNES','MARTES','MIÉRCOLES','JUEVES','VIERNES','SÁBADO']
const MESES = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE']

const DATOS_INIT = {
  modelo:'', serie:'', rect_total:'', rect_inst:'', cap_rect:'', carga:'',
  volt_op:'54', volt_ig:'54.5', alarmas_dc:'NO', cal_pos:'', cal_tierra:'', cal_barra:'',
  nota_especial:'', notas_dc:'', notas_dist:'', notas_temp_tablero:'',
  rect_rows:[{al:'',tl:'',el:'',rect_izq:'',amp_izq:'',rect_der:'',amp_der:'',ar:'',tr:'',er:''}],
  tableros_ac:[{calibre:'',cables:'',apr1:'OK',apr2:'OK',apr3:'OK',if1:'',if2:'',if3:'',vf12:'',vf13:'',vf23:''}],
  rack:'', bat_modelo:'', bat_tipo:'LITIO', gab_inst:'', bat_marca:'', bat_año:'',
  cap_banco:'', cant_break:'', cap_break:'', bancos_inst:'', cap_banco_ah:'',
  bat_cables:'', bat_calibre:'', bat_volt:'54', bat_break_val:'', bat_tierra:'', bat_alarma:'UTP', bat_efic:'80',
  notas_bancos:'',
  gabinetes:[{nombre:'GABINETE 1',tierra:''}],
  tb_alarmas:'NINGUNA', tb_notas:'',
  distribuciones:[{nombre:'DISTRIBUCIÓN 1',estado:'ACTIVADA'}],
  td_alarmas:'NINGUNA', td_notas:'',
  shefts_izq:[{nombre:'SHELFT 1',estado:'OK'}],
  shefts_der:[{nombre:'SHELFT 1',estado:'OK'}],
  tr_limpieza:'OK', tr_alarmas:'NINGUNA', tr_notas:'',
}

const inp = "border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
const sel = "border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full bg-white"

function Campo({label, children, className=''}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-xs text-gray-500 font-medium">{label}</label>
      {children}
    </div>
  )
}

function ComboField({label, options, value, onChange, placeholder='', disabled=false}) {
  const isOtra = !options.filter(o=>o!=='OTRA').includes(value) && value !== ''
  const [custom, setCustom] = useState(isOtra)
  return (
    <Campo label={label}>
      {!custom ? (
        <select className={sel} value={value} onChange={e => {
          if (e.target.value === 'OTRA') { setCustom(true); onChange('') }
          else onChange(e.target.value)
        }} disabled={disabled}>
          <option value="">Seleccionar...</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <div className="flex gap-1">
          <input className={inp} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} disabled={disabled} />
          {!disabled && <button onClick={()=>{setCustom(false);onChange('')}} className="text-xs text-gray-400 hover:text-gray-600 px-2 border border-gray-300 rounded-lg">↩</button>}
        </div>
      )}
    </Campo>
  )
}

// Progreso por sección
function ProgresoBarra({ enc, datos, seccionActual, onClickSeccion }) {
  function seccionLlena(i) {
    if (i === 0) return enc.codigo_rs && enc.fecha_servicio && enc.planta && enc.sitio && enc.ciudad
    if (i === 1) return datos.modelo && datos.serie && datos.rect_total && datos.carga
    if (i === 2) return true
    if (i === 3) return datos.tableros_ac[0]?.if1
    if (i === 4) return datos.rack && datos.bancos_inst
    if (i === 5) return datos.gabinetes[0]?.tierra
    if (i === 6) return datos.distribuciones[0]?.estado
    if (i === 7) return datos.shefts_izq[0]?.estado
    if (i === 8) return true
    return false
  }
  const completadas = SECCIONES.filter((_,i) => seccionLlena(i)).length
  const pct = Math.round((completadas / SECCIONES.length) * 100)

  return (
    <div className="bg-white border-b border-gray-100 px-4 py-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500">Progreso del reporte</span>
        <span className="text-xs font-medium text-blue-600">{pct}%</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1.5">
        <div className="bg-blue-600 h-1.5 rounded-full transition-all" style={{width:`${pct}%`}} />
      </div>
      <div className="flex gap-1 mt-2 overflow-x-auto">
        {SECCIONES.map((s,i) => (
          <button key={i} onClick={()=>onClickSeccion(i)}
            className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full border transition-colors ${
              i === seccionActual ? 'bg-blue-600 text-white border-blue-600' :
              seccionLlena(i) ? 'bg-green-100 text-green-700 border-green-200' :
              'bg-gray-50 text-gray-400 border-gray-200'
            }`}>
            {s.length > 8 ? s.slice(0,8)+'.' : s}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function ReporteForm() {
  const { id } = useParams()
  const nav = useNavigate()
  const { perfil, user } = useAuth()
  const esNuevo = id === 'nuevo'
  const [seccion, setSeccion] = useState(0)
  const [enc, setEnc] = useState({ codigo_rs:'', numero_ventana:'', fecha_servicio:'', planta:'', sitio:'', ciudad:'' })
  const [datos, setDatos] = useState(DATOS_INIT)
  const [fotos, setFotos] = useState({})
  const [fotosExistentes, setFotosExistentes] = useState([])
  const [reporteId, setReporteId] = useState(null)
  const [tecnicoIdOriginal, setTecnicoIdOriginal] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [autoguardando, setAutoguardando] = useState(false)
  const [estado, setEstado] = useState('borrador')
  const [msg, setMsg] = useState('')
  const [tecnicoId, setTecnicoId] = useState(null)
  const [showRechazoModal, setShowRechazoModal] = useState(false)
  const [motivoRechazo, setMotivoRechazo] = useState('')
  const [generando, setGenerando] = useState(false)

  useEffect(() => { if (!esNuevo) cargarReporte() }, [id])

  // Autoguardado cada 2 minutos
  useEffect(() => {
    if (esNuevo || !reporteId || !puedeEditar) return
    const interval = setInterval(() => { autoguardar() }, 120000)
    return () => clearInterval(interval)
  }, [reporteId, enc, datos])

  function formatearFecha(val) {
    if (!val) return ''
    const d = new Date(val + 'T12:00:00')
    return `${DIAS[d.getDay()]} ${d.getDate()}/${MESES[d.getMonth()]}/${d.getFullYear()}`
  }

  async function cargarReporte() {
    const { data: r } = await supabase.from('reportes').select('*').eq('id', id).single()
    if (!r) return nav('/')
    setReporteId(r.id)
    setEstado(r.estado)
    setTecnicoId(r.tecnico_id)
    setTecnicoIdOriginal(r.tecnico_id)
    setEnc({ codigo_rs:r.codigo_rs||'', numero_ventana:r.numero_ventana||'', fecha_servicio:r.fecha_servicio||'', planta:r.planta||'', sitio:r.sitio||'', ciudad:r.ciudad||'' })
    if (r.datos) setDatos({ ...DATOS_INIT, ...r.datos })
    const { data: fs } = await supabase.from('fotos').select('*').eq('reporte_id', id).order('orden')
    setFotosExistentes(fs || [])
  }

  const esPropio = esNuevo || tecnicoId === user?.id
  const puedeEditar = esNuevo || perfil?.rol === 'admin' || (esPropio && (estado === 'borrador' || estado === 'rechazado'))

  function updDatos(key, val) { setDatos(p => ({ ...p, [key]: val })) }
  function updArr(key, idx, field, val) {
    setDatos(p => { const arr = [...p[key]]; arr[idx] = { ...arr[idx], [field]: val }; return { ...p, [key]: arr } })
  }
  function addArr(key, item) { setDatos(p => ({ ...p, [key]: [...p[key], item] })) }
  function delArr(key, idx) { setDatos(p => ({ ...p, [key]: p[key].filter((_,i) => i !== idx) })) }

  async function guardar(nuevoEstado, comentario) {
    setGuardando(true)
    const payload = {
      codigo_rs: enc.codigo_rs, numero_ventana: enc.numero_ventana,
      fecha_servicio: enc.fecha_servicio, planta: enc.planta,
      sitio: enc.sitio, ciudad: enc.ciudad,
      datos, estado: nuevoEstado || estado,
      tecnico_id: tecnicoIdOriginal || user.id,
    }
    let rid = reporteId
    if (esNuevo || !rid) {
      payload.tecnico_id = user.id
      const { data } = await supabase.from('reportes').insert(payload).select().single()
      rid = data?.id
      setReporteId(rid)
      setTecnicoIdOriginal(user.id)
    } else {
      await supabase.from('reportes').update({ ...payload, updated_at: new Date() }).eq('id', rid)
    }

    const accion = nuevoEstado ? `Estado cambiado a ${nuevoEstado}` : 'Reporte guardado'
    await supabase.from('historial').insert({
      reporte_id: rid, usuario_id: user.id,
      accion, detalle: { estado: nuevoEstado || estado, comentario: comentario || null }
    })

    // Subir fotos — con log de error para diagnóstico
    for (const [sec, archivos] of Object.entries(fotos)) {
      for (let i = 0; i < archivos.length; i++) {
        const f = archivos[i]
        const ext = f.name.split('.').pop()
        const secLimpio = sec
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/\s/g, '_')
          .replace(/[^a-zA-Z0-9_.-]/g, '')
        const path = `${rid}/${secLimpio}/${Date.now()}_${i}.${ext}`

        // LOG: ver el path exacto y cualquier error
        console.log('📸 Intentando subir:', path)
        const { data: up, error: upErr } = await supabase.storage
          .from('fotos-reportes')
          .upload(path, f, { upsert: true })

        if (upErr) {
          console.error('❌ Error al subir foto:', upErr.message, '| Path:', path)
          continue // salta a la siguiente foto sin romper todo
        }

        console.log('✅ Foto subida:', path)
        if (up) {
          const { data: { publicUrl } } = supabase.storage.from('fotos-reportes').getPublicUrl(path)
          await supabase.from('fotos').insert({
            reporte_id: rid, seccion: sec, url: publicUrl,
            nombre_archivo: f.name, orden: i
          })
        }
      }
    }

    setFotos({})
    const { data: fsActualizadas } = await supabase.from('fotos').select('*').eq('reporte_id', rid).order('orden')
    setFotosExistentes(fsActualizadas || [])
    if (nuevoEstado) setEstado(nuevoEstado)
    setMsg('Guardado ✓')
    setTimeout(() => setMsg(''), 3000)
    setGuardando(false)
    if (esNuevo && rid) nav(`/reporte/${rid}`, { replace: true })
  }

  async function generarExcel() {
    setGenerando(true)
    try {
      const { data: fs } = await supabase.from('fotos').select('*').eq('reporte_id', id)
      const fotosPorSeccion = {}
      ;(fs || []).forEach(f => {
        if (!fotosPorSeccion[f.seccion]) fotosPorSeccion[f.seccion] = []
        fotosPorSeccion[f.seccion].push(f.url)
      })
      const resp = await fetch('https://rs-fuerza-electrica-production.up.railway.app/generar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ encabezado: enc, datos, fotos: fotosPorSeccion })
      })
      if (!resp.ok) throw new Error('Error del servidor')
      const blob = await resp.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `RS-${enc.codigo_rs}_${enc.planta}_${enc.fecha_servicio}.xlsx`.replace(/\s/g,'_')
      a.click()
      URL.revokeObjectURL(url)
    } catch(e) {
      alert('Error al generar Excel: ' + e.message)
    }
    setGenerando(false)
  }

  async function autoguardar() {
    if (!reporteId || !puedeEditar) return
    setAutoguardando(true)
    await supabase.from('reportes').update({
      codigo_rs: enc.codigo_rs, numero_ventana: enc.numero_ventana,
      fecha_servicio: enc.fecha_servicio, planta: enc.planta,
      sitio: enc.sitio, ciudad: enc.ciudad,
      datos, updated_at: new Date()
    }).eq('id', reporteId)
    setAutoguardando(false)
  }

  // ── NUEVO: autoguardado al salir de cualquier campo (blur) ──
  const autoguardarBlur = useCallback(() => {
    if (!reporteId || !puedeEditar) return
    autoguardar()
  }, [reporteId, puedeEditar, enc, datos])

  async function eliminarFotoExistente(fotoId, url) {
    await supabase.from('fotos').delete().eq('id', fotoId)
    const path = url.split('/fotos-reportes/')[1]
    if (path) await supabase.storage.from('fotos-reportes').remove([path])
    setFotosExistentes(p => p.filter(x => x.id !== fotoId))
  }

  function FotoSection({ secNombre, maxFotos=99, titulo="" }) {
    const fileRef = useRef()
    const camaraRef = useRef()
    const existing = fotosExistentes.filter(f => f.seccion === secNombre)
    const nuevas = fotos[secNombre] || []
    const total = existing.length + nuevas.length
    const puedeAgregar = total < maxFotos && puedeEditar

    function agregar(files) {
      const arr = Array.from(files).slice(0, maxFotos - total)
      setFotos(p => ({ ...p, [secNombre]: [...(p[secNombre]||[]), ...arr] }))
    }

    return (
      <div className="mt-4">
        <p className="text-xs font-medium text-gray-500 mb-2">📷 {titulo || secNombre}{maxFotos < 99 ? ` (máx. ${maxFotos})` : ''}</p>
        <div className="flex flex-wrap gap-2">
          {existing.map(f => (
            <div key={f.id} className="relative group">
              <img src={f.url} className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
              {puedeEditar && <button onClick={()=>eliminarFotoExistente(f.id,f.url)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs hidden group-hover:flex items-center justify-center">×</button>}
            </div>
          ))}
          {nuevas.map((f,i) => (
            <div key={i} className="relative group w-20 h-20 rounded-lg border border-dashed border-blue-300 bg-blue-50 flex items-center justify-center text-xs text-blue-500 text-center p-1">
              {f.name.length > 12 ? f.name.slice(0,10)+'...' : f.name}
              <button onClick={()=>setFotos(p=>({...p,[secNombre]:p[secNombre].filter((_,j)=>j!==i)}))}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs hidden group-hover:flex items-center justify-center">×</button>
            </div>
          ))}
          {puedeAgregar && (
            <>
              <button onClick={()=>fileRef.current.click()} className="w-20 h-20 rounded-lg border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors">
                <svg className="w-5 h-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <span className="text-xs">Galería</span>
              </button>
              <button onClick={()=>camaraRef.current.click()} className="w-20 h-20 rounded-lg border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-green-400 hover:text-green-500 transition-colors">
                <svg className="w-5 h-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span className="text-xs">Cámara</span>
              </button>
            </>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e=>agregar(e.target.files)} />
        <input ref={camaraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e=>agregar(e.target.files)} />
      </div>
    )
  }

  const secciones = [
    // ── 0: Encabezado ──
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Campo label="Código RS-">
          <input className={inp} value={enc.codigo_rs}
            onChange={e=>setEnc(p=>({...p,codigo_rs:e.target.value}))}
            onBlur={autoguardarBlur}
            placeholder="174" disabled={!puedeEditar} />
        </Campo>
        <Campo label="Número de ventana">
          <input className={inp} value={enc.numero_ventana}
            onChange={e=>setEnc(p=>({...p,numero_ventana:e.target.value}))}
            onBlur={autoguardarBlur}
            placeholder="595314" disabled={!puedeEditar} />
        </Campo>
      </div>
      <Campo label="Fecha del servicio">
        <input type="date" className={inp} disabled={!puedeEditar}
          onChange={e=>setEnc(p=>({...p,fecha_servicio:formatearFecha(e.target.value)}))}
          onBlur={autoguardarBlur} />
        {enc.fecha_servicio && <p className="text-xs text-blue-600 mt-1 font-medium">→ {enc.fecha_servicio}</p>}
      </Campo>
      <ComboField label="Planta" options={PLANTAS} value={enc.planta} onChange={v=>setEnc(p=>({...p,planta:v}))} placeholder='PLANTA ALPHA "A"' disabled={!puedeEditar} />
      <Campo label="Sitio">
        <input className={inp} value={enc.sitio}
          onChange={e=>setEnc(p=>({...p,sitio:e.target.value}))}
          onBlur={autoguardarBlur}
          placeholder="CTC CUERNAVACA." disabled={!puedeEditar} />
      </Campo>
      <ComboField label="Ciudad" options={CIUDADES} value={enc.ciudad} onChange={v=>setEnc(p=>({...p,ciudad:v}))} placeholder="CUERNAVACA, MORELOS." disabled={!puedeEditar} />
    </div>,

    // ── 1: Planta DC ──
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Campo label="Modelo"><input className={inp} value={datos.modelo} onChange={e=>updDatos('modelo',e.target.value)} onBlur={autoguardarBlur} placeholder="CXPS-W(2000)" disabled={!puedeEditar} /></Campo>
        <Campo label="Número de serie"><input className={inp} value={datos.serie} onChange={e=>updDatos('serie',e.target.value)} onBlur={autoguardarBlur} disabled={!puedeEditar} /></Campo>
        <Campo label="Total rectificadores"><input className={inp} type="number" value={datos.rect_total} onChange={e=>updDatos('rect_total',e.target.value)} onBlur={autoguardarBlur} disabled={!puedeEditar} /></Campo>
        <Campo label="Rectificadores instalados"><input className={inp} type="number" value={datos.rect_inst} onChange={e=>updDatos('rect_inst',e.target.value)} onBlur={autoguardarBlur} disabled={!puedeEditar} /></Campo>
        <Campo label="Capacidad rectificador (W)"><input className={inp} type="number" value={datos.cap_rect} onChange={e=>updDatos('cap_rect',e.target.value)} onBlur={autoguardarBlur} disabled={!puedeEditar} /></Campo>
        <Campo label="Carga actual (A)"><input className={inp} type="number" value={datos.carga} onChange={e=>updDatos('carga',e.target.value)} onBlur={autoguardarBlur} disabled={!puedeEditar} /></Campo>
        <Campo label="Voltaje operación"><input className={inp} type="number" value={datos.volt_op} onChange={e=>updDatos('volt_op',e.target.value)} onBlur={autoguardarBlur} disabled={!puedeEditar} /></Campo>
        <Campo label="Voltaje igualación"><input className={inp} type="number" value={datos.volt_ig} onChange={e=>updDatos('volt_ig',e.target.value)} onBlur={autoguardarBlur} disabled={!puedeEditar} /></Campo>
        <Campo label="Alarmas presentes"><input className={inp} value={datos.alarmas_dc} onChange={e=>updDatos('alarmas_dc',e.target.value)} onBlur={autoguardarBlur} disabled={!puedeEditar} /></Campo>
        <Campo label="Calibre positivo"><input className={inp} value={datos.cal_pos} onChange={e=>updDatos('cal_pos',e.target.value)} onBlur={autoguardarBlur} placeholder="4/0" disabled={!puedeEditar} /></Campo>
        <Campo label="Calibre tierra física"><input className={inp} value={datos.cal_tierra} onChange={e=>updDatos('cal_tierra',e.target.value)} onBlur={autoguardarBlur} disabled={!puedeEditar} /></Campo>
        <Campo label="Calibre barra delta"><input className={inp} value={datos.cal_barra} onChange={e=>updDatos('cal_barra',e.target.value)} onBlur={autoguardarBlur} placeholder="1/0" disabled={!puedeEditar} /></Campo>
      </div>
      <Campo label="Nota especial (A32)"><input className={inp} value={datos.nota_especial} onChange={e=>updDatos('nota_especial',e.target.value)} onBlur={autoguardarBlur} placeholder="SOLO TIENE CABLEADOS PARA X RECTIFICADORES..." disabled={!puedeEditar} /></Campo>
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-gray-500">REAPRIETE — RECUADROS AZULES</p>
          {puedeEditar && <button onClick={()=>addArr('rect_rows',{al:'',tl:'',el:'',rect_izq:'',amp_izq:'',rect_der:'',amp_der:'',ar:'',tr:'',er:''})} className="text-xs text-blue-600 hover:underline">+ Agregar fila</button>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="text-gray-400 text-left">{['Apr L','Tmp L','Etq L','RECT. izq','AMP izq','RECT. der','AMP der','Apr R','Tmp R','Etq R',''].map((h,i)=><th key={i} className="pb-1 pr-1 font-medium whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>
              {datos.rect_rows.map((row,i) => (
                <tr key={i}>
                  <td className="pr-1 pb-1"><input className="border border-gray-300 rounded px-1.5 py-1 text-xs w-16 focus:outline-none" value={row.al} onChange={e=>updArr('rect_rows',i,'al',e.target.value)} onBlur={autoguardarBlur} disabled={!puedeEditar} /></td>
                  <td className="pr-1 pb-1"><input type="number" className="border border-gray-300 rounded px-1.5 py-1 text-xs w-14 focus:outline-none" value={row.tl} onChange={e=>updArr('rect_rows',i,'tl',e.target.value)} onBlur={autoguardarBlur} disabled={!puedeEditar} /></td>
                  <td className="pr-1 pb-1"><input className="border border-gray-300 rounded px-1.5 py-1 text-xs w-12 focus:outline-none" value={row.el} onChange={e=>updArr('rect_rows',i,'el',e.target.value)} onBlur={autoguardarBlur} disabled={!puedeEditar} /></td>
                  <td className="pr-1 pb-1"><div className="flex items-center gap-0.5 rounded px-1.5 py-1" style={{background:'#bae6fd'}}><span className="text-blue-800 font-bold text-xs whitespace-nowrap">RECT.=</span><input className="border-0 bg-transparent text-xs w-10 focus:outline-none text-blue-900 font-medium" value={row.rect_izq||''} onChange={e=>updArr('rect_rows',i,'rect_izq',e.target.value)} onBlur={autoguardarBlur} placeholder="1-2" disabled={!puedeEditar} /></div></td>
                  <td className="pr-1 pb-1"><div className="flex items-center gap-0.5 rounded px-1.5 py-1" style={{background:'#bae6fd'}}><span className="text-blue-800 font-bold text-xs whitespace-nowrap">AMP=</span><input className="border-0 bg-transparent text-xs w-12 focus:outline-none text-blue-900 font-medium" value={row.amp_izq||''} onChange={e=>updArr('rect_rows',i,'amp_izq',e.target.value)} onBlur={autoguardarBlur} placeholder="2X40" disabled={!puedeEditar} /></div></td>
                  <td className="pr-1 pb-1"><div className="flex items-center gap-0.5 rounded px-1.5 py-1" style={{background:'#bae6fd'}}><span className="text-blue-800 font-bold text-xs whitespace-nowrap">RECT.=</span><input className="border-0 bg-transparent text-xs w-10 focus:outline-none text-blue-900 font-medium" value={row.rect_der||''} onChange={e=>updArr('rect_rows',i,'rect_der',e.target.value)} onBlur={autoguardarBlur} placeholder="3-4" disabled={!puedeEditar} /></div></td>
                  <td className="pr-1 pb-1"><div className="flex items-center gap-0.5 rounded px-1.5 py-1" style={{background:'#bae6fd'}}><span className="text-blue-800 font-bold text-xs whitespace-nowrap">AMP=</span><input className="border-0 bg-transparent text-xs w-12 focus:outline-none text-blue-900 font-medium" value={row.amp_der||''} onChange={e=>updArr('rect_rows',i,'amp_der',e.target.value)} onBlur={autoguardarBlur} placeholder="2X40" disabled={!puedeEditar} /></div></td>
                  <td className="pr-1 pb-1"><input className="border border-gray-300 rounded px-1.5 py-1 text-xs w-16 focus:outline-none" value={row.ar} onChange={e=>updArr('rect_rows',i,'ar',e.target.value)} onBlur={autoguardarBlur} disabled={!puedeEditar} /></td>
                  <td className="pr-1 pb-1"><input type="number" className="border border-gray-300 rounded px-1.5 py-1 text-xs w-14 focus:outline-none" value={row.tr} onChange={e=>updArr('rect_rows',i,'tr',e.target.value)} onBlur={autoguardarBlur} disabled={!puedeEditar} /></td>
                  <td className="pr-1 pb-1"><input className="border border-gray-300 rounded px-1.5 py-1 text-xs w-12 focus:outline-none" value={row.er} onChange={e=>updArr('rect_rows',i,'er',e.target.value)} onBlur={autoguardarBlur} disabled={!puedeEditar} /></td>
                  {puedeEditar && <td><button onClick={()=>delArr('rect_rows',i)} className="text-red-400 hover:text-red-600 px-1">×</button></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Campo label="Notas DC"><textarea className={inp} rows={2} value={datos.notas_dc} onChange={e=>updDatos('notas_dc',e.target.value)} onBlur={autoguardarBlur} disabled={!puedeEditar} /></Campo>
      <FotoSection secNombre="Planta DC" maxFotos={1} />
    </div>,

    // ── 2: Dist. y Rect. ──
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">Esta sección es principalmente fotográfica. Sube las fotos de distribución y rectificadores.</div>
      <Campo label="Notas"><textarea className={inp} rows={3} value={datos.notas_dist||''} onChange={e=>updDatos('notas_dist',e.target.value)} onBlur={autoguardarBlur} disabled={!puedeEditar} /></Campo>
      <div className="mt-4 space-y-4">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Fotografías por zona</p>
        <FotoSection secNombre="Distribución DC" maxFotos={3} titulo="Distribución DC" />
        <FotoSection secNombre="Rectificadores" maxFotos={3} titulo="Rectificadores" />
      </div>
    </div>,

    // ── 3: Tablero AC ──
    <div className="space-y-4">
      {datos.tableros_ac.map((t,i) => (
        <div key={i} className="border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-600">TABLERO #{i+1}</p>
            {datos.tableros_ac.length > 1 && puedeEditar && <button onClick={()=>delArr('tableros_ac',i)} className="text-xs text-red-500 hover:underline">Eliminar</button>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Calibre cable (AWG)"><input className={inp} value={t.calibre} onChange={e=>updArr('tableros_ac',i,'calibre',e.target.value)} onBlur={autoguardarBlur} placeholder="3/0" disabled={!puedeEditar} /></Campo>
            <Campo label="Cables por polo"><input className={inp} type="number" value={t.cables} onChange={e=>updArr('tableros_ac',i,'cables',e.target.value)} onBlur={autoguardarBlur} disabled={!puedeEditar} /></Campo>
            <Campo label="Apriete fase 1"><input className={inp} value={t.apr1} onChange={e=>updArr('tableros_ac',i,'apr1',e.target.value)} onBlur={autoguardarBlur} disabled={!puedeEditar} /></Campo>
            <Campo label="Apriete fase 2"><input className={inp} value={t.apr2} onChange={e=>updArr('tableros_ac',i,'apr2',e.target.value)} onBlur={autoguardarBlur} disabled={!puedeEditar} /></Campo>
            <Campo label="Apriete fase 3"><input className={inp} value={t.apr3} onChange={e=>updArr('tableros_ac',i,'apr3',e.target.value)} onBlur={autoguardarBlur} disabled={!puedeEditar} /></Campo>
            <Campo label="Corriente fase 1 (A)"><input className={inp} type="number" value={t.if1} onChange={e=>updArr('tableros_ac',i,'if1',e.target.value)} onBlur={autoguardarBlur} disabled={!puedeEditar} /></Campo>
            <Campo label="Corriente fase 2 (A)"><input className={inp} type="number" value={t.if2} onChange={e=>updArr('tableros_ac',i,'if2',e.target.value)} onBlur={autoguardarBlur} disabled={!puedeEditar} /></Campo>
            <Campo label="Corriente fase 3 (A)"><input className={inp} type="number" value={t.if3} onChange={e=>updArr('tableros_ac',i,'if3',e.target.value)} onBlur={autoguardarBlur} disabled={!puedeEditar} /></Campo>
            <Campo label="Voltaje FASE 1-2 (V)"><input className={inp} type="number" value={t.vf12} onChange={e=>updArr('tableros_ac',i,'vf12',e.target.value)} onBlur={autoguardarBlur} disabled={!puedeEditar} /></Campo>
            <Campo label="Voltaje FASE 1-3 (V)"><input className={inp} type="number" value={t.vf13} onChange={e=>updArr('tableros_ac',i,'vf13',e.target.value)} onBlur={autoguardarBlur} disabled={!puedeEditar} /></Campo>
            <Campo label="Voltaje FASE 2-3 (V)"><input className={inp} type="number" value={t.vf23} onChange={e=>updArr('tableros_ac',i,'vf23',e.target.value)} onBlur={autoguardarBlur} disabled={!puedeEditar} /></Campo>
          </div>
        </div>
      ))}
      {puedeEditar && <button onClick={()=>addArr('tableros_ac',{calibre:'',cables:'',apr1:'OK',apr2:'OK',apr3:'OK',if1:'',if2:'',if3:'',vf12:'',vf13:'',vf23:''})} className="text-sm text-blue-600 hover:underline">+ Agregar tablero #2</button>}
      <div className="mt-4 space-y-4">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Fotografías por zona</p>
        <FotoSection secNombre="Tablero rectificadores" maxFotos={3} titulo="Tablero de rectificadores" />
        <FotoSection secNombre="Barra de tierras" maxFotos={2} titulo="Barra de tierras" />
      </div>
    </div>,

    // ── 4: Bancos ──
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Campo label="Rack/Gabinete"><input className={inp} value={datos.rack} onChange={e=>updDatos('rack',e.target.value)} onBlur={autoguardarBlur} placeholder="2 GAB. CON 10 NIVELES" disabled={!puedeEditar} /></Campo>
        <ComboField label="Modelo" options={MARCAS_BATERIA} value={datos.bat_modelo} onChange={v=>updDatos('bat_modelo',v)} placeholder="HUAWEI" disabled={!puedeEditar} />
        <Campo label="Litio / Plomo"><select className={sel} value={datos.bat_tipo} onChange={e=>updDatos('bat_tipo',e.target.value)} disabled={!puedeEditar}><option>LITIO</option><option>PLOMO</option></select></Campo>
        <Campo label="Gabinetes instalados"><input className={inp} type="number" value={datos.gab_inst} onChange={e=>updDatos('gab_inst',e.target.value)} onBlur={autoguardarBlur} disabled={!puedeEditar} /></Campo>
        <ComboField label="Marca" options={MARCAS_BATERIA} value={datos.bat_marca} onChange={v=>updDatos('bat_marca',v)} placeholder="HUAWEI" disabled={!puedeEditar} />
        <Campo label="Año fabricación"><input className={inp} value={datos.bat_año} onChange={e=>updDatos('bat_año',e.target.value)} onBlur={autoguardarBlur} disabled={!puedeEditar} /></Campo>
        <Campo label="Capacidad bancos x rack"><input className={inp} type="number" value={datos.cap_banco} onChange={e=>updDatos('cap_banco',e.target.value)} onBlur={autoguardarBlur} disabled={!puedeEditar} /></Campo>
        <Campo label="Cantidad breakers"><input className={inp} type="number" value={datos.cant_break} onChange={e=>updDatos('cant_break',e.target.value)} onBlur={autoguardarBlur} disabled={!puedeEditar} /></Campo>
        <Campo label="Capacidad breaker (A)"><input className={inp} value={datos.cap_break} onChange={e=>updDatos('cap_break',e.target.value)} onBlur={autoguardarBlur} disabled={!puedeEditar} /></Campo>
        <Campo label="Bancos instalados"><input className={inp} type="number" value={datos.bancos_inst} onChange={e=>updDatos('bancos_inst',e.target.value)} onBlur={autoguardarBlur} disabled={!puedeEditar} /></Campo>
        <Campo label="Capacidad banco (A/H)"><input className={inp} type="number" value={datos.cap_banco_ah} onChange={e=>updDatos('cap_banco_ah',e.target.value)} onBlur={autoguardarBlur} disabled={!puedeEditar} /></Campo>
        <Campo label="Cables por polo"><input className={inp} type="number" value={datos.bat_cables} onChange={e=>updDatos('bat_cables',e.target.value)} onBlur={autoguardarBlur} disabled={!puedeEditar} /></Campo>
        <Campo label="Calibre cable"><input className={inp} value={datos.bat_calibre} onChange={e=>updDatos('bat_calibre',e.target.value)} onBlur={autoguardarBlur} placeholder="500 MCM" disabled={!puedeEditar} /></Campo>
        <Campo label="Voltaje batería (VDC)"><input className={inp} type="number" value={datos.bat_volt} onChange={e=>updDatos('bat_volt',e.target.value)} onBlur={autoguardarBlur} disabled={!puedeEditar} /></Campo>
        <Campo label="Breaker/fusible valor"><input className={inp} value={datos.bat_break_val} onChange={e=>updDatos('bat_break_val',e.target.value)} onBlur={autoguardarBlur} disabled={!puedeEditar} /></Campo>
        <Campo label="Tierra física calibre"><input className={inp} value={datos.bat_tierra} onChange={e=>updDatos('bat_tierra',e.target.value)} onBlur={autoguardarBlur} placeholder="2 AWG" disabled={!puedeEditar} /></Campo>
        <Campo label="Cable alarma breaker"><input className={inp} value={datos.bat_alarma} onChange={e=>updDatos('bat_alarma',e.target.value)} onBlur={autoguardarBlur} disabled={!puedeEditar} /></Campo>
        <Campo label="Eficiencia (%)"><input className={inp} type="number" value={datos.bat_efic} onChange={e=>updDatos('bat_efic',e.target.value)} onBlur={autoguardarBlur} disabled={!puedeEditar} /></Campo>
      </div>
      <Campo label="Notas bancos"><textarea className={inp} rows={3} value={datos.notas_bancos} onChange={e=>updDatos('notas_bancos',e.target.value)} onBlur={autoguardarBlur} disabled={!puedeEditar} /></Campo>
      <div className="mt-4 space-y-4">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Fotografías por zona</p>
        <FotoSection secNombre="Gabinete rack" maxFotos={1} titulo="Gabinete / rack" />
        <FotoSection secNombre="Cables baterías" maxFotos={3} titulo="Cables y baterías" />
      </div>
    </div>,

    // ── 5: Temp. Baterías ──
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-gray-500">TIERRA FÍSICA POR GABINETE</p>
          {puedeEditar && <button onClick={()=>addArr('gabinetes',{nombre:`GABINETE ${datos.gabinetes.length+1}`,tierra:''})} className="text-xs text-blue-600 hover:underline">+ Agregar</button>}
        </div>
        {datos.gabinetes.map((g,i) => (
          <div key={i} className="flex gap-2 items-center mb-2">
            <input className={inp} value={g.nombre} onChange={e=>updArr('gabinetes',i,'nombre',e.target.value)} onBlur={autoguardarBlur} disabled={!puedeEditar} />
            <input className={inp} value={g.tierra} onChange={e=>updArr('gabinetes',i,'tierra',e.target.value)} onBlur={autoguardarBlur} placeholder="OK CAL 2 AWG" disabled={!puedeEditar} />
            {datos.gabinetes.length > 1 && puedeEditar && <button onClick={()=>delArr('gabinetes',i)} className="text-red-400">×</button>}
          </div>
        ))}
      </div>
      <Campo label="Alarmas presentes"><input className={inp} value={datos.tb_alarmas} onChange={e=>updDatos('tb_alarmas',e.target.value)} onBlur={autoguardarBlur} disabled={!puedeEditar} /></Campo>
      <Campo label="Notas"><textarea className={inp} rows={2} value={datos.tb_notas} onChange={e=>updDatos('tb_notas',e.target.value)} onBlur={autoguardarBlur} disabled={!puedeEditar} /></Campo>
      <div className="mt-4 space-y-4">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Termografías</p>
        <FotoSection secNombre="Temp Bat Superior" maxFotos={2} titulo="Termografía superior" />
        <FotoSection secNombre="Temp Bat Inferior" maxFotos={2} titulo="Termografía inferior" />
        <FotoSection secNombre="Temp Bat Extra" maxFotos={2} titulo="Termografía extra" />
      </div>
    </div>,

    // ── 6: Temp. Distribución ──
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-gray-500">CONFIGURACIÓN ALARMA DE FUSIBLES</p>
          {puedeEditar && <button onClick={()=>addArr('distribuciones',{nombre:`DISTRIBUCIÓN ${datos.distribuciones.length+1}`,estado:'ACTIVADA'})} className="text-xs text-blue-600 hover:underline">+ Agregar</button>}
        </div>
        {datos.distribuciones.map((d,i) => (
          <div key={i} className="flex gap-2 items-center mb-2">
            <input className={inp} value={d.nombre} onChange={e=>updArr('distribuciones',i,'nombre',e.target.value)} onBlur={autoguardarBlur} disabled={!puedeEditar} />
            <input className={inp} value={d.estado} onChange={e=>updArr('distribuciones',i,'estado',e.target.value)} onBlur={autoguardarBlur} placeholder="ACTIVADA" disabled={!puedeEditar} />
            {datos.distribuciones.length > 1 && puedeEditar && <button onClick={()=>delArr('distribuciones',i)} className="text-red-400">×</button>}
          </div>
        ))}
      </div>
      <Campo label="Alarmas presentes"><input className={inp} value={datos.td_alarmas} onChange={e=>updDatos('td_alarmas',e.target.value)} onBlur={autoguardarBlur} disabled={!puedeEditar} /></Campo>
      <Campo label="Notas"><textarea className={inp} rows={2} value={datos.td_notas} onChange={e=>updDatos('td_notas',e.target.value)} onBlur={autoguardarBlur} disabled={!puedeEditar} /></Campo>
      <div className="mt-4 space-y-4">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Termografías</p>
        <FotoSection secNombre="Temp Dist Superior" maxFotos={2} titulo="Termografía superior" />
        <FotoSection secNombre="Temp Dist Inferior" maxFotos={2} titulo="Termografía inferior" />
        <FotoSection secNombre="Temp Dist Extra" maxFotos={2} titulo="Termografía extra" />
      </div>
    </div>,

    // ── 7: Temp. Rectificadores ──
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {[['shefts_izq','LADO IZQUIERDO'],['shefts_der','LADO DERECHO']].map(([key,label]) => (
          <div key={key}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-500">{label}</p>
              {puedeEditar && <button onClick={()=>addArr(key,{nombre:`SHELFT ${datos[key].length+1}`,estado:'OK'})} className="text-xs text-blue-600">+</button>}
            </div>
            {datos[key].map((s,i) => (
              <div key={i} className="flex gap-2 items-center mb-2">
                <input className={inp} value={s.nombre} onChange={e=>updArr(key,i,'nombre',e.target.value)} onBlur={autoguardarBlur} disabled={!puedeEditar} />
                <select className={sel} value={s.estado} onChange={e=>updArr(key,i,'estado',e.target.value)} disabled={!puedeEditar}>
                  <option>OK</option><option>FALLA</option><option value="">N/A</option>
                </select>
                {datos[key].length > 1 && puedeEditar && <button onClick={()=>delArr(key,i)} className="text-red-400">×</button>}
              </div>
            ))}
          </div>
        ))}
      </div>
      <Campo label="Aspirado y limpieza"><input className={inp} value={datos.tr_limpieza} onChange={e=>updDatos('tr_limpieza',e.target.value)} onBlur={autoguardarBlur} disabled={!puedeEditar} /></Campo>
      <Campo label="Alarmas presentes"><input className={inp} value={datos.tr_alarmas} onChange={e=>updDatos('tr_alarmas',e.target.value)} onBlur={autoguardarBlur} disabled={!puedeEditar} /></Campo>
      <Campo label="Notas"><textarea className={inp} rows={2} value={datos.tr_notas} onChange={e=>updDatos('tr_notas',e.target.value)} onBlur={autoguardarBlur} disabled={!puedeEditar} /></Campo>
      <div className="mt-4 space-y-4">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Termografías</p>
        <FotoSection secNombre="Temp Rect Izq" maxFotos={2} titulo="Termografía izquierda" />
        <FotoSection secNombre="Temp Rect Der" maxFotos={2} titulo="Termografía derecha" />
        <FotoSection secNombre="Temp Rect Extra" maxFotos={2} titulo="Termografía extra" />
      </div>
    </div>,

    // ── 8: Temp. Tablero AC ──
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">Esta sección es principalmente fotográfica. Sube las fotos de temperaturas del tablero AC.</div>
      <Campo label="Notas"><textarea className={inp} rows={3} value={datos.notas_temp_tablero||''} onChange={e=>updDatos('notas_temp_tablero',e.target.value)} onBlur={autoguardarBlur} disabled={!puedeEditar} /></Campo>
      <div className="mt-4 space-y-4">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Termografías</p>
        <FotoSection secNombre="Temp Tab Superior" maxFotos={2} titulo="Termografía superior" />
        <FotoSection secNombre="Temp Tab Inferior" maxFotos={2} titulo="Termografía inferior" />
        <FotoSection secNombre="Temp Tab Extra" maxFotos={2} titulo="Termografía extra" />
      </div>
    </div>,
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modal rechazo */}
      {showRechazoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Motivo de rechazo</h3>
            <p className="text-xs text-gray-500 mb-3">Indica al técnico qué debe corregir.</p>
            <textarea className={inp} rows={4} value={motivoRechazo} onChange={e=>setMotivoRechazo(e.target.value)} placeholder="Ej: Faltan temperaturas en baterías, revisar voltaje de igualación..." />
            <div className="flex gap-2 mt-4">
              <button onClick={()=>setShowRechazoModal(false)} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
              <button onClick={()=>{ guardar('rechazado', motivoRechazo); setShowRechazoModal(false); setMotivoRechazo('') }}
                className="flex-1 bg-red-500 text-white rounded-lg py-2 text-sm font-medium hover:bg-red-600">Rechazar</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={()=>nav('/')} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div>
            <h1 className="text-sm font-semibold text-gray-900">{esNuevo ? 'Nuevo reporte' : `RS-${enc.codigo_rs||'—'}`}</h1>
            <p className="text-xs text-gray-500">
              {enc.planta||'Sin nombre'} {!puedeEditar && '· Solo lectura'}
              {autoguardando && ' · Autoguardando...'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {msg && <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-lg">{msg}</span>}
          {puedeEditar && <button onClick={()=>guardar()} disabled={guardando} className="text-sm text-blue-600 hover:underline disabled:opacity-50">{guardando?'Guardando...':'Guardar'}</button>}
          {!esNuevo && esPropio && estado === 'borrador' && (
            <button onClick={()=>guardar('en_revision')} className="bg-yellow-500 text-white text-sm rounded-lg px-3 py-1.5 hover:bg-yellow-600">Enviar a revisión</button>
          )}
          {!esNuevo && esPropio && estado === 'en_revision' && (
            <button onClick={()=>guardar('borrador')} className="bg-gray-500 text-white text-sm rounded-lg px-3 py-1.5 hover:bg-gray-600">Cancelar revisión</button>
          )}
          {!esNuevo && esPropio && estado === 'rechazado' && (
            <button onClick={()=>guardar('en_revision')} className="bg-orange-500 text-white text-sm rounded-lg px-3 py-1.5 hover:bg-orange-600">Reenviar a revisión</button>
          )}
          {!esNuevo && perfil?.rol === 'admin' && (
            <div className="flex gap-1">
              {estado !== 'aprobado' && <button onClick={()=>guardar('aprobado')} className="bg-green-500 text-white text-sm rounded-lg px-3 py-1.5 hover:bg-green-600">✓ Aprobar</button>}
              {estado !== 'rechazado' && <button onClick={()=>setShowRechazoModal(true)} className="bg-red-500 text-white text-sm rounded-lg px-3 py-1.5 hover:bg-red-600">✗ Rechazar</button>}
              {estado !== 'borrador' && <button onClick={()=>guardar('borrador')} className="border border-gray-300 text-gray-600 text-sm rounded-lg px-3 py-1.5 hover:bg-gray-50">↩ Borrador</button>}
            </div>
          )}
          {!esNuevo && (
            <button onClick={generarExcel} disabled={generando} className="bg-blue-600 text-white text-sm rounded-lg px-3 py-1.5 hover:bg-blue-700 disabled:opacity-50">{generando?'Generando...':'⬇ Excel'}</button>
          )}
        </div>
      </div>

      <ProgresoBarra enc={enc} datos={datos} seccionActual={seccion} onClickSeccion={setSeccion} />

      <div className="bg-white border-b border-gray-200 px-4 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {SECCIONES.map((s,i) => (
            <button key={i} onClick={()=>setSeccion(i)}
              className={`text-xs px-3 py-2.5 border-b-2 whitespace-nowrap transition-colors ${seccion===i?'border-blue-600 text-blue-600 font-medium':'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {secciones[seccion]}
        <div className="flex justify-between mt-8 pt-4 border-t border-gray-100">
          <button onClick={()=>setSeccion(p=>Math.max(0,p-1))} disabled={seccion===0} className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-30">← Anterior</button>
          {seccion < SECCIONES.length-1
            ? <button onClick={()=>setSeccion(p=>p+1)} className="text-sm text-blue-600 hover:underline">Siguiente →</button>
            : puedeEditar && <button onClick={()=>guardar()} disabled={guardando} className="bg-blue-600 text-white text-sm rounded-lg px-4 py-2 hover:bg-blue-700 disabled:opacity-50">{guardando?'Guardando...':'Guardar reporte'}</button>
          }
        </div>
      </div>
    </div>
  )
}
