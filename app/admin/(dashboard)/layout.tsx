import { AdminNav } from '@/components/admin/AdminNav'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#F5F4F2', fontFamily: "'Inter', sans-serif" }}>
      <AdminNav />
      <main style={{ maxWidth: 1152, margin: '0 auto', padding: '40px 24px' }}>
        {children}
      </main>
    </div>
  )
}
