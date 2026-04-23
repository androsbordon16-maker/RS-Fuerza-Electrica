import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const SECCIONES = ['Encabezado', 'Planta DC', 'Tablero AC', 'Bancos', 'Temp. Baterías', 'Temp. Distribución', 'Temp. Rectificadores']

const DATOS_INIT = {
  // Planta DC
  modelo:'', serie:'', rect_total:'', rect_inst:'', cap_rect:'', carga:'',
  volt_op:'54', volt_ig:'54.5', alarmas_dc:'NO', cal_pos:'', cal_tierra:'', cal_barra:'',
  nota_especial:'', notas_dc:'',
  rect_rows:[{al:'',tl:'',el:'',tb:'',td:'',ar:'',tr:'',er:''}],
  // Tablero AC
  tableros_ac:[{calibre:'',cables:'',apr1:'OK',apr2:'OK',apr3:'OK',if1:'',if2:'',if3:'',vf1:'',vf2:'',vf3:'',etiqueta_v1:'VOLTAJE FASE 1-2',etiqueta_v2:'VOLTAJE FASE 1-3',etiqueta_v3:'VOLTAJE FASE 2-3',nota_extra:''}],
  // Bancos
  rack:'', bat_modelo:'', bat_tipo:'LITIO', gab_inst:'', bat_marca:'', bat_año:'',
  cap_banco:'', cant_break:'', cap_break:'', bancos_inst:'', cap_banco_ah:'',
  bat_cables:'', bat_calibre:'', bat_volt:'54', bat_break_val:'', bat_tierra:'', bat_alarma:'UTP', bat_efic:'80',
  notas_bancos:'',
  // Temp Baterías
  gabinetes:[{nombre:'GABINETE 1',tierra:''}],
  tb_alarmas:'NINGUNA', tb_notas:'',
  // Temp Distribución
  distribuciones:[{nombre:'DISTRIBUCIÓN 1',estado:'ACTIVADA'}],
  td_alarmas:'NINGUNA', td_notas:'',
  // Temp Rectificadores
  shefts_izq:[{nombre:'SHEFT 1',estado:'OK'}],
  shefts_der:[{nombre:'SHEFT 1',estado:'OK'}],
  tr_limpieza:'OK', tr_alarmas:'NINGUNA', tr_notas:'',
}

function Campo({label, children, className=''}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-xs text-gray-500 font-medium">{label}</label>
      {children}
    </div>
  )
}

const inp = "border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
const sel = "border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full bg-white"

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
  const [guardando, setGuardando] = useState(false)
  const [estado, setEstado] = useState('borrador')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (!esNuevo) cargarReporte()
  }, [id])

  async function cargarReporte() {
    const { data: r } = await supabase.from('reportes').select('*').eq('id', id).single()
    if (!r) return nav('/')
    setReporteId(r.id)
    setEstado(r.estado)
    setEnc({ codigo_rs: r.codigo_rs||'', numero_ventana: r.numero_ventana||'', fecha_servicio: r.fecha_servicio||'', planta: r.planta||'', sitio: r.sitio||'', ciudad: r.ciudad||'' })
    if (r.datos) setDatos({ ...DATOS_INIT, ...r.datos })
    const { data: fs } = await supabase.from('fotos').select('*').eq('reporte_id', id).order('orden')
    setFotosExistentes(fs || [])
  }

  function updDatos(key, val) { setDatos(p => ({ ...p, [key]: val })) }
  function updArr(key, idx, field, val) {
    setDatos(p => {
      const arr = [...p[key]]
      arr[idx] = { ...arr[idx], [field]: val }
      return { ...p, [key]: arr }
    })
  }
  function addArr(key, item) { setDatos(p => ({ ...p, [key]: [...p[key], item] })) }
  function delArr(key, idx) { setDatos(p => ({ ...p, [key]: p[key].filter((_,i) => i !== idx) })) }

  async function guardar(nuevoEstado) {
    setGuardando(true)
    const payload = {
      codigo_rs: enc.codigo_rs, numero_ventana: enc.numero_ventana,
      fecha_servicio: enc.fecha_servicio, planta: enc.planta,
      sitio: enc.sitio, ciudad: enc.ciudad,
      datos, estado: nuevoEstado || estado,
      tecnico_id: user.id,
    }

    let rid = reporteId
    if (esNuevo || !rid) {
      const { data } = await supabase.from('reportes').insert(payload).select().single()
      rid = data?.id
      setReporteId(rid)
    } else {
      await supabase.from('reportes').update({ ...payload, updated_at: new Date() }).eq('id', rid)
    }

    // Registrar historial
    await supabase.from('historial').insert({
      reporte_id: rid, usuario_id: user.id,
      accion: nuevoEstado ? `Estado cambiado a ${nuevoEstado}` : 'Reporte guardado',
      detalle: { estado: nuevoEstado || estado }
    })

    // Subir fotos nuevas
    for (const [sec, archivos] of Object.entries(fotos)) {
      for (let i = 0; i < archivos.length; i++) {
        const f = archivos[i]
        const ext = f.name.split('.').pop()
        const path = `${rid}/${sec}/${Date.now()}_${i}.${ext}`
        const { data: up } = await supabase.storage.from('fotos-reportes').upload(path, f, { upsert: true })
        if (up) {
          const { data: { publicUrl } } = supabase.storage.from('fotos-reportes').getPublicUrl(path)
          await supabase.from('fotos').insert({ reporte_id: rid, seccion: sec, url: publicUrl, nombre_archivo: f.name, orden: i })
        }
      }
    }
    setFotos({})
    if (nuevoEstado) setEstado(nuevoEstado)
    setMsg('Guardado correctamente')
    setTimeout(() => setMsg(''), 3000)
    setGuardando(false)
    if (esNuevo && rid) nav(`/reporte/${rid}`, { replace: true })
  }

  // --- FOTO SECTION ---
  function FotoSection({ secNombre }) {
    const fileRef = useRef()
    const existing = fotosExistentes.filter(f => f.seccion === secNombre)
    const nuevas = fotos[secNombre] || []
    return (
      <div className="mt-4">
        <p className="text-xs font-medium text-gray-500 mb-2">FOTOS — {secNombre}</p>
        <div className="flex flex-wrap gap-2 mb-2">
          {existing.map(f => (
            <div key={f.id} className="relative group">
              <img src={f.url} className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
              <button onClick={async () => {
                await supabase.from('fotos').delete().eq('id', f.id)
                setFotosExistentes(p => p.filter(x => x.id !== f.id))
              }} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs hidden group-hover:flex items-center justify-center">×</button>
            </div>
          ))}
          {nuevas.map((f, i) => (
            <div key={i} className="w-20 h-20 rounded-lg border border-dashed border-blue-300 bg-blue-50 flex items-center justify-center text-xs text-blue-500 text-center p-1">
              {f.name.length > 12 ? f.name.slice(0,10)+'...' : f.name}
            </div>
          ))}
          <button onClick={() => fileRef.current.click()} className="w-20 h-20 rounded-lg border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors">
            <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            <span className="text-xs">Foto</span>
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
          onChange={e => {
            const files = Array.from(e.target.files)
            setFotos(p => ({ ...p, [secNombre]: [...(p[secNombre]||[]), ...files] }))
          }}
        />
      </div>
    )
  }

  // --- SECCIONES ---
  const secciones = [
    // 0 ENCABEZADO
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Campo label="Código RS-"><input className={inp} value={enc.codigo_rs} onChange={e => setEnc(p=>({...p,codigo_rs:e.target.value}))} placeholder="174" /></Campo>
        <Campo label="Número de ventana"><input className={inp} value={enc.numero_ventana} onChange={e => setEnc(p=>({...p,numero_ventana:e.target.value}))} placeholder="595314" /></Campo>
      </div>
      <Campo label="Fecha del servicio"><input className={inp} value={enc.fecha_servicio} onChange={e => setEnc(p=>({...p,fecha_servicio:e.target.value}))} placeholder="MARTES 26/AGOSTO/2025" /></Campo>
      <Campo label="Planta"><input className={inp} value={enc.planta} onChange={e => setEnc(p=>({...p,planta:e.target.value}))} placeholder='PLANTA ALPHA "A"' /></Campo>
      <Campo label="Sitio"><input className={inp} value={enc.sitio} onChange={e => setEnc(p=>({...p,sitio:e.target.value}))} placeholder="CTC CUERNAVACA." /></Campo>
      <Campo label="Ciudad"><input className={inp} value={enc.ciudad} onChange={e => setEnc(p=>({...p,ciudad:e.target.value}))} placeholder="CUERNAVACA, MORELOS." /></Campo>
    </div>,

    // 1 PLANTA DC
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Campo label="Modelo"><input className={inp} value={datos.modelo} onChange={e=>updDatos('modelo',e.target.value)} placeholder="CXPS-W(2000)" /></Campo>
        <Campo label="Número de serie"><input className={inp} value={datos.serie} onChange={e=>updDatos('serie',e.target.value)} placeholder="2246F04PSW00022" /></Campo>
        <Campo label="Total rectificadores que acepta"><input className={inp} type="number" value={datos.rect_total} onChange={e=>updDatos('rect_total',e.target.value)} placeholder="24" /></Campo>
        <Campo label="Rectificadores instalados"><input className={inp} type="number" value={datos.rect_inst} onChange={e=>updDatos('rect_inst',e.target.value)} placeholder="9" /></Campo>
        <Campo label="Capacidad rectificador (W)"><input className={inp} type="number" value={datos.cap_rect} onChange={e=>updDatos('cap_rect',e.target.value)} placeholder="4000" /></Campo>
        <Campo label="Carga actual (A)"><input className={inp} type="number" value={datos.carga} onChange={e=>updDatos('carga',e.target.value)} placeholder="142.25" /></Campo>
        <Campo label="Voltaje operación"><input className={inp} type="number" value={datos.volt_op} onChange={e=>updDatos('volt_op',e.target.value)} /></Campo>
        <Campo label="Voltaje igualación"><input className={inp} type="number" value={datos.volt_ig} onChange={e=>updDatos('volt_ig',e.target.value)} /></Campo>
        <Campo label="Alarmas presentes"><input className={inp} value={datos.alarmas_dc} onChange={e=>updDatos('alarmas_dc',e.target.value)} /></Campo>
        <Campo label="Calibre positivo"><input className={inp} value={datos.cal_pos} onChange={e=>updDatos('cal_pos',e.target.value)} placeholder="4/0" /></Campo>
        <Campo label="Calibre tierra física"><input className={inp} value={datos.cal_tierra} onChange={e=>updDatos('cal_tierra',e.target.value)} placeholder="6" /></Campo>
        <Campo label="Calibre barra delta"><input className={inp} value={datos.cal_barra} onChange={e=>updDatos('cal_barra',e.target.value)} placeholder="1/0" /></Campo>
      </div>
      <Campo label="Nota especial (A32)"><input className={inp} value={datos.nota_especial} onChange={e=>updDatos('nota_especial',e.target.value)} placeholder="SOLO TIENE CABLEADOS PARA X RECTIFICADORES..." /></Campo>

      {/* Recuadros azules */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-gray-500">REAPRIETE — RECUADROS AZULES</p>
          <button onClick={() => addArr('rect_rows',{al:'',tl:'',el:'',tb:'',td:'',ar:'',tr:'',er:''})} className="text-xs text-blue-600 hover:underline">+ Agregar fila</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="text-gray-400">{['Apriete L','Temp L','Etiq L','Tablero Izq (azul)','Tablero Der (azul)','Apriete R','Temp R','Etiq R',''].map(h=><th key={h} className="text-left pb-1 pr-2 font-medium">{h}</th>)}</tr></thead>
            <tbody>
              {datos.rect_rows.map((row,i) => (
                <tr key={i}>
                  {['al','tl','el','tb','td','ar','tr','er'].map(f => (
                    <td key={f} className="pr-1 pb-1">
                      <input className="border border-gray-300 rounded px-2 py-1 text-xs w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={row[f]} onChange={e=>updArr('rect_rows',i,f,e.target.value)}
                        style={['tb','td'].includes(f)?{background:'#e0f2fe'}:{}}
                      />
                    </td>
                  ))}
                  <td><button onClick={()=>delArr('rect_rows',i)} className="text-red-400 hover:text-red-600 px-1">×</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Campo label="Notas DC"><textarea className={inp} rows={2} value={datos.notas_dc} onChange={e=>updDatos('notas_dc',e.target.value)} /></Campo>
      <FotoSection secNombre="Planta DC" />
    </div>,

    // 2 TABLERO AC
    <div className="space-y-4">
      {datos.tableros_ac.map((t,i) => (
        <div key={i} className="border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-600">TABLERO #{i+1}</p>
            {datos.tableros_ac.length > 1 && <button onClick={()=>delArr('tableros_ac',i)} className="text-xs text-red-500 hover:underline">Eliminar</button>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Calibre cable (AWG)"><input className={inp} value={t.calibre} onChange={e=>updArr('tableros_ac',i,'calibre',e.target.value)} placeholder="3/0" /></Campo>
            <Campo label="Cables por polo"><input className={inp} type="number" value={t.cables} onChange={e=>updArr('tableros_ac',i,'cables',e.target.value)} placeholder="1" /></Campo>
            <Campo label="Apriete fase 1"><input className={inp} value={t.apr1} onChange={e=>updArr('tableros_ac',i,'apr1',e.target.value)} /></Campo>
            <Campo label="Apriete fase 2"><input className={inp} value={t.apr2} onChange={e=>updArr('tableros_ac',i,'apr2',e.target.value)} /></Campo>
            <Campo label="Apriete fase 3"><input className={inp} value={t.apr3} onChange={e=>updArr('tableros_ac',i,'apr3',e.target.value)} /></Campo>
            <Campo label="Corriente fase 1 (A)"><input className={inp} type="number" value={t.if1} onChange={e=>updArr('tableros_ac',i,'if1',e.target.value)} /></Campo>
            <Campo label="Corriente fase 2 (A)"><input className={inp} type="number" value={t.if2} onChange={e=>updArr('tableros_ac',i,'if2',e.target.value)} /></Campo>
            <Campo label="Corriente fase 3 (A)"><input className={inp} type="number" value={t.if3} onChange={e=>updArr('tableros_ac',i,'if3',e.target.value)} /></Campo>
          </div>
          <div className="mt-3 space-y-2">
            {[1,2,3].map(n => (
              <div key={n} className="flex gap-2 items-center">
                <input className={inp} value={t[`etiqueta_v${n}`]} onChange={e=>updArr('tableros_ac',i,`etiqueta_v${n}`,e.target.value)} placeholder={`Etiqueta voltaje ${n}`} />
                <input className={inp} type="number" value={t[`vf${n}`]} onChange={e=>updArr('tableros_ac',i,`vf${n}`,e.target.value)} placeholder="220.0" />
                <span className="text-xs text-gray-400 whitespace-nowrap">V</span>
              </div>
            ))}
          </div>
          <Campo label="Nota extra (ej: BIFASICO)" className="mt-3">
            <input className={inp} value={t.nota_extra} onChange={e=>updArr('tableros_ac',i,'nota_extra',e.target.value)} />
          </Campo>
        </div>
      ))}
      <button onClick={() => addArr('tableros_ac',{calibre:'',cables:'',apr1:'OK',apr2:'OK',apr3:'OK',if1:'',if2:'',if3:'',vf1:'',vf2:'',vf3:'',etiqueta_v1:'VOLTAJE FASE 1-2',etiqueta_v2:'VOLTAJE FASE 1-3',etiqueta_v3:'VOLTAJE FASE 2-3',nota_extra:''})}
        className="text-sm text-blue-600 hover:underline">+ Agregar tablero #2</button>
      <FotoSection secNombre="Tablero AC" />
    </div>,

    // 3 BANCOS
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Campo label="Rack/Gabinete"><input className={inp} value={datos.rack} onChange={e=>updDatos('rack',e.target.value)} placeholder="2 GAB. CON 10 NIVELES" /></Campo>
        <Campo label="Modelo"><input className={inp} value={datos.bat_modelo} onChange={e=>updDatos('bat_modelo',e.target.value)} placeholder="HUAWEI" /></Campo>
        <Campo label="Litio / Plomo"><select className={sel} value={datos.bat_tipo} onChange={e=>updDatos('bat_tipo',e.target.value)}><option>LITIO</option><option>PLOMO</option></select></Campo>
        <Campo label="Gabinetes instalados"><input className={inp} type="number" value={datos.gab_inst} onChange={e=>updDatos('gab_inst',e.target.value)} /></Campo>
        <Campo label="Marca"><input className={inp} value={datos.bat_marca} onChange={e=>updDatos('bat_marca',e.target.value)} /></Campo>
        <Campo label="Año fabricación"><input className={inp} value={datos.bat_año} onChange={e=>updDatos('bat_año',e.target.value)} /></Campo>
        <Campo label="Capacidad bancos x rack"><input className={inp} type="number" value={datos.cap_banco} onChange={e=>updDatos('cap_banco',e.target.value)} /></Campo>
        <Campo label="Cantidad breakers"><input className={inp} type="number" value={datos.cant_break} onChange={e=>updDatos('cant_break',e.target.value)} /></Campo>
        <Campo label="Capacidad breaker (A)"><input className={inp} value={datos.cap_break} onChange={e=>updDatos('cap_break',e.target.value)} /></Campo>
        <Campo label="Bancos instalados"><input className={inp} type="number" value={datos.bancos_inst} onChange={e=>updDatos('bancos_inst',e.target.value)} /></Campo>
        <Campo label="Capacidad banco (A/H)"><input className={inp} type="number" value={datos.cap_banco_ah} onChange={e=>updDatos('cap_banco_ah',e.target.value)} /></Campo>
        <Campo label="Cables por polo"><input className={inp} type="number" value={datos.bat_cables} onChange={e=>updDatos('bat_cables',e.target.value)} /></Campo>
        <Campo label="Calibre cable"><input className={inp} value={datos.bat_calibre} onChange={e=>updDatos('bat_calibre',e.target.value)} placeholder="500 MCM" /></Campo>
        <Campo label="Voltaje batería (VDC)"><input className={inp} type="number" value={datos.bat_volt} onChange={e=>updDatos('bat_volt',e.target.value)} /></Campo>
        <Campo label="Breaker/fusible valor"><input className={inp} value={datos.bat_break_val} onChange={e=>updDatos('bat_break_val',e.target.value)} /></Campo>
        <Campo label="Tierra física calibre"><input className={inp} value={datos.bat_tierra} onChange={e=>updDatos('bat_tierra',e.target.value)} placeholder="2 AWG" /></Campo>
        <Campo label="Cable alarma breaker"><input className={inp} value={datos.bat_alarma} onChange={e=>updDatos('bat_alarma',e.target.value)} /></Campo>
        <Campo label="Eficiencia (%)"><input className={inp} type="number" value={datos.bat_efic} onChange={e=>updDatos('bat_efic',e.target.value)} /></Campo>
      </div>
      <Campo label="Notas bancos"><textarea className={inp} rows={3} value={datos.notas_bancos} onChange={e=>updDatos('notas_bancos',e.target.value)} /></Campo>
      <FotoSection secNombre="Bancos" />
    </div>,

    // 4 TEMP BATERÍAS
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-gray-500">TIERRA FÍSICA POR GABINETE</p>
          <button onClick={()=>addArr('gabinetes',{nombre:`GABINETE ${datos.gabinetes.length+1}`,tierra:''})} className="text-xs text-blue-600 hover:underline">+ Agregar</button>
        </div>
        <div className="space-y-2">
          {datos.gabinetes.map((g,i) => (
            <div key={i} className="flex gap-2 items-center">
              <input className={inp} value={g.nombre} onChange={e=>updArr('gabinetes',i,'nombre',e.target.value)} placeholder="GABINETE 1" />
              <input className={inp} value={g.tierra} onChange={e=>updArr('gabinetes',i,'tierra',e.target.value)} placeholder="OK CAL 2 AWG" />
              {datos.gabinetes.length > 1 && <button onClick={()=>delArr('gabinetes',i)} className="text-red-400 hover:text-red-600">×</button>}
            </div>
          ))}
        </div>
      </div>
      <Campo label="Alarmas presentes"><input className={inp} value={datos.tb_alarmas} onChange={e=>updDatos('tb_alarmas',e.target.value)} /></Campo>
      <Campo label="Notas"><textarea className={inp} rows={2} value={datos.tb_notas} onChange={e=>updDatos('tb_notas',e.target.value)} /></Campo>
      <FotoSection secNombre="Temp Baterías" />
    </div>,

    // 5 TEMP DISTRIBUCIÓN
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-gray-500">CONFIGURACIÓN ALARMA DE FUSIBLES</p>
          <button onClick={()=>addArr('distribuciones',{nombre:`DISTRIBUCIÓN ${datos.distribuciones.length+1}`,estado:'ACTIVADA'})} className="text-xs text-blue-600 hover:underline">+ Agregar</button>
        </div>
        <div className="space-y-2">
          {datos.distribuciones.map((d,i) => (
            <div key={i} className="flex gap-2 items-center">
              <input className={inp} value={d.nombre} onChange={e=>updArr('distribuciones',i,'nombre',e.target.value)} placeholder="DISTRIBUCIÓN 1" />
              <input className={inp} value={d.estado} onChange={e=>updArr('distribuciones',i,'estado',e.target.value)} placeholder="ACTIVADA" />
              {datos.distribuciones.length > 1 && <button onClick={()=>delArr('distribuciones',i)} className="text-red-400 hover:text-red-600">×</button>}
            </div>
          ))}
        </div>
      </div>
      <Campo label="Alarmas presentes"><input className={inp} value={datos.td_alarmas} onChange={e=>updDatos('td_alarmas',e.target.value)} /></Campo>
      <Campo label="Notas"><textarea className={inp} rows={2} value={datos.td_notas} onChange={e=>updDatos('td_notas',e.target.value)} /></Campo>
      <FotoSection secNombre="Temp Distribución" />
    </div>,

    // 6 TEMP RECTIFICADORES
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {[['shefts_izq','LADO IZQUIERDO'],['shefts_der','LADO DERECHO']].map(([key,label]) => (
          <div key={key}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-500">{label}</p>
              <button onClick={()=>addArr(key,{nombre:`SHEFT ${datos[key].length+1}`,estado:'OK'})} className="text-xs text-blue-600 hover:underline">+</button>
            </div>
            <div className="space-y-2">
              {datos[key].map((s,i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input className={inp} value={s.nombre} onChange={e=>updArr(key,i,'nombre',e.target.value)} placeholder="SHEFT 1" />
                  <select className={sel} value={s.estado} onChange={e=>updArr(key,i,'estado',e.target.value)}>
                    <option>OK</option><option>FALLA</option><option value="">N/A</option>
                  </select>
                  {datos[key].length > 1 && <button onClick={()=>delArr(key,i)} className="text-red-400">×</button>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <Campo label="Aspirado y limpieza"><input className={inp} value={datos.tr_limpieza} onChange={e=>updDatos('tr_limpieza',e.target.value)} /></Campo>
      <Campo label="Alarmas presentes"><input className={inp} value={datos.tr_alarmas} onChange={e=>updDatos('tr_alarmas',e.target.value)} /></Campo>
      <Campo label="Notas"><textarea className={inp} rows={2} value={datos.tr_notas} onChange={e=>updDatos('tr_notas',e.target.value)} /></Campo>
      <FotoSection secNombre="Temp Rectificadores" />
    </div>,
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={()=>nav('/')} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div>
            <h1 className="text-sm font-semibold text-gray-900">{esNuevo ? 'Nuevo reporte' : `RS-${enc.codigo_rs || '—'}`}</h1>
            <p className="text-xs text-gray-500">{enc.planta || 'Sin nombre'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {msg && <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-lg">{msg}</span>}
          <button onClick={()=>guardar()} disabled={guardando} className="text-sm text-blue-600 hover:underline disabled:opacity-50">
            {guardando ? 'Guardando...' : 'Guardar'}
          </button>
          {!esNuevo && estado === 'borrador' && (
            <button onClick={()=>guardar('en_revision')} className="bg-yellow-500 text-white text-sm rounded-lg px-3 py-1.5 hover:bg-yellow-600">
              Enviar a revisión
            </button>
          )}
          {!esNuevo && perfil?.rol === 'admin' && estado === 'en_revision' && (
            <>
              <button onClick={()=>guardar('aprobado')} className="bg-green-500 text-white text-sm rounded-lg px-3 py-1.5 hover:bg-green-600">Aprobar</button>
              <button onClick={()=>guardar('rechazado')} className="bg-red-500 text-white text-sm rounded-lg px-3 py-1.5 hover:bg-red-600">Rechazar</button>
            </>
          )}
          {!esNuevo && (
            <button onClick={()=>nav(`/reporte/${id}/excel`)} className="bg-blue-600 text-white text-sm rounded-lg px-3 py-1.5 hover:bg-blue-700">
              Generar Excel
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-4 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {SECCIONES.map((s,i) => (
            <button key={i} onClick={()=>setSeccion(i)}
              className={`text-xs px-3 py-2.5 border-b-2 whitespace-nowrap transition-colors ${seccion===i ? 'border-blue-600 text-blue-600 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        {secciones[seccion]}
        {/* Nav buttons */}
        <div className="flex justify-between mt-8 pt-4 border-t border-gray-100">
          <button onClick={()=>setSeccion(p=>Math.max(0,p-1))} disabled={seccion===0}
            className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-30">← Anterior</button>
          {seccion < SECCIONES.length-1
            ? <button onClick={()=>setSeccion(p=>p+1)} className="text-sm text-blue-600 hover:underline">Siguiente →</button>
            : <button onClick={()=>guardar()} disabled={guardando} className="bg-blue-600 text-white text-sm rounded-lg px-4 py-2 hover:bg-blue-700 disabled:opacity-50">
                {guardando ? 'Guardando...' : 'Guardar reporte'}
              </button>
          }
        </div>
      </div>
    </div>
  )
}
