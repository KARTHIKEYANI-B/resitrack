import { FileX } from 'lucide-react'

const P = { primary: '#007979', accent: '#FFE0C5', border: '#E8C9AB', muted: '#6b8080', secondary: '#24B1B1' }

export default function EmptyState({ title = 'No data found', description = '', icon: Icon = FileX }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 animate-fade-in">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{
          background: `linear-gradient(135deg, ${P.accent} 0%, rgba(36,177,177,0.08) 100%)`,
          border: `1.5px solid ${P.border}`,
          boxShadow: `0 4px 14px rgba(0,121,121,0.07)`,
          transition: 'transform 0.32s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s ease',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'scale(1.1) rotate(-6deg)'
          e.currentTarget.style.boxShadow = `0 8px 20px rgba(0,121,121,0.13)`
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'scale(1) rotate(0deg)'
          e.currentTarget.style.boxShadow = `0 4px 14px rgba(0,121,121,0.07)`
        }}
      >
        <Icon size={24} style={{ color: P.muted }} />
      </div>
      <p className="text-sm font-semibold stagger-1 animate-fade-in" style={{ color: P.muted }}>{title}</p>
      {description && (
        <p className="text-xs max-w-xs text-center stagger-2 animate-fade-in" style={{ color: P.muted, opacity: 0.75 }}>
          {description}
        </p>
      )}
    </div>
  )
}
