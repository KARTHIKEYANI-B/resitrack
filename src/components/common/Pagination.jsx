import { ChevronLeft, ChevronRight } from 'lucide-react'

const P = { primary: '#007979', secondary: '#24B1B1', accent: '#FFE0C5', border: '#E8C9AB', muted: '#6b8080' }

const T = 'background-color 0.14s cubic-bezier(0.25,0.46,0.45,0.94), color 0.14s ease, transform 0.14s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.16s ease'

export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null

  // Clamp page range around current
  const range = (() => {
    const half = 2
    let start = Math.max(1, page - half)
    let end   = Math.min(totalPages, page + half)
    if (end - start < 4) {
      if (start === 1) end   = Math.min(totalPages, start + 4)
      else             start = Math.max(1, end - 4)
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  })()

  return (
    <div
      className="flex items-center justify-between px-4 py-3 animate-fade-in"
      style={{ borderTop: `1px solid ${P.border}` }}
    >
      <p className="text-xs" style={{ color: P.muted }}>
        Page <span style={{ color: P.primary, fontWeight: 600 }}>{page}</span> of {totalPages}
      </p>

      <div className="flex items-center gap-1">
        {/* Prev */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="p-1.5 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ color: P.muted, transition: T }}
          onMouseEnter={e => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.background = P.accent
              e.currentTarget.style.color = P.primary
              e.currentTarget.style.transform = 'translateX(-2px)'
            }
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = P.muted
            e.currentTarget.style.transform = 'translateX(0)'
          }}
          onMouseDown={e => { if (!e.currentTarget.disabled) e.currentTarget.style.transform = 'translateX(0) scale(0.9)' }}
        >
          <ChevronLeft size={16} />
        </button>

        {/* First page if not in range */}
        {range[0] > 1 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className="w-7 h-7 rounded-lg text-xs font-medium"
              style={{ color: P.muted, transition: T }}
              onMouseEnter={e => { e.currentTarget.style.background = P.accent; e.currentTarget.style.color = P.primary; e.currentTarget.style.transform = 'scale(1.12)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = P.muted; e.currentTarget.style.transform = 'scale(1)' }}
            >1</button>
            {range[0] > 2 && <span style={{ color: P.muted, fontSize: 11, padding: '0 2px' }}>…</span>}
          </>
        )}

        {range.map(p => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className="w-7 h-7 rounded-lg text-xs font-medium"
            style={{
              background:  p === page ? P.primary   : 'transparent',
              color:       p === page ? '#ffffff'    : P.muted,
              boxShadow:   p === page ? `0 2px 8px rgba(0,121,121,0.28)` : 'none',
              transform:   p === page ? 'scale(1.05)' : 'scale(1)',
              fontWeight:  p === page ? 700 : 500,
              transition:  T,
            }}
            onMouseEnter={e => {
              if (p !== page) {
                e.currentTarget.style.background = P.accent
                e.currentTarget.style.color = P.primary
                e.currentTarget.style.transform = 'scale(1.12)'
              }
            }}
            onMouseLeave={e => {
              if (p !== page) {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = P.muted
                e.currentTarget.style.transform = 'scale(1)'
              }
            }}
            onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.9)' }}
          >{p}</button>
        ))}

        {/* Last page if not in range */}
        {range[range.length - 1] < totalPages && (
          <>
            {range[range.length - 1] < totalPages - 1 && <span style={{ color: P.muted, fontSize: 11, padding: '0 2px' }}>…</span>}
            <button
              onClick={() => onPageChange(totalPages)}
              className="w-7 h-7 rounded-lg text-xs font-medium"
              style={{ color: P.muted, transition: T }}
              onMouseEnter={e => { e.currentTarget.style.background = P.accent; e.currentTarget.style.color = P.primary; e.currentTarget.style.transform = 'scale(1.12)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = P.muted; e.currentTarget.style.transform = 'scale(1)' }}
            >{totalPages}</button>
          </>
        )}

        {/* Next */}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="p-1.5 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ color: P.muted, transition: T }}
          onMouseEnter={e => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.background = P.accent
              e.currentTarget.style.color = P.primary
              e.currentTarget.style.transform = 'translateX(2px)'
            }
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = P.muted
            e.currentTarget.style.transform = 'translateX(0)'
          }}
          onMouseDown={e => { if (!e.currentTarget.disabled) e.currentTarget.style.transform = 'translateX(0) scale(0.9)' }}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
