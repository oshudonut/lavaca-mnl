'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const NAV_LINKS = [
  { href: '/admin',          label: 'Dashboard', exact: true },
  { href: '/admin/orders',   label: 'Orders' },
  { href: '/admin/products', label: 'Products' },
  { href: '/admin/calendar', label: 'Calendar' },
  { href: '/admin/settings', label: 'Settings' },
]

export function AdminNav({ reviewCount }: { reviewCount: number }) {
  const pathname = usePathname()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/admin/login'
  }

  return (
    <header className="adm-nav">
      <div className="adm-nav-inner">
        <Link href="/admin" className="adm-brand">
          LAVACA<small>ADMIN</small>
        </Link>
        <nav className="adm-nav-links" aria-label="Admin sections">
          {NAV_LINKS.map(({ href, label, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`adm-nav-link${isActive ? ' is-active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
              >
                {label}
                {href === '/admin/orders' && reviewCount > 0 && (
                  <span className="adm-nav-count" aria-label={`${reviewCount} to review`}>
                    {reviewCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
        <button type="button" onClick={handleSignOut} className="adm-signout">
          Sign out
        </button>
      </div>
    </header>
  )
}
