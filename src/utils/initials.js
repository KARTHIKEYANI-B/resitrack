// Shared avatar-initials helper.
//
// Used by every member-list / avatar screen (Admin Members List, Resident
// Directory, Security Section, Security Residents, User Members List, and
// the shared ProfileAvatar component) so initials are generated the same
// way everywhere.
//
// FIX: previously each screen did its own `name.split(' ').map(w => w[0])`.
// That breaks for names containing parentheses or other punctuation — e.g.
// a vacant committee position is stored as "President (Vacant)", and
// `"President (Vacant)".split(' ')` produces ["President", "(Vacant)"],
// whose first characters are "P" and "(" — rendering as the malformed
// "P(" avatar initials reported in the bug.
//
// This helper only considers actual alphabetic words when building
// initials (parentheses, punctuation, digits, and stray symbols are
// stripped first), so "President (Vacant)" correctly yields "PV", and any
// purely symbolic token is ignored rather than contributing a stray
// character like "(".
//
// No member/display data is changed — this only affects how initials are
// derived from the existing name string for the avatar circle.
export function getInitials(name, fallback = '?') {
  if (!name || typeof name !== 'string') return fallback

  const letters = name
    // Drop anything that isn't a letter (any language) or whitespace —
    // removes "(", ")", "-", digits, etc. without touching the original
    // name string itself, which is only ever used for this derived display.
    .replace(/[^\p{L}\s]/gu, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(word => word[0])
    .filter(Boolean)
    .join('')
    .substring(0, 2)
    .toUpperCase()

  return letters || fallback
}
