import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './App.css'
import App from './App'
import { TranslationProvider } from './contexts/TranslationContext'

createRoot(document.getElementById('root')!).render(
        <TranslationProvider>
            <App />
        </TranslationProvider>
)
