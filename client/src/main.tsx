import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './App.css'
import App from './App'
import { TranslationProvider } from './contexts/TranslationContext'
import { ContrastModeProvider } from './contexts/ContrastModeContext';

createRoot(document.getElementById('root')!).render(
    <ContrastModeProvider>
        <TranslationProvider>
            <App />
        </TranslationProvider>
    </ContrastModeProvider>
)
