import { X } from 'lucide-react'
import { useEffect } from 'react'

/**
 * Modal — fixed scrolling issue where body content was unreachable.
 * - Modal box has max-h-[92vh] so it never overflows the viewport.
 * - Header is sticky (flex-shrink-0) so it stays visible while body scrolls.
 * - Body section gets overflow-y-auto so form content is always reachable.
 * - Mobile: full-width with proper padding, smaller max-height for keyboards.
 */
export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  // Prevent body scroll while modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  const maxWidths = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
      style={{ background: 'rgba(3,4,94,0.35)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      {/* Modal box — flex column so header is sticky, body scrolls */}
      <div
        className={`
          modal-box w-full ${maxWidths[size]}
          flex flex-col
          rounded-t-2xl sm:rounded-2xl
          max-h-[92vh] sm:max-h-[88vh]
          animate-slide-up
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Sticky header ─────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-cyan-200 flex-shrink-0">
          <h2 className="text-base font-semibold text-blue-950 leading-tight pr-4">{title}</h2>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1.5 rounded-lg text-sky-500 hover:text-blue-900 hover:bg-cyan-100 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Scrollable body ───────────────────────────────────── */}
        <div className="px-5 sm:px-6 py-5 overflow-y-auto flex-1 overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  )
}