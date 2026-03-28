export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <main style={{ padding: '32px', maxWidth: 1200, margin: '0 auto' }}>
      {children}
    </main>
  )
}