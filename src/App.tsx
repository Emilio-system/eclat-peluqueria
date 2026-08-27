import { useState } from 'react'
import './App.css'
import PaginaHombres from './PaginaHombres'
import PaginaMujeres from './PaginaMujeres'
import AdminPage from './AdminPage'
import logo from './logo.jpeg'

// URL secreta del panel de administración (no la compartas públicamente)
const RUTA_ADMIN = '/panel-eclat-admin'

function App() {
  const [mostrarGenero, setMostrarGenero] = useState(false)
  const [pagina, setPagina] = useState<'inicio' | 'hombres' | 'mujeres'>('inicio')

  if (window.location.pathname === RUTA_ADMIN) {
    return <AdminPage />
  }

  if (pagina === 'hombres') {
    return <PaginaHombres onVolver={() => setPagina('inicio')} />
  }
  if (pagina === 'mujeres') {
    return <PaginaMujeres onVolver={() => setPagina('inicio')} />
  }

  return (
    <main>
      <section className="hero">
        <div className="logo">
          <img src={logo} alt="Éclat" />
        </div>

       
       
        

        <button className="mi" onClick={() => setMostrarGenero(true)}>
          RESERVAR TURNO
        </button>

        <p className="presentacion">
          Cortes, color y tratamientos para vos.
        </p>
      </section>

      <section className="servicios">
        <h2>Nuestros servicios</h2>

        <div className="servicio">
          <span>✂️</span>
          <div>
            <h3>Cortes</h3>
            <p>Estilo y cuidado para hombre y mujer.</p>
          </div>
        </div>

        <div className="servicio">
          <span>🎨</span>
          <div>
            <h3>Color</h3>
            <p>Coloración y diferentes técnicas.</p>
          </div>
        </div>

        <div className="servicio">
          <span>💆</span>
          <div>
            <h3>Tratamientos</h3>
            <p>Cuidado y recuperación del cabello.</p>
          </div>
        </div>
      </section>

      {mostrarGenero && (
        <section className="seleccion-genero">
          <div className="ventana-genero">
            <h2>¿Qué servicio buscás?</h2>

            <button onClick={() => setPagina('hombres')}>👨 Hombre</button>

            <button onClick={() => setPagina('mujeres')}>👩 Mujer</button>

            <button
              className="cerrar"
              onClick={() => setMostrarGenero(false)}
            >
              Volver
            </button>
          </div>
        </section>
      )}
    </main>
  )
}

export default App
