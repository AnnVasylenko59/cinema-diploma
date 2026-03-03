import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from "@sentry/react"
import './i18n.js'
import './index.css'
import App from './App.jsx'

Sentry.init({
    dsn: "https://525ade155e88d84649977c7aac626949@o4510976229703680.ingest.de.sentry.io/4510976231997520",
    integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration(),
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
});

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <App />
    </StrictMode>,
)