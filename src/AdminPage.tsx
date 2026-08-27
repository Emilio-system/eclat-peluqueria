import { useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth'
import './AdminPage.css'
import { auth } from './firebase'
import { HORARIOS } from './horarios'
import {
  obtenerDetalleDelDia, bloquearHorario, liberarHorario,
  bloquearRangoDeVacaciones, desbloquearRangoDeVacaciones, type SlotInfo,
} from './turnos'
 
const hoyISO = () => new Date().toISOString().slice(0, 10)
 
function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
 
  const entrar = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setCargando(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch {
      setError('Usuario o contraseña incorrectos.')
    } finally {
      setCargando(false)
    }
  }
 
  return (
    <main className="admin-login">
      <form className="login-caja" onSubmit={entrar}>
        <h1>Panel Éclat</h1>
        <div className="campo">
          <label htmlFor="email">Usuario</label>
          <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div className="campo">
          <label htmlFor="password">Contraseña</label>
          <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        {error && <p className="error">{error}</p>}
        <button className="btn-entrar" disabled={cargando}>
          {cargando ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
    </main>
  )
}
 
function PanelDisponibilidad() {
  const [fecha, setFecha] = useState(hoyISO())
  const [detalle, setDetalle] = useState<Record<string, SlotInfo>>({})
  const [cargando, setCargando] = useState(true)
  const [aviso, setAviso] = useState('')
 
  const [desde, setDesde] = useState(hoyISO())
  const [hasta, setHasta] = useState(hoyISO())
  const [procesandoRango, setProcesandoRango] = useState(false)
 
  const cargarDia = async () => {
    setCargando(true)
    const d = await obtenerDetalleDelDia(fecha)
    setDetalle(d)
    setCargando(false)
  }
 
  useEffect(() => { cargarDia() }, [fecha])
 
  const alternarHorario = async (hora: string) => {
    setAviso('')
    const slot = detalle[hora]
    if (!slot) {
      await bloquearHorario(fecha, hora)
    } else {
      await liberarHorario(fecha, hora)
    }
    await cargarDia()
  }
 
  const aplicarVacaciones = async () => {
    if (desde > hasta) {
      setAviso('La fecha "desde" no puede ser posterior a "hasta".')
      return
    }
    setProcesandoRango(true)
    await bloquearRangoDeVacaciones(desde, hasta)
    setProcesandoRango(false)
    setAviso(`Se bloquearon todos los horarios del ${desde} al ${hasta}.`)
    await cargarDia()
  }
 
  const quitarVacaciones = async () => {
    setProcesandoRango(true)
    await desbloquearRangoDeVacaciones(desde, hasta)
    setProcesandoRango(false)
    setAviso(`Se liberaron los días bloqueados por vacaciones entre el ${desde} y el ${hasta}. (Los turnos ya reservados por clientes no se tocan).`)
    await cargarDia()
  }
 
  return (
    <div className="panel">
      <section className="bloque">
        <h2>Ver / editar un día</h2>
        <input
          type="date"
          className="input-fecha"
          value={fecha}
          onChange={e => setFecha(e.target.value)}
        />
 
        {cargando ? (
          <p className="cargando">Cargando…</p>
        ) : (
          <div className="lista-horarios">
            {HORARIOS.map(hora => {
              const slot = detalle[hora]
              let estado: 'libre' | 'reservado' | 'bloqueado' | 'vacaciones' = 'libre'
              if (slot?.motivo === 'reservado') estado = 'reservado'
              else if (slot?.motivo === 'vacaciones') estado = 'vacaciones'
              else if (slot?.motivo === 'bloqueado') estado = 'bloqueado'
 
              return (
                <div key={hora} className={`fila-horario estado-${estado}`}>
                  <div className="info-horario">
                    <span className="hora">{hora}</span>
                    <span className="etiqueta">
                      {estado === 'libre' && 'Libre'}
                      {estado === 'reservado' && `Reservado — ${slot?.nombreCliente ?? ''}`}
                      {estado === 'vacaciones' && 'Bloqueado (vacaciones)'}
                      {estado === 'bloqueado' && 'Bloqueado manualmente'}
                    </span>
                  </div>
                  <button className="btn-toggle" onClick={() => alternarHorario(hora)}>
                    {estado === 'libre' ? 'Bloquear' : 'Habilitar'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </section>
 
      <section className="bloque">
        <h2>Bloquear varios días (ej: viaje)</h2>
        <div className="rango-fechas">
          <div className="campo">
            <label>Desde</label>
            <input type="date" value={desde} onChange={e => setDesde(e.target.value)} />
          </div>
          <div className="campo">
            <label>Hasta</label>
            <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} />
          </div>
        </div>
        <div className="botones-rango">
          <button className="btn-bloquear-rango" disabled={procesandoRango} onClick={aplicarVacaciones}>
            {procesandoRango ? 'Aplicando…' : 'Bloquear estos días'}
          </button>
          <button className="btn-desbloquear-rango" disabled={procesandoRango} onClick={quitarVacaciones}>
            Habilitar estos días
          </button>
        </div>
        {aviso && <p className="aviso">{aviso}</p>}
      </section>
    </div>
  )
}
 
function AdminPage() {
  const [usuario, setUsuario] = useState<User | null>(null)
  const [cargandoAuth, setCargandoAuth] = useState(true)
 
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUsuario(u)
      setCargandoAuth(false)
    })
    return unsub
  }, [])
 
  if (cargandoAuth) return <p style={{ padding: 24 }}>Cargando…</p>
  if (!usuario) return <AdminLogin />
 
  return (
    <main className="admin-page">
      <header className="admin-header">
        <h1>Panel Éclat</h1>
        <button className="btn-salir" onClick={() => signOut(auth)}>Salir</button>
      </header>
      <PanelDisponibilidad />
    </main>
  )
}
 
export default AdminPage
 






