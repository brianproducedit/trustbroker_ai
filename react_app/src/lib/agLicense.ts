/**
 * AG Studio / AG Grid license configuration.
 *
 * Licensing rules (https://www.ag-grid.com/studio/react/enterprise-licence/):
 *   - An AG STUDIO license covers AG Studio and its built-in grid/chart widgets ONLY.
 *   - It does NOT license standalone AG Grid Enterprise / AG Charts Enterprise.
 *   - Standalone enterprise grids need a separate AG Grid license.
 *
 * So the two keys stay separate:
 *   - VITE_AG_STUDIO_LICENSE_KEY -> passed to <AgStudioProvider licenseKey>
 *   - VITE_AG_GRID_LICENSE_KEY   -> optional; enables AG Grid Enterprise for the ledgers
 *
 * Keys are supplied via environment variables so they are never committed to git
 * (see react_app/.env.example). Vite inlines them into the client bundle at build time.
 */
const rawStudioKey = (import.meta.env.VITE_AG_STUDIO_LICENSE_KEY ?? '').trim()
const rawGridKey = (import.meta.env.VITE_AG_GRID_LICENSE_KEY ?? '').trim()

function isUsableKey(key: string): boolean {
  return key.length > 0 && !key.startsWith('YOUR_') && key !== 'undefined'
}

/** AG Studio trial/enterprise key (STUDIO-* license type). */
export const AG_STUDIO_LICENSE_KEY = isUsableKey(rawStudioKey) ? rawStudioKey : undefined

/** Separate AG Grid Enterprise key (GRID / CHARTS / BOTH license type). Optional. */
export const AG_GRID_LICENSE_KEY = isUsableKey(rawGridKey) ? rawGridKey : undefined

/** True when an AG Studio key is configured, so Studio renders without a watermark. */
export const HAS_STUDIO_LICENSE = AG_STUDIO_LICENSE_KEY !== undefined

/**
 * True when a standalone AG Grid Enterprise key is configured.
 * Without it the ledgers run on AG Grid Community (free, no watermark, no license needed).
 */
export const HAS_GRID_ENTERPRISE_LICENSE = AG_GRID_LICENSE_KEY !== undefined
