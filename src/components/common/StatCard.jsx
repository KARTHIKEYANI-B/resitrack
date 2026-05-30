export default function StatCard({ icon: Icon, label, value, sub, iconBg = 'bg-gray-800' }) {
  return (
    <div className="stat-card animate-slide-up">
      <div className="flex items-start justify-between">
        <div>
          <p className="stat-label">{label}</p>
          <p className="stat-value mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
        </div>
        {Icon && (
          <div className={`stat-icon ${iconBg}`}>
            <Icon size={18} className="text-gray-400" />
          </div>
        )}
      </div>
    </div>
  )
}
