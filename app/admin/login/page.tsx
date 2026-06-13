'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null)
  const [backHovered, setBackHovered] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError('Invalid email or password.')
        return
      }

      router.push('/admin')
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{
      position: 'relative',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0C0A09',
      overflow: 'hidden',
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Background photo with heavy dark overlay */}
      <Image
        src="/photo-hero.png"
        alt=""
        fill
        aria-hidden
        priority
        style={{ objectFit: 'cover', objectPosition: 'center 30%' }}
      />
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(8,4,2,0.88)',
        zIndex: 1,
      }} />

      {/* Login card */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        width: '100%',
        maxWidth: 380,
        margin: '0 auto',
        padding: '0 20px',
      }}>
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #D6D3D1',
          padding: '40px 36px',
        }}>
          {/* Brand header */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{
              width: 36,
              height: 1,
              background: '#A16207',
              margin: '0 auto 16px',
            }} />
            <p style={{
              fontFamily: "'Jost', sans-serif",
              fontSize: 9,
              fontWeight: 400,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: '#A16207',
              margin: '0 0 10px',
            }}>
              Admin Portal
            </p>
            <h1 style={{
              fontFamily: "'Playfair Display SC', serif",
              fontSize: 24,
              fontWeight: 400,
              color: '#1C1917',
              margin: 0,
              letterSpacing: '0.02em',
            }}>
              Lavaca MNL
            </h1>
          </div>

          {/* Divider */}
          <div style={{
            width: '100%',
            height: 1,
            background: 'rgba(161,98,7,0.15)',
            margin: '0 0 28px',
          }} />

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: 20 }}>
              <label
                htmlFor="email"
                style={{
                  display: 'block',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: '#1C1917',
                  marginBottom: 8,
                }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                style={{
                  width: '100%',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 14,
                  color: '#1C1917',
                  background: '#FAFAF9',
                  border: `1px solid ${error && !email ? '#DC2626' : focusedField === 'email' ? '#A16207' : '#D6D3D1'}`,
                  padding: '12px 14px',
                  outline: 'none',
                  borderRadius: 0,
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 24 }}>
              <label
                htmlFor="password"
                style={{
                  display: 'block',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: '#1C1917',
                  marginBottom: 8,
                }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                style={{
                  width: '100%',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 14,
                  color: '#1C1917',
                  background: '#FAFAF9',
                  border: `1px solid ${error && !password ? '#DC2626' : focusedField === 'password' ? '#A16207' : '#D6D3D1'}`,
                  padding: '12px 14px',
                  outline: 'none',
                  borderRadius: 0,
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
              />
            </div>

            {/* Error */}
            {error && (
              <p style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 12,
                color: '#DC2626',
                textAlign: 'center',
                margin: '0 0 16px',
              }}>
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                fontFamily: "'Inter', sans-serif",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                background: isLoading ? '#D6D3D1' : '#A16207',
                color: isLoading ? '#8C7B6B' : '#FFFFFF',
                border: 'none',
                padding: '16px 0',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
                borderRadius: 0,
              }}
            >
              {isLoading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Back to site link */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <a
            href="/"
            onMouseEnter={() => setBackHovered(true)}
            onMouseLeave={() => setBackHovered(false)}
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 11,
              color: backHovered ? 'rgba(250,250,249,0.65)' : 'rgba(250,250,249,0.35)',
              textDecoration: 'none',
              letterSpacing: '0.1em',
              transition: 'color 0.2s',
            }}
          >
            ← Back to site
          </a>
        </div>
      </div>
    </div>
  )
}
