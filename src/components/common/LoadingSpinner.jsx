const P = { primary: '#007979', secondary: '#24B1B1', accent: '#FFE0C5', border: '#E8C9AB', muted: '#6b8080', surface: '#FFFAF5' }

export default function LoadingSpinner({ size = 'md', text = '' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' }
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`${sizes[size]} rounded-full animate-spin`}
        style={{
          border: '2.5px solid var(--rt-accent)',
          borderTopColor: P.primary,
          borderRightColor: P.secondary,
        }}
      />
      {text && <p className="text-xs animate-fade-in" style={{ color: P.muted }}>{text}</p>}
    </div>
  )
}

export function PageLoader() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] gap-4 animate-fade-in">
      {/* Multi-ring spinner */}
      <div className="relative w-12 h-12">
        <div
          className="absolute inset-0 rounded-full animate-spin"
          style={{
            border: '2.5px solid transparent',
            borderTopColor: P.primary,
            borderRightColor: P.secondary,
            animationDuration: '0.9s',
          }}
        />
        <div
          className="absolute inset-1.5 rounded-full animate-spin"
          style={{
            border: '2px solid transparent',
            borderBottomColor: P.secondary,
            opacity: 0.5,
            animationDuration: '1.3s',
            animationDirection: 'reverse',
          }}
        />
        <div
          className="absolute inset-[11px] rounded-full"
          style={{ background: `rgba(0,121,121,0.12)` }}
        />
      </div>
      <p className="text-xs font-medium tracking-wide" style={{ color: P.muted }}>Loading…</p>
    </div>
  )
}

export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="space-y-2.5 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex gap-4"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          {Array.from({ length: cols }).map((_, j) => (
            <div
              key={j}
              className="skeleton rounded-lg flex-1"
              style={{
                height: '14px',
                animationDelay: `${(i * cols + j) * 20}ms`,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
