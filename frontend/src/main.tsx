import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './theme.css'
import { DemoProvider } from './DemoContext.tsx'
import { ModuleProvider } from './ModuleContext.tsx'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ModuleProvider>
      <DemoProvider>
        <App />
      </DemoProvider>
    </ModuleProvider>
  </StrictMode>,
)
