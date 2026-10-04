// Shown instantly while an admin page loads, so clicks respond right away.
// The nav bar comes from the layout and stays in place.
export default function AdminLoading() {
  const bar = (width: number | string, height = 12): React.CSSProperties => ({
    width,
    height,
    background: '#E7E5E4',
  })

  return (
    <div aria-busy="true" aria-label="Loading" className="lv-admin-skeleton">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
        <div style={bar(90, 9)} />
        <div style={bar(260, 28)} />
      </div>
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #D6D3D1',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={bar('22%')} />
            <div style={bar('38%')} />
            <div style={bar('18%')} />
          </div>
        ))}
      </div>
    </div>
  )
}
