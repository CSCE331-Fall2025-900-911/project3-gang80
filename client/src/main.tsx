import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './App.css'
import App from './App'
import { ContrastModeProvider } from './contexts/ContrastModeContext';

createRoot(document.getElementById('root')!).render(
    <ContrastModeProvider>
        <App />
    </ContrastModeProvider>
    
)
