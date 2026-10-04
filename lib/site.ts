// Business details shown across the storefront and emails.
export const PICKUP_LOCATION = 'Ayala Alabang, Muntinlupa'
export const INSTAGRAM_URL = 'https://www.instagram.com/lavaca_mnl/'
export const INSTAGRAM_HANDLE = '@lavaca_mnl'

// Public base URL for links in emails. Prefers the configured site URL, then
// Vercel's production domain, then the default deployment domain.
export function siteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (configured && /^https?:\/\//.test(configured)) return configured.replace(/\/$/, '')
  const vercelProd = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()
  if (vercelProd) return `https://${vercelProd}`
  return 'https://lavaca-mnl-app.vercel.app'
}
