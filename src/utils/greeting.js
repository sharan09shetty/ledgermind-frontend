export function timeGreeting(date = new Date()) {
  const h = date.getHours()
  if (h < 5) return 'Up late'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export function firstName(fullName) {
  if (!fullName) return null
  return fullName.trim().split(/\s+/)[0]
}
