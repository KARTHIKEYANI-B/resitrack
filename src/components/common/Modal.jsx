import { X } from 'lucide-react'
import { useEffect, useState, useCallback } from 'react'

const P = { primary: '#007979', accent: '#FFE0C5', border: '#E8C9AB', dark: '#1a2e2e', muted: '#6b8080', surface: '#FFFAF5' }

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  const [phase, setPhase] = useState('hidden') // 'hidden' | 'entering' | 'visible' | 'leaving'

  useEffect(() => {
    if (isOpen) {
      setPhase('entering')
      const t = requestAnimationFrame(() => {
        requestAnimationFrame(() => setPhase('visible'))
      })
      document.body.style.overflow = 'hidden'
      return () => cancelAnimationFrame(t)
    } else {
      if (phase === 'visible' || phase === 'entering') {
        setPhase('leaving')
        document.body.style.overflow = ''
        const t = setTimeout(() => setPhase('hidden'), 260)
        return () => clearTimeout(t)
      }
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => () => { document.body.style.overflow = '' }, [])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && isOpen) onClose()
  }, [isOpen, onClose])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (phase === 'hidden') return null

  const maxWidths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  const isLeaving  = phase === 'leaving'
  const isEntering = phase === 'entering'

  const backdropStyle = {
    background: 'rgba(26,46,46,0.5)',
    backdropFilter: isLeaving ? 'blur(0px)' : 'blur(7px)',
    opacity: isLeaving || isEntering ? 0 : 1,
    transition: isLeaving
      ? 'opacity 0.25s cubic-bezier(0.4,0,1,1), backdrop-filter 0.25s ease'
      : 'opacity 0.22s cubic-bezier(0,0,0.2,1), backdrop-filter 0.22s ease',
  }

  const boxStyle = {
    opacity: isLeaving || isEntering ? 0 : 1,
    transform: isLeaving
      ? 'scale(0.94) translateY(8px)'
      : isEntering
        ? 'scale(0.94) translateY(8px)'
        : 'scale(1) translateY(0)',
    transition: isLeaving
      ? 'opacity 0.22s cubic-bezier(0.4,0,1,1), transform 0.22s cubic-bezier(0.4,0,1,1)'
      : 'opacity 0.28s cubic-bezier(0,0,0.2,1), transform 0.28s cubic-bezier(0.34,1.1,0.64,1)',
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={backdropStyle}
      onClick={onClose}
    >
      <div
        className={`modal-box w-full ${maxWidths[size]} flex flex-col rounded-t-2xl sm:rounded-2xl max-h-[92vh] sm:max-h-[88vh]`}
        style={boxStyle}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 sm:px-6 py-4 flex-shrink-0"
          style={{ borderBottom: `1px solid ${P.border}`, background: P.accent, borderRadius: '1rem 1rem 0 0' }}
        >
          <h2 className="text-base font-bold pr-4" style={{ color: P.dark }}>{title}</h2>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1.5 rounded-xl"
            style={{
              color: P.muted,
              transition: 'background 0.14s ease, color 0.14s ease, transform 0.18s cubic-bezier(0.34,1.56,0.64,1)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = P.border
              e.currentTarget.style.color = P.primary
              e.currentTarget.style.transform = 'rotate(90deg) scale(1.1)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = P.muted
              e.currentTarget.style.transform = 'rotate(0deg) scale(1)'
            }}
            onMouseDown={e => { e.currentTarget.style.transform = 'rotate(90deg) scale(0.9)' }}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 sm:px-6 py-5 overflow-y-auto flex-1 overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  )
}
