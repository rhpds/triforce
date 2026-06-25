import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './theme.css'
import { DemoProvider } from './DemoContext.tsx'
import { ModuleProvider } from './ModuleContext.tsx'
import App from './App.tsx'
import { ModulePage } from './pages/ModulePage.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ModuleProvider>
        <DemoProvider>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/modules/:moduleName" element={<ModulePage />} />
          </Routes>
        </DemoProvider>
      </ModuleProvider>
    </BrowserRouter>
  </StrictMode>,
)
