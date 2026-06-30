export default function StatCard({ label, value, sub, accent }) {
  const accentColor = {
    emerald: '#10B981',
    rose: '#F43F5E',
    slate: '#64748B',
    blue: '#3B82F6',
  }[accent] || '#64748B'

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold" style={{ color: accentColor }}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  )
}
