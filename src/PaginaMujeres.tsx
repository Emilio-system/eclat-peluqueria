import ReservaTurno from './ReservaTurno'

const SERVICIOS_MUJERES = [
  { id: 'corte', label: 'Corte', icon: '✂️' },
  { id: 'alisado', label: 'Alisado', icon: '💇‍♀️' },
  { id: 'nutricion', label: 'Nutrición', icon: '💆‍♀️' },
  { id: 'cejas', label: 'Cejas', icon: '👁️' },
  { id: 'tintura', label: 'Tintura', icon: '🎨' },
  { id: 'tratamiento', label: 'Tratamiento capilar', icon: '💆‍♀️' },
]

const WHATSAPP_NUMERO = '+5493775530323'

interface Props {
  onVolver?: () => void
}

function PaginaMujeres({ onVolver }: Props) {
  return (
    <ReservaTurno
      genero="mujer"
      titulo="Turnos · Mujeres"
      servicios={SERVICIOS_MUJERES}
      whatsappNumero={WHATSAPP_NUMERO}
      onVolver={onVolver}
    />
  )
}

export default PaginaMujeres
  
