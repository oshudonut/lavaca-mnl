'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const NAV_LINKS = [
  { href: '/admin',          label: 'Dashboard', exact: true },
  { href: '/admin/orders',   label: 'Orders' },
  { href: '/admin/calendar', label: 'Calendar' },
  { href: '/admin/settings', label: 'Settings' },
]

export function AdminNav() {
  const pathname = usePathname()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/admin/login'
  }

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      background: '#5C1A1A',
      borderBottom: '1px solid rgba(212,149,74,0.15)',
    }}>
      <div style={{ maxWidth: 1152, margin: '0 auto', padding: '0 24px' }}>
        <div style={{
          display: 'flex',
          height: 56,
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}>

          {/* Brand + nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 28, overflow: 'hidden' }}>
            <Link href="/admin" style={{ textDecoration: 'none', flexShrink: 0 }}>
              <span style={{
                fontFamily: "'Playfair Display SC', serif",
                fontSize: 15,
                fontWeight: 400,
                color: '#FAFAF9',
                letterSpacing: '0.03em',
              }}>
                Lavaca MNL
              </span>
            </Link>

            <nav style={{ display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto' }}>
              {NAV_LINKS.map(({ href, label, exact }) => {
                const isActive = exact ? pathname === href : pathname.startsWith(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: 11,
                      fontWeight: isActive ? 600 : 400,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: isActive ? '#D4954A' : 'rgba(250,250,249,0.6)',
                      textDecoration: 'none',
                      padding: '6px 12px',
                      borderBottom: isActive ? '1px solid #D4954A' : '1px solid transparent',
                      transition: 'color 0.15s',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {label}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 11,
              fontWeight: 400,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'rgba(250,250,249,0.4)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '6px 0',
              flexShrink: 0,
              transition: 'color 0.15s',
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  )
}
