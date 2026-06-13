'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

export function LogoIntro() {
  const [mounted, setMounted] = useState(false)
  const [gone, setGone] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem('lv-intro')) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      sessionStorage.setItem('lv-intro', '1')
      return
    }
    sessionStorage.setItem('lv-intro', '1')
    setMounted(true)
    const t = setTimeout(() => setGone(true), 3100)
    return () => clearTimeout(t)
  }, [])

  if (!mounted || gone) return null

  return (
    <>
      <style>{`
        @keyframes lv-logo {
          0%    { opacity: 0; transform: scale(0.93); }
          27.6% { opacity: 1; transform: scale(1);    }
          62.1% { opacity: 1; transform: scale(1);    }
          79.3% { opacity: 0; transform: scale(1.04); }
          100%  { opacity: 0; transform: scale(1.04); }
        }
        @keyframes lv-overlay {
          0%    { opacity: 1; }
          72.4% { opacity: 1; }
          96.6% { opacity: 0; }
          100%  { opacity: 0; }
        }
      `}</style>
      <div style={{
        position: 'fixed',
        inset: 0,
        background: '#7B1538',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        animation: 'lv-overlay 2900ms ease-out forwards',
      }}>
        <div style={{ animation: 'lv-logo 2900ms ease-in-out forwards' }}>
          <Image
            src="/lavaca-logo.png"
            alt="Lavaca MNL"
            width={340}
            height={340}
            priority
            style={{ width: 'min(340px, 80vw)', height: 'auto', display: 'block' }}
          />
        </div>
      </div>
    </>
  )
}
