'use client'

import Image from 'next/image'
import Link from 'next/link'

const BURGUNDY = '#5C1A1A'
const WARM_DARK = '#1A1410'
const GOLD = '#A16207'
const CREAM = '#FAF7F2'

export default function HomePage() {
  return (
    <div style={{ fontFamily: "'Jost', sans-serif", backgroundColor: WARM_DARK }}>

      {/* ── 1. NAV ── */}
      <header className="sticky top-0 z-50" style={{ backgroundColor: BURGUNDY, height: 68 }}>
        <div className="mx-auto max-w-[1200px] px-6 h-full flex items-center justify-between">
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, color: '#fff', letterSpacing: '0.04em' }}>
            Lavaca MNL
          </span>
          <nav className="hidden md:flex items-center gap-8">
            {['The Menu', 'Our Story', 'How It Works', 'Delivery'].map((label) => (
              <a key={label} href={`#${label.toLowerCase().replace(/\s+/g, '-')}`}
                style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 400, letterSpacing: '0.06em', textDecoration: 'none' }}
                className="hover:text-white transition-colors">
                {label}
              </a>
            ))}
          </nav>
          <Link href="/order"
            style={{ backgroundColor: GOLD, color: '#fff', padding: '10px 22px', borderRadius: 6, fontSize: 13, fontWeight: 600, letterSpacing: '0.06em', textDecoration: 'none' }}>
            Order Now
          </Link>
        </div>
      </header>

      {/* ── 2. HERO ── */}
      <section style={{ position: 'relative', height: '100vh', minHeight: 620, overflow: 'hidden' }}>
        <Image src="/photo-hero.png" alt="Lavaca MNL — Premium Angus Roast Beef" fill
          style={{ objectFit: 'cover', objectPosition: 'center 30%' }} priority />
        {/* Dark gradient overlay */}
        <div style={{ position: 'absolute', inset: 0,
          background: 'linear-gradient(90deg, rgba(10,5,3,0.90) 0%, rgba(10,5,3,0.55) 50%, rgba(10,5,3,0.18) 100%)' }} />
        {/* Text — bottom left */}
        <div style={{ position: 'absolute', bottom: 72, left: 0, right: 0 }}>
          <div className="mx-auto max-w-[1200px] px-6">
            <p style={{ color: GOLD, fontSize: 11, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 16, fontFamily: "'Jost', sans-serif" }}>
              Slow-Cooked · 100% Angus · Metro Manila
            </p>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(52px, 8vw, 92px)', fontWeight: 600, color: '#fff', lineHeight: 1.05, marginBottom: 20, maxWidth: 680 }}>
              Premium Angus<br />Roast Beef.
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, fontWeight: 300, letterSpacing: '0.04em', marginBottom: 36, maxWidth: 480, lineHeight: 1.7, fontFamily: "'Jost', sans-serif" }}>
              Slow-Cooked for 25 Hours. Crafted for Gatherings.<br />Delivered Across Metro Manila.
            </p>
            <div className="flex items-center gap-4">
              <Link href="/order"
                style={{ backgroundColor: GOLD, color: '#fff', padding: '14px 32px', borderRadius: 6, fontSize: 14, fontWeight: 600, letterSpacing: '0.08em', textDecoration: 'none', display: 'inline-block' }}>
                Order Now
              </Link>
              <a href="#the-menu"
                style={{ color: '#fff', fontSize: 14, fontWeight: 400, letterSpacing: '0.06em', textDecoration: 'none', borderBottom: `1px solid ${GOLD}`, paddingBottom: 2 }}>
                View Products
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. TRUST BAR ── */}
      <section style={{ backgroundColor: WARM_DARK, borderTop: `1px solid rgba(161,98,7,0.2)`, borderBottom: `1px solid rgba(161,98,7,0.2)` }}>
        <div className="mx-auto max-w-[1200px] px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
            {[
              { stat: '25', label: 'Hours Slow-Cooked' },
              { stat: '100%', label: 'Angus Beef' },
              { stat: '3', label: 'Sizes Available' },
              { stat: '48h', label: 'Advance Order' },
            ].map(({ stat, label }, i) => (
              <div key={stat} className="flex flex-col items-center py-6"
                style={{ borderRight: i < 3 ? '1px solid rgba(161,98,7,0.2)' : 'none' }}>
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 38, fontWeight: 600, color: GOLD, lineHeight: 1 }}>
                  {stat}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 6, fontFamily: "'Jost', sans-serif" }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. PRODUCTS ── */}
      <section id="the-menu" style={{ backgroundColor: CREAM, padding: '96px 0' }}>
        <div className="mx-auto max-w-[1200px] px-6">
          <p style={{ color: GOLD, fontSize: 11, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 12, textAlign: 'center', fontFamily: "'Jost', sans-serif" }}>
            The Menu
          </p>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(36px,5vw,56px)', fontWeight: 600, color: WARM_DARK, textAlign: 'center', marginBottom: 56 }}>
            Choose Your Cut
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { img: '/photo-topdown.png', name: 'Angus Roast Beef', size: '100g · Solo Serving', price: '₱350' },
              { img: '/photo-slices.png', name: 'Angus Roast Beef', size: '1kg · Serves 4–6', price: '₱3,000' },
              { img: '/photo-slices.png', name: 'Angus Roast Beef', size: '1.5kg · Serves 6–9', price: '₱4,000' },
            ].map(({ img, name, size, price }) => (
              <div key={size} className="product-card" style={{ backgroundColor: '#fff', overflow: 'hidden', cursor: 'pointer' }}>
                <div style={{ height: 300, position: 'relative', overflow: 'hidden' }}>
                  <Image src={img} alt={name} fill style={{ objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '24px 24px 28px' }}>
                  <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, fontWeight: 500, color: 'rgba(28,25,23,0.5)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>
                    {size}
                  </p>
                  <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, color: WARM_DARK, marginBottom: 8 }}>
                    {name}
                  </p>
                  <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 34, fontWeight: 600, color: BURGUNDY }}>
                    {price}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-12">
            <Link href="/order"
              style={{ backgroundColor: BURGUNDY, color: '#fff', padding: '14px 40px', borderRadius: 6, fontSize: 14, fontWeight: 600, letterSpacing: '0.08em', textDecoration: 'none' }}>
              Order Now
            </Link>
          </div>
        </div>
      </section>

      {/* ── 5. CRAFT SECTION ── */}
      <section id="our-story" style={{ backgroundColor: BURGUNDY, overflow: 'hidden' }}>
        <div className="mx-auto max-w-[1200px] grid grid-cols-1 md:grid-cols-2">
          <div style={{ position: 'relative', minHeight: 480 }}>
            <Image src="/photo-craft.png" alt="The Craft" fill style={{ objectFit: 'cover' }} />
          </div>
          <div style={{ padding: 'clamp(48px,8vw,96px) clamp(32px,6vw,72px)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 16, fontFamily: "'Jost', sans-serif" }}>
              Our Story
            </p>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(36px,4vw,52px)', fontWeight: 600, color: '#fff', lineHeight: 1.15, marginBottom: 24 }}>
              Slow-Cooked<br />for 25 Hours.
            </h2>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontStyle: 'italic', color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, marginBottom: 20 }}>
              "Every cut is prepared the same way it always has been — low heat, patience, and nothing to hide behind."
            </p>
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 14, fontWeight: 300, color: 'rgba(255,255,255,0.65)', lineHeight: 1.8 }}>
              We use 100% Angus beef, slow-cooked for 25 hours until the fat renders and the grain opens. No shortcuts. No fillers. Just beef, salt, and time — ready to serve at your next gathering.
            </p>
          </div>
        </div>
      </section>

      {/* ── 6. HOW IT WORKS ── */}
      <section id="how-it-works" style={{ backgroundColor: CREAM, padding: '96px 0' }}>
        <div className="mx-auto max-w-[1200px] px-6">
          <p style={{ color: GOLD, fontSize: 11, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 12, textAlign: 'center', fontFamily: "'Jost', sans-serif" }}>
            How It Works
          </p>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(36px,5vw,52px)', fontWeight: 600, color: WARM_DARK, textAlign: 'center', marginBottom: 64 }}>
            Three Simple Steps
          </h2>
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Connecting gold line (desktop only) */}
            <div className="hidden md:block absolute top-8 left-[calc(16.67%+16px)] right-[calc(16.67%+16px)] h-px" style={{ backgroundColor: GOLD, opacity: 0.3 }} />
            {[
              { num: '01', label: 'Choose Your Cut', desc: 'Select from our 100g, 1kg, or 1.5kg options. Each one slow-cooked the same way.' },
              { num: '02', label: 'Pick Your Delivery Slot', desc: 'Choose your preferred date and time window. We deliver across Metro Manila.' },
              { num: '03', label: 'Pay & Confirm', desc: 'Send payment via GCash or bank transfer. We confirm your order within the hour.' },
            ].map(({ num, label, desc }) => (
              <div key={num} className="flex flex-col items-center text-center">
                <div style={{ width: 56, height: 56, borderRadius: '50%', border: `1px solid ${GOLD}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, backgroundColor: CREAM, position: 'relative', zIndex: 1 }}>
                  <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, color: GOLD }}>{num}</span>
                </div>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 600, color: WARM_DARK, marginBottom: 12 }}>{label}</h3>
                <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 14, fontWeight: 300, color: 'rgba(28,25,23,0.65)', lineHeight: 1.7 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. GALLERY ── */}
      <section style={{ backgroundColor: WARM_DARK, padding: '4px' }}>
        <div className="grid grid-cols-2 gap-1">
          {[
            { img: '/photo-hero.png', caption: 'The Carve' },
            { img: '/photo-craft.png', caption: 'The Craft' },
            { img: '/photo-slices.png', caption: 'The Cut' },
            { img: '/photo-topdown.png', caption: 'The Product' },
          ].map(({ img, caption }) => (
            <div key={caption} className="relative overflow-hidden group" style={{ aspectRatio: '1/1' }}>
              <Image src={img} alt={caption} fill style={{ objectFit: 'cover', transition: 'transform 500ms ease' }}
                className="group-hover:scale-105" />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,5,3,0.7) 0%, transparent 50%)' }} />
              <span style={{ position: 'absolute', bottom: 16, left: 20, color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 300, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'Jost', sans-serif" }}>
                {caption}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── 8. ORDER CTA ── */}
      <section style={{ backgroundColor: BURGUNDY, padding: '96px 24px', textAlign: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 16, fontFamily: "'Jost', sans-serif" }}>
          Ready to Order?
        </p>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(40px,6vw,68px)', fontWeight: 600, color: '#fff', marginBottom: 32 }}>
          Reserve Your Delivery.
        </h2>
        <Link href="/order"
          style={{ backgroundColor: GOLD, color: '#fff', padding: '16px 48px', borderRadius: 6, fontSize: 15, fontWeight: 600, letterSpacing: '0.08em', textDecoration: 'none', display: 'inline-block', marginBottom: 24 }}>
          Order Now
        </Link>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, fontFamily: "'Jost', sans-serif" }}>
          Questions? Message us on Messenger
        </p>
      </section>

      {/* ── 9. DELIVERY INFO BAR ── */}
      <section id="delivery" style={{ backgroundColor: WARM_DARK, borderTop: '1px solid rgba(161,98,7,0.15)' }}>
        <div className="mx-auto max-w-[1200px] px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { label: 'Coverage', value: 'Metro Manila' },
              { label: 'Schedule', value: 'Tue – Sun' },
              { label: 'Lead Time', value: '48h Advance' },
              { label: 'Payment', value: 'GCash · BPI · BDO' },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col gap-1">
                <span style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  {label}
                </span>
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 500, color: 'rgba(255,255,255,0.85)' }}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  )
}
