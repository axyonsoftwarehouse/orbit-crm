const COLORS = [
  "#FFC542",
  "#0062FF",
  "#3DD598",
  "#FF9AD5",
  "#A461D8",
  "#FF974A",
  "#50B5FF",
]

export function initialsOf(name: string | null) {
  if (!name) return "?"
  const parts = name.trim().split(/\s+/)
  const value = (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")
  return value.toUpperCase() || "?"
}

export function colorFor(name: string | null) {
  const source = name ?? "?"
  let hash = 0
  for (let i = 0; i < source.length; i++) {
    hash = (hash * 31 + source.charCodeAt(i)) % COLORS.length
  }
  return COLORS[hash]
}
