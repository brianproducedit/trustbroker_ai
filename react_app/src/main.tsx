import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { LicenseManager } from 'ag-grid-enterprise'
import { AG_GRID_LICENSE_KEY } from './lib/agLicense'
import './styles/globals.css'
import App from './app/App'

// AG Studio keys do not license standalone AG Grid Enterprise, so only a dedicated
// AG Grid key is applied here. The Studio key is applied by <AgStudioProvider>.
if (AG_GRID_LICENSE_KEY) {
  LicenseManager.setLicenseKey(AG_GRID_LICENSE_KEY)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
