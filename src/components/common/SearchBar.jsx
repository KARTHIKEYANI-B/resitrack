import { Search, X } from 'lucide-react'
import { useState } from 'react'

const P = { primary: '#007979', secondary: '#24B1B1', accent: '#FFE0C5', border: '#E8C9AB', muted: '#6b8080' }

export default function SearchBar({ value, onChange, placeholder = 'Search...' }) {
  const [focused, setFocused] = useState(false)

  return (
    <div
      className="relative"
      style={{
        transition: 'transform 0.15s cubic-bezier(0.34,1.56,0.64,1)',
        transform: focused ? 'scale(1.01)' : 'scale(1)',
      }}
    >
      <Search
        size={14}
        className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          color: focused ? P.primary : P.muted,
          transition: 'color 0.15s ease',
        }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-field pl-8 w-64"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full"
          style={{
            color: P.muted,
            animation: 'scaleIn 0.15s ease both',
            transition: 'color 0.12s ease, background 0.12s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = P.primary; e.currentTarget.style.background = P.accent }}
          onMouseLeave={e => { e.currentTarget.style.color = P.muted; e.currentTarget.style.background = 'transparent' }}
        >
          <X size={12} />
        </button>
      )}
    </div>
  )
}

export function FilterSelect({ value, onChange, options, placeholder = 'All' }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="input-field w-auto min-w-[130px]"
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  )
}
