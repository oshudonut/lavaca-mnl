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
      <div style={{ maxWidth: 1152, margin: '0 auto', padding: '0 20px' }}>

        {/* Top row: brand + sign out */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 44,
        }}>
          <Link href="/admin" style={{ textDecoration: 'none' }}>
            <span style={{
              fontFamily: "'Playfair Display SC', serif",
              fontSize: 14,
              fontWeight: 400,
              color: '#FAFAF9',
              letterSpacing: '0.03em',
            }}>
              Lavaca MNL
            </span>
          </Link>

          <button
            onClick={handleSignOut}
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 10,
              fontWeight: 400,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'rgba(250,250,249,0.4)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              transition: 'color 0.15s',
            }}
          >
            Sign Out
          </button>
        </div>

        {/* Bottom row: nav links (scrollable) */}
        <div style={{
          display: 'flex',
          overflowX: 'auto',
          borderTop: '1px solid rgba(212,149,74,0.1)',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        } as React.CSSProperties}>
          {NAV_LINKS.map(({ href, label, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 10,
                  fontWeight: isActive ? 600 : 400,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: isActive ? '#D4954A' : 'rgba(250,250,249,0.55)',
                  textDecoration: 'none',
                  padding: '10px 14px',
                  borderBottom: isActive ? '2px solid #D4954A' : '2px solid transparent',
                  transition: 'color 0.15s',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {label}
              </Link>
            )
          })}
        </div>

      </div>
    </header>
  )
}
