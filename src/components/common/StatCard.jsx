export default function StatCard({ icon: Icon, label, value, sub, iconBg = 'bg-gray-800' }) {
  return (
    <div className="stat-card animate-slide-up">
      <div className="flex items-start justify-between">
        <div>
          <p className="stat-label">{label}</p>
          <p className="stat-value mt-1">{value}</p>
          {sub && <p className="text-xs mt-1" style={{ color: 'var(--rt-muted)' }}>{sub}</p>}
        </div>
        {Icon && (
          <div className={`stat-icon ${iconBg}`}>
            <Icon size={18} style={{ color: 'var(--rt-muted)' }} />
          </div>
        )}
      </div>
    </div>
  )
}
