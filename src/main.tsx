import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import './App.css'

createRoot(document.getElementById('root')!).render(
const container = document.getElementById('root')

if (container) {
  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>
  )
} else {
  console.error("No se encontró el elemento con id 'root' en el DOM.")
}
