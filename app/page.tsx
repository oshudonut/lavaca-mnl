'use client'

import Image from 'next/image'
import Link from 'next/link'

const PRODUCTS = [
  {
    sku: 'LV-100',
    name: 'Angus Roast Beef',
    weight: '100g · Solo Serving',
    price: '₱350',
    occasion: 'Perfect for date nights and personal indulgence. The ideal introduction to Lavaca MNL.',
    photo: '/photo-topdown.png',
    photoPos: 'center 40%',
  },
  {
    sku: 'LV-1000',
    name: 'Angus Roast Beef',
    weight: '1kg · Serves 4–6',
    price: '₱3,000',
    occasion: 'The family dinner cut. Enough for a full table, worthy of a celebration.',
    photo: '/photo-slices.png',
    photoPos: 'center 40%',
  },
  {
    sku: 'LV-1500',
    name: 'Angus Roast Beef',
    weight: '1.5kg · Serves 6–9',
    price: '₱4,000',
    occasion: 'Built for gatherings. The centrepiece your guests will remember long after the table is cleared.',
    photo: '/photo-slices.png',
    photoPos: 'center 60%',
  },
]

const TRUST = [
  { num: '25',   l1: 'Hours',           l2: 'Slow-Cooked'  },
  { num: '100%', l1: 'Premium',         l2: 'Angus Beef'   },
  { num: '3',    l1: 'Sizes for Every', l2: 'Occasion'     },
  { num: '48h',  l1: 'Advance Order',   l2: 'Metro Manila' },
]

const STEPS = [
  {
    num: '1',
    title: 'Choose Your Cut',
    desc: 'Browse the menu and select the size that fits your occasion — a solo treat, a family dinner, or a celebration feast.',
  },
  {
    num: '2',
    title: 'Pick Your Delivery Slot',
    desc: 'Select a delivery date and time window that works for you. Available Tuesday through Sunday across Metro Manila.',
  },
  {
    num: '3',
    title: 'Pay & Confirm',
    desc: 'Pay via GCash or bank transfer. We confirm your order within hours and handle everything from there.',
  },
]

const GALLERY = [
  { src: '/photo-hero.png',    caption: 'The Carve'   },
  { src: '/photo-craft.png',   caption: 'The Craft'   },
  { src: '/photo-slices.png',  caption: 'The Cut'     },
  { src: '/photo-topdown.png', caption: 'The Product' },
]

const DELIVERY = [
  { icon: 'pin',      strong: 'Alabang & South Metro Manila', sub: 'Muntinlupa · Las Piñas · Parañaque'     },
  { icon: 'calendar', strong: 'Tuesday – Sunday',             sub: 'AM 9AM–12PM · PM 1PM–5PM'               },
  { icon: 'clock',    strong: '48 Hours Advance',             sub: 'Order at least 2 days before delivery'  },
  { icon: 'card',     strong: 'GCash & Bank Transfer',        sub: 'BPI · BDO'                              },
]

function DeliveryIcon({ name }: { name: string }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: '#A16207',
    strokeWidth: 1.25,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }
  switch (name) {
    case 'pin':
      return (
        <svg {...common}>
          <path d="M12 21s-7-5.5-7-11a7 7 0 1 1 14 0c0 5.5-7 11-7 11Z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
      )
    case 'calendar':
      return (
        <svg {...common}>
          <rect x="3.5" y="5" width="17" height="16" rx="1.5" />
          <path d="M3.5 9.5h17M8 2.5V6M16 2.5V6" />
        </svg>
      )
    case 'clock':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7.5V12l3 2" />
        </svg>
      )
    case 'card':
      return (
        <svg {...common}>
          <rect x="2.5" y="5.5" width="19" height="13.5" rx="1.5" />
          <path d="M2.5 9.5h19M6 15h4" />
        </svg>
      )
    default:
      return null
  }
}

export default function HomePage() {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: '#0C0A09' }}>

      {/* ── NAV ── */}
      <nav className="lv-nav">
        <div className="lv-nav-inner">
          <Image src="/lavaca-logo.png" alt="Lavaca MNL" width={120} height={34} style={{ height: 34, width: 'auto' }} priority />
          <div className="lv-nav-links">
            <button onClick={() => scrollTo('products-section')} className="lv-nav-link">The Menu</button>
            <button onClick={() => scrollTo('craft-section')} className="lv-nav-link">Our Story</button>
            <button onClick={() => scrollTo('process-section')} className="lv-nav-link">How It Works</button>
            <button onClick={() => scrollTo('delivery-section')} className="lv-nav-link">Delivery</button>
          </div>
          <Link href="/order" className="lv-nav-cta">Order Now</Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="lv-hero">
        <Image
          src="/photo-hero.png"
          alt="Lavaca MNL Angus Roast Beef"
          fill
          style={{ objectFit: 'cover', objectPosition: 'center 30%' }}
          priority
        />
        <div className="hero-overlay" />
        <div className="lv-hero-content">
          <div className="lv-hero-rule" />
          <p className="lv-hero-eyebrow">Slow-Cooked &middot; 100% Angus &middot; Metro Manila</p>
          <h1 className="lv-hero-headline">
            Premium<br />Angus<br />Roast Beef.
          </h1>
          <p className="lv-hero-body">
            Slow-Cooked for 25 Hours.<br />
            Crafted for Gatherings.<br />
            Delivered Across Metro Manila.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
            <Link href="/order" className="lv-btn-primary">Order Now</Link>
            <button onClick={() => scrollTo('products-section')} className="lv-btn-ghost">View Products</button>
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <div className="lv-trust">
        {TRUST.map(({ num, l1, l2 }, i) => (
          <div key={i} className="lv-trust-item">
            <div className="lv-trust-num">{num}</div>
            <div className="lv-trust-label">{l1}<br />{l2}</div>
          </div>
        ))}
      </div>

      {/* ── PRODUCTS ── */}
      <section id="products-section" className="lv-products">
        <div style={{ textAlign: 'center', marginBottom: 80 }}>
          <p className="lv-section-label centered">The Menu</p>
          <h2 className="lv-section-title">Choose Your Cut</h2>
          <p className="lv-section-sub">
            Premium Angus, slow-cooked to order. Select the size that fits your gathering.
          </p>
        </div>
        <div className="lv-products-grid">
          {PRODUCTS.map((p) => (
            <div key={p.sku} className="lv-product-card">
              <div className="lv-product-photo">
                <Image
                  src={p.photo}
                  alt={p.name}
                  fill
                  style={{ objectFit: 'cover', objectPosition: p.photoPos }}
                />
                <div className="lv-product-photo-overlay" />
              </div>
              <div className="lv-product-body">
                <p className="lv-product-sku">{p.sku}</p>
                <h3 className="lv-product-name">{p.name}</h3>
                <p className="lv-product-weight">{p.weight}</p>
                <p className="lv-product-price">{p.price}</p>
                <p className="lv-product-occasion">{p.occasion}</p>
                <Link href="/order" className="lv-product-link">Order This Cut</Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CRAFT ── */}
      <section id="craft-section" className="lv-craft">
        <div className="lv-craft-photo">
          <Image
            src="/photo-craft.png"
            alt="The craft behind Lavaca MNL"
            fill
            style={{ objectFit: 'cover', objectPosition: 'center 25%' }}
          />
        </div>
        <div className="lv-craft-panel">
          <p className="lv-section-label light">The Craft</p>
          <h2 className="lv-craft-title">
            Slow-Cooked<br />for 25 Hours.
          </h2>
          <p className="lv-craft-quote">
            &ldquo;Every cut of premium Angus is prepared with obsessive patience — sealed with a spice crust, slow-cooked until the connective tissue surrenders and the flavour deepens into something the family will talk about long after dinner.&rdquo;
          </p>
          <p className="lv-craft-body">
            We believe the best food is never rushed. Lavaca MNL exists to bring that patience to your table — thoughtfully prepared, carefully packaged, and delivered exactly when you need it.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, width: 200 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(161,98,7,0.3)' }} />
            <svg width="7" height="7" viewBox="0 0 8 8" aria-hidden style={{ flexShrink: 0 }}>
              <rect x="4" y="0" width="5" height="5" transform="rotate(45 4 0)" fill="rgba(161,98,7,0.45)" />
            </svg>
            <div style={{ flex: 1, height: 1, background: 'rgba(161,98,7,0.3)' }} />
          </div>
        </div>
      </section>

      {/* ── PROCESS ── */}
      <section id="process-section" className="lv-process">
        <div style={{ marginBottom: 80 }}>
          <p className="lv-section-label centered">How It Works</p>
          <h2 className="lv-section-title">Three Simple Steps</h2>
          <p className="lv-section-sub">
            From your first click to your table — we handle everything in between.
          </p>
        </div>
        <div className="lv-process-steps">
          {STEPS.map((s) => (
            <div key={s.num} className="lv-process-step">
              <div className="lv-process-num">{s.num}</div>
              <h3 className="lv-process-title">{s.title}</h3>
              <p className="lv-process-desc">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── GALLERY ── */}
      <section className="lv-gallery">
        {GALLERY.map(({ src, caption }) => (
          <div key={caption} className="lv-gallery-item">
            <Image src={src} alt={`Lavaca MNL — ${caption}`} fill style={{ objectFit: 'cover' }} />
            <div className="lv-gallery-caption">{caption}</div>
          </div>
        ))}
      </section>

      {/* ── DELIVERY BAR ── */}
      <div id="delivery-section" className="lv-delivery">
        {DELIVERY.map(({ icon, strong, sub }, i) => (
          <div key={i} className="lv-delivery-item">
            <span className="lv-delivery-icon"><DeliveryIcon name={icon} /></span>
            <div className="lv-delivery-text">
              <span className="lv-delivery-strong">{strong}</span>
              <br />{sub}
            </div>
          </div>
        ))}
      </div>

      {/* ── ORDER CTA ── */}
      <section id="order-cta-section" className="lv-order-cta">
        <Image
          src="/photo-hero.png"
          alt=""
          fill
          aria-hidden
          style={{ objectFit: 'cover', objectPosition: 'center 45%' }}
        />
        <div className="lv-order-cta-overlay" />
        <div className="lv-order-cta-content">
          <p className="lv-section-label centered" style={{ color: 'rgba(161,98,7,0.75)' }}>Ready to Order</p>
          <h2 className="lv-order-cta-headline">Reserve Your<br />Delivery.</h2>
          <p className="lv-order-cta-sub">
            Choose your cut, pick your slot, and let us handle the rest.<br />Your table deserves this.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            <Link href="/order" className="lv-btn-primary">Order Now</Link>
            <a
              href="https://m.me/lavacamnl"
              target="_blank"
              rel="noopener noreferrer"
              className="lv-btn-outline"
            >
              Message Us on Messenger
            </a>
          </div>
        </div>
      </section>

    </div>
  )
}
