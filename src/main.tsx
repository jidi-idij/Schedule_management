import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router'  // 改为 HashRouter
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>  {/* 不需要 basename */}
      <App />
    </HashRouter>
  </StrictMode>,
)