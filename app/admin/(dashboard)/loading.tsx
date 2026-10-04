// Shown instantly while an admin page loads, so clicks respond right away.
// The nav bar comes from the layout and stays in place.
export default function AdminLoading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="adm-skeleton" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="adm-skel-bar" style={{ width: 160, height: 14 }} />
        <div className="adm-skel-bar" style={{ width: 280, height: 32 }} />
      </div>
      <div className="adm-card">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '8px 0' }}>
            <div className="adm-skel-bar" style={{ width: '18%', height: 16 }} />
            <div className="adm-skel-bar" style={{ width: '42%', height: 16 }} />
            <div className="adm-skel-bar" style={{ width: '16%', height: 16 }} />
          </div>
        ))}
      </div>
    </div>
  )
}
