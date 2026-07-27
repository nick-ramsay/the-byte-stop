import { datadogLogs } from '@datadog/browser-logs'
import { datadogRum } from '@datadog/browser-rum'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const {
  VITE_DATADOG_APPLICATION_ID: applicationId,
  VITE_DATADOG_CLIENT_TOKEN: clientToken,
  VITE_DATADOG_SITE: site = 'datadoghq.com',
  VITE_DATADOG_SERVICE: service = 'the-byte-stop',
  VITE_DATADOG_ENV: env = 'sandbox',
  VITE_DATADOG_VERSION: version = '0.0.0',
} = import.meta.env

if (applicationId && clientToken) {
  datadogRum.init({
    applicationId,
    clientToken,
    site,
    service,
    env,
    // Must match the --release-version datadog-ci uploads sourcemaps under
    // (see package.json "sourcemaps:upload"), or RUM can't unminify stacks.
    version,
    sessionSampleRate: 100,
    sessionReplaySampleRate: 100,
    trackUserInteractions: true,
    trackResources: true,
    trackLongTasks: true,
    defaultPrivacyLevel: 'mask-user-input',
    allowedTracingUrls: [(url) => url.startsWith('http://localhost:8000')],
    traceSampleRate: 100,
  })

  datadogLogs.init({
    clientToken,
    site,
    service,
    env,
    version,
    forwardErrorsToLogs: true,
    forwardConsoleLogs: ['error', 'warn'],
    sessionSampleRate: 100,
  })
} else {
  console.warn(
    'Datadog RUM/Logs not initialized — set VITE_DATADOG_APPLICATION_ID and VITE_DATADOG_CLIENT_TOKEN in frontend/.env'
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
