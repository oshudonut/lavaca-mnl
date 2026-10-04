// Shared by the order form (client) and order creation (server) so both
// enforce the same formats.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim())
}

/**
 * Philippine mobile number -> "+639XXXXXXXXX", or null if invalid.
 * Accepts 09XXXXXXXXX, 9XXXXXXXXX, 639XXXXXXXXX, +639XXXXXXXXX,
 * with optional spaces, dashes or dots.
 */
export function normalizePhone(phone: string): string | null {
  const digits = phone.replace(/[\s\-().]/g, '').replace(/^\+/, '')
  const m = digits.match(/^(?:63|0)?(9\d{9})$/)
  return m ? `+63${m[1]}` : null
}

/** Philippine ZIP codes are 4 digits. */
export function isValidZip(zip: string): boolean {
  return /^\d{4}$/.test(zip.trim())
}

/** "@lavaca_mnl", "lavaca_mnl" or an instagram.com URL -> "lavaca_mnl" */
export function normalizeInstagram(handle: string): string {
  return handle
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .replace(/^@/, '')
    .replace(/\/.*$/, '')
}

export const SERVING_STYLES = ['warm', 'frozen'] as const
export type ServingStyle = (typeof SERVING_STYLES)[number]

export const SERVING_STYLE_OPTIONS: { value: ServingStyle; label: string; description: string }[] = [
  { value: 'warm', label: 'Ready to Serve', description: 'Heated and ready to serve upon pickup' },
  { value: 'frozen', label: 'Frozen for Later', description: 'Vacuum-packed and frozen, with reheating instructions' },
]

export function servingStyleLabel(style: string | null | undefined): string {
  return SERVING_STYLE_OPTIONS.find((o) => o.value === style)?.label ?? ''
}
