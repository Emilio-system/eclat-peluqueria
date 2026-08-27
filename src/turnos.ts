import {
  collection, doc, getDocs, query, where,
  runTransaction, deleteDoc, setDoc, Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import { HORARIOS } from './horarios'

export type Genero = 'hombre' | 'mujer'
export type Motivo = 'reservado' | 'vacaciones' | 'bloqueado'

export interface DatosReserva {
  fecha: string // 'YYYY-MM-DD'
  hora: string  // '9:00'
  nombre: string
  apellido: string
  edad: number
  genero: Genero
  servicios: string[]
}

export interface SlotInfo {
  hora: string
  motivo: Motivo
  nombreCliente?: string
}

const idSlot = (fecha: string, hora: string) => `${fecha}_${hora}`

/** Trae los horarios NO disponibles (reservados, de vacaciones, o bloqueados) de un día */
export async function obtenerHorariosNoDisponibles(fecha: string): Promise<string[]> {
  const q = query(collection(db, 'bloqueos'), where('fecha', '==', fecha))
  const snap = await getDocs(q)
  return snap.docs.map(d => d.data().hora as string)
}

/** Trae el detalle completo (motivo, nombre del cliente si aplica) de los horarios ocupados de un día — para el panel admin */
export async function obtenerDetalleDelDia(fecha: string): Promise<Record<string, SlotInfo>> {
  const q = query(collection(db, 'bloqueos'), where('fecha', '==', fecha))
  const snap = await getDocs(q)
  const detalle: Record<string, SlotInfo> = {}
  snap.docs.forEach(d => {
    const data = d.data() as SlotInfo
    detalle[data.hora] = data
  })
  return detalle
}

/**
 * Reserva un turno de forma segura: si dos personas tocan "reservar" para el
 * mismo horario casi al mismo tiempo, sólo una de las dos operaciones gana.
 */
export async function reservarTurno(
  datos: DatosReserva
): Promise<{ ok: boolean; mensaje?: string }> {
  const slotRef = doc(db, 'bloqueos', idSlot(datos.fecha, datos.hora))
  try {
    await runTransaction(db, async (tx) => {
      const slotSnap = await tx.get(slotRef)
      if (slotSnap.exists()) {
        throw new Error('OCUPADO')
      }
      const turnoRef = doc(collection(db, 'turnos'))
      tx.set(turnoRef, { ...datos, creado: Timestamp.now() })
      tx.set(slotRef, {
        fecha: datos.fecha,
        hora: datos.hora,
        motivo: 'reservado' as Motivo,
        nombreCliente: `${datos.nombre} ${datos.apellido}`,
        turnoId: turnoRef.id,
      })
    })
    return { ok: true }
  } catch (e) {
    if (e instanceof Error && e.message === 'OCUPADO') {
      return { ok: false, mensaje: 'Ese horario ya fue reservado por otra persona. Elegí otro.' }
    }
    return { ok: false, mensaje: 'Hubo un error al reservar. Probá de nuevo.' }
  }
}

// ================= Funciones para el panel de administración =================

/** Bloquea manualmente un horario suelto (ej: alguien avisó por teléfono) */
export async function bloquearHorario(fecha: string, hora: string) {
  await setDoc(doc(db, 'bloqueos', idSlot(fecha, hora)), {
    fecha, hora, motivo: 'bloqueado' as Motivo,
  })
}

/** Libera un horario (cancelación, o admin lo vuelve a habilitar) */
export async function liberarHorario(fecha: string, hora: string) {
  await deleteDoc(doc(db, 'bloqueos', idSlot(fecha, hora)))
}

function generarFechasEntre(inicio: string, fin: string): string[] {
  const fechas: string[] = []
  const actual = new Date(inicio + 'T00:00:00')
  const final = new Date(fin + 'T00:00:00')
  while (actual <= final) {
    fechas.push(actual.toISOString().slice(0, 10))
    actual.setDate(actual.getDate() + 1)
  }
  return fechas
}

/** Bloquea TODOS los horarios de un rango de días (ej: vacaciones / viaje) */
export async function bloquearRangoDeVacaciones(fechaInicio: string, fechaFin: string) {
  const fechas = generarFechasEntre(fechaInicio, fechaFin)
  for (const fecha of fechas) {
    for (const hora of HORARIOS) {
      await setDoc(doc(db, 'bloqueos', idSlot(fecha, hora)), {
        fecha, hora, motivo: 'vacaciones' as Motivo,
      })
    }
  }
}

/** Vuelve a habilitar un rango de días que estaba bloqueado por vacaciones (no toca los que están reservados de verdad) */
export async function desbloquearRangoDeVacaciones(fechaInicio: string, fechaFin: string) {
  const fechas = generarFechasEntre(fechaInicio, fechaFin)
  for (const fecha of fechas) {
    const q = query(
      collection(db, 'bloqueos'),
      where('fecha', '==', fecha),
      where('motivo', '==', 'vacaciones')
    )
    const snap = await getDocs(q)
    for (const d of snap.docs) {
      await deleteDoc(d.ref)
    }
  }
}
