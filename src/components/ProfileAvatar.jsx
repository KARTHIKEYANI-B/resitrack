/**
 * ProfileAvatar — universal profile photo component.
 *
 * Priority:
 *   1. photoUrl (uploaded photo from backend)
 *   2. Initials-based colored avatar (always works, never broken)
 *
 * Usage:
 *   <ProfileAvatar name="Ramesh Kumar" photoUrl={user.profilePhotoUrl} size={40} />
 */
export default function ProfileAvatar({
  name      = '',
  photoUrl  = null,
  size      = 40,
  className = '',
}) {
  const initials = name
    ? name.trim().split(/\s+/).map(w => w[0]).join('').substring(0, 2).toUpperCase()
    : '?'

  // Derive a consistent color from the name
  const colors = [
    '#007979', '#24B1B1', '#2E7D32', '#1565C0',
    '#6A1B9A', '#E65100', '#880E4F', '#00695C',
  ]
  const colorIndex = name
    ? name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % colors.length
    : 0
  const bg = colors[colorIndex]

  const style = { width: size, height: size, borderRadius: '50%', flexShrink: 0 }

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        className={`object-cover ${className}`}
        style={style}
        onError={e => {
          // On broken image, swap to initials fallback
          e.target.style.display = 'none'
          const sibling = e.target.nextElementSibling
          if (sibling) sibling.style.display = 'flex'
        }}
      />
    )
  }

  return (
    <div
      className={`flex items-center justify-center font-bold text-white select-none ${className}`}
      style={{ ...style, background: bg, fontSize: Math.max(10, size * 0.36) }}
    >
      {initials}
    </div>
  )
}

/**
 * WithFallback variant — renders both img AND initials div,
 * hides initials until img fails. Use when photoUrl might be present
 * but could break at load time.
 */
export function ProfileAvatarWithFallback({
  name     = '',
  photoUrl = null,
  size     = 40,
  className = '',
}) {
  const initials = name
    ? name.trim().split(/\s+/).map(w => w[0]).join('').substring(0, 2).toUpperCase()
    : '?'
  const colors = [
    '#007979', '#24B1B1', '#2E7D32', '#1565C0',
    '#6A1B9A', '#E65100', '#880E4F', '#00695C',
  ]
  const colorIndex = name
    ? name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % colors.length
    : 0
  const bg = colors[colorIndex]
  const style = { width: size, height: size, borderRadius: '50%', flexShrink: 0 }

  return (
    <div className="relative inline-flex" style={style}>
      {photoUrl && (
        <img
          src={photoUrl}
          alt={name}
          className={`object-cover absolute inset-0 ${className}`}
          style={style}
          onError={e => {
            e.target.style.display = 'none'
          }}
        />
      )}
      <div
        className={`flex items-center justify-center font-bold text-white select-none ${className}`}
        style={{
          ...style,
          background: bg,
          fontSize: Math.max(10, size * 0.36),
          // Shown when no photo or photo fails
          zIndex: photoUrl ? -1 : 0,
        }}
      >
        {initials}
      </div>
    </div>
  )
}