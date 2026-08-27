import { useEffect, useState } from 'react'
import './ReservaTurno.css'
import { HORARIOS } from './horarios'
import { obtenerHorariosNoDisponibles, reservarTurno, type Genero } from './turnos'
import logo from './logo.jpeg'

interface Servicio {
  id: string
  label: string
  icon: string
}

interface Props {
  genero: Genero
  titulo: string
  servicios: Servicio[]
  whatsappNumero: string
  onVolver?: () => void
}

type Paso = 1 | 2 | 3

const hoyISO = () => new Date().toISOString().slice(0, 10)

function formatearFecha(fechaISO: string) {
  const [y, m, d] = fechaISO.split('-')
  return `${d}/${m}/${y}`
}

function ReservaTurno({ genero, titulo, servicios, whatsappNumero, onVolver }: Props) {
  const [paso, setPaso] = useState<Paso>(1)

  const [fecha, setFecha] = useState(hoyISO())
  const [horariosOcupados, setHorariosOcupados] = useState<string[]>([])
  const [cargandoHorarios, setCargandoHorarios] = useState(true)

  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [edad, setEdad] = useState('')

  const [reservando, setReservando] = useState(false)
  const [error, setError] = useState('')

  const [horaSeleccionada, setHoraSeleccionada] = useState<string | null>(null)
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState<string[]>([])
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false)
  const [pedidoEnviado, setPedidoEnviado] = useState(false)

  // Cada vez que cambia la fecha, recargamos qué horarios están ocupados ese día
  useEffect(() => {
    setCargandoHorarios(true)
    setHoraSeleccionada(null)
    obtenerHorariosNoDisponibles(fecha)
      .then(setHorariosOcupados)
      .catch(() => setError('No se pudo cargar la disponibilidad. Revisá tu conexión.'))
      .finally(() => setCargandoHorarios(false))
  }, [fecha])

  const toggleServicio = (id: string) => {
    setServiciosSeleccionados(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  const nombresServicios = serviciosSeleccionados.map(
    id => servicios.find(s => s.id === id)?.label
  )

  const edadNumero = Number(edad)

  const puedeContinuarPaso1 = serviciosSeleccionados.length > 0
  const puedeContinuarPaso2 = horaSeleccionada !== null
  const puedeReservar =
    nombre.trim().length > 0 &&
    apellido.trim().length > 0 &&
    edad.trim().length > 0 &&
    edadNumero > 0

  const irAtras = () => {
    if (paso > 1) {
      setPaso(prev => (prev - 1) as Paso)
    } else if (onVolver) {
      onVolver()
    }
  }

  const confirmarReserva = async () => {
    if (!horaSeleccionada) return
    setReservando(true)
    setError('')

    const resultado = await reservarTurno({
      fecha,
      hora: horaSeleccionada,
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      edad: edadNumero,
      genero,
      servicios: serviciosSeleccionados,
    })

    setReservando(false)

    if (!resultado.ok) {
      setError(resultado.mensaje ?? 'No se pudo reservar.')
      setMostrarConfirmacion(false)
      // refrescamos la lista porque ese horario ya no está libre
      const actualizados = await obtenerHorariosNoDisponibles(fecha)
      setHorariosOcupados(actualizados)
      setHoraSeleccionada(null)
      setPaso(2)
      return
    }

    const texto =
      `Hola! Quiero reservar un turno (${genero === 'hombre' ? 'Hombres' : 'Mujeres'}).%0A%0A` +
      `Nombre: ${nombre.trim()} ${apellido.trim()}%0A` +
      `Edad: ${edadNumero}%0A` +
      `Fecha: ${formatearFecha(fecha)}%0A` +
      `Horario: ${horaSeleccionada} hs%0A` +
      `Servicios: ${nombresServicios.join(', ')}`

    window.open(`https://wa.me/${whatsappNumero}?text=${texto}`, '_blank')

    setMostrarConfirmacion(false)
    setPedidoEnviado(true)
  }

  return (
    <main className="reserva-turno">
      {(paso > 1 || onVolver) && (
        <button className="btn-volver" onClick={irAtras}>← Volver</button>
      )}

      <h1>
        <img src={logo} alt="Éclat" className="logo-banner" />
        {titulo}
      </h1>

      <div className="pasos-indicador">
        <div className={`paso-dot ${paso >= 1 ? 'activo' : ''}`}>1</div>
        <div className="paso-linea" />
        <div className={`paso-dot ${paso >= 2 ? 'activo' : ''}`}>2</div>
        <div className="paso-linea" />
        <div className={`paso-dot ${paso >= 3 ? 'activo' : ''}`}>3</div>
      </div>

      {/* ===== Paso 1: Servicios ===== */}
      {paso === 1 && (
        <section className="bloque">
          <h2>¿Qué necesitás?</h2>
          <div className="servicios-lista">
            {servicios.map(s => (
              <label key={s.id} className="servicio-check">
                <input
                  type="checkbox"
                  checked={serviciosSeleccionados.includes(s.id)}
                  onChange={() => toggleServicio(s.id)}
                />
                <span className="icono">{s.icon}</span>
                <span>{s.label}</span>
              </label>
            ))}
          </div>
        </section>
      )}

      {/* ===== Paso 2: Fecha y horario ===== */}
      {paso === 2 && (
        <>
          <section className="bloque">
            <h2>Elegí una fecha</h2>
            <input
              type="date"
              className="input-fecha"
              value={fecha}
              min={hoyISO()}
              onChange={e => setFecha(e.target.value)}
            />
          </section>

          <section className="bloque">
            <h2>Elegí un horario</h2>
            {cargandoHorarios ? (
              <p className="cargando">Cargando horarios disponibles…</p>
            ) : (
              <div className="horarios-slider">
                {HORARIOS.map(hora => {
                  const ocupado = horariosOcupados.includes(hora)
                  return (
                    <button
                      key={hora}
                      disabled={ocupado}
                      className={
                        'horario-btn' +
                        (horaSeleccionada === hora ? ' seleccionado' : '') +
                        (ocupado ? ' ocupado' : '')
                      }
                      onClick={() => setHoraSeleccionada(prev => (prev === hora ? null : hora))}
                    >
                      {hora}
                    </button>
                  )
                })}
              </div>
            )}
          </section>
        </>
      )}

      {/* ===== Paso 3: Datos + resumen ===== */}
      {paso === 3 && (
        <>
          <section className="bloque">
            <h2>Tus datos</h2>
            <div className="campo">
              <label htmlFor="nombre">Nombre</label>
              <input id="nombre" type="text" value={nombre} onChange={e => setNombre(e.target.value)} />
            </div>
            <div className="campo">
              <label htmlFor="apellido">Apellido</label>
              <input id="apellido" type="text" value={apellido} onChange={e => setApellido(e.target.value)} />
            </div>
            <div className="campo">
              <label htmlFor="edad">Edad</label>
              <input
                id="edad"
                type="number"
                min={1}
                max={120}
                value={edad}
                onChange={e => setEdad(e.target.value)}
              />
            </div>
          </section>

          <section className="bloque resumen">
            <h2>Tu selección</h2>
            <ul>
              <li>Fecha: {formatearFecha(fecha)}</li>
              <li>Horario: {horaSeleccionada} hs</li>
              {nombresServicios.map(n => <li key={n}>{n}</li>)}
            </ul>
          </section>

          {error && <p className="error">{error}</p>}
        </>
      )}

      {/* ===== Botón inferior fijo ===== */}
      {paso < 3 ? (
        <button
          className="btn-reservar"
          disabled={paso === 1 ? !puedeContinuarPaso1 : !puedeContinuarPaso2}
          onClick={() => setPaso(prev => (prev + 1) as Paso)}
        >
          Continuar
        </button>
      ) : (
        <button
          className="btn-reservar"
          disabled={!puedeReservar}
          onClick={() => setMostrarConfirmacion(true)}
        >
          RESERVAR TURNO
        </button>
      )}

      {mostrarConfirmacion && (
        <div className="modal-fondo">
          <div className="modal-caja">
            <h2>Confirmá tu turno</h2>
            <p>Usted seleccionó:</p>
            <ul>
              <li><b>Nombre:</b> {nombre} {apellido}, {edadNumero} años</li>
              <li><b>Fecha:</b> {formatearFecha(fecha)}</li>
              <li><b>Horario:</b> {horaSeleccionada} hs</li>
              <li><b>Servicios:</b> {nombresServicios.join(', ')}</li>
            </ul>
            <p className="pregunta">¿Está seguro?</p>

            <button className="btn-confirmar" disabled={reservando} onClick={confirmarReserva}>
              {reservando ? 'Reservando…' : 'Sí, reservar por WhatsApp'}
            </button>
            <button className="btn-cancelar" onClick={() => setMostrarConfirmacion(false)}>
              Volver
            </button>
          </div>
        </div>
      )}

      {pedidoEnviado && !mostrarConfirmacion && (
        <p className="pedido-confirmado">
          ¡Listo! Se abrió WhatsApp con tu pedido de turno.
        </p>
      )}
    </main>
  )
}

export default ReservaTurno