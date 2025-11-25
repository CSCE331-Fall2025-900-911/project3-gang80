import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './App.css'
import App from './App'
import { TranslationProvider } from './contexts/TranslationContext'
import { ContrastModeProvider } from './contexts/ContrastModeContext';
import { MagnifyModeProvider } from './contexts/MagnifyModeContext';

createRoot(document.getElementById('root')!).render(
    <ContrastModeProvider>
        <MagnifyModeProvider>
            <TranslationProvider>
                <App />
            </TranslationProvider>
        </MagnifyModeProvider>
    </ContrastModeProvider>
)
