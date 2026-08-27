import ReservaTurno from './ReservaTurno'

const SERVICIOS_HOMBRES = [
  { id: 'corte', label: 'Corte', icon: '✂️' },
  { id: 'barba', label: 'Barba', icon: '🧔' },
  { id: 'cejas', label: 'Cejas', icon: '👁️' },
  { id: 'tintura', label: 'Tintura', icon: '🎨' },
  { id: 'tratamiento', label: 'Tratamiento capilar', icon: '💆' },
]

const WHATSAPP_NUMERO = '+5493775455862'

interface Props {
  onVolver?: () => void
}

function PaginaHombres({ onVolver }: Props) {
  return (
    <ReservaTurno
      genero="hombre"
      titulo="Turnos · Hombres"
      servicios={SERVICIOS_HOMBRES}
      whatsappNumero={WHATSAPP_NUMERO}
      onVolver={onVolver}
    />
  )
}

export default PaginaHombres
