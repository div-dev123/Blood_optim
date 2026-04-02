export type ActivityItem = {
  id: string
  action: string
  details: string
  timestamp: string // ISO
  kind: 'success' | 'info' | 'warning'
}

const KEY = 'bloodflow.activity'

function safeParse(raw: string | null): ActivityItem[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((v) => v && typeof v === 'object')
      .map((v) => v as ActivityItem)
  } catch {
    return []
  }
}

export function readActivity(limit = 8): ActivityItem[] {
  const items = safeParse(localStorage.getItem(KEY))
  return items
    .slice()
    .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''))
    .slice(0, limit)
}

export function addActivity(item: Omit<ActivityItem, 'id' | 'timestamp'>): void {
  const existing = safeParse(localStorage.getItem(KEY))
  const next: ActivityItem[] = [
    {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...item,
    },
    ...existing,
  ].slice(0, 50)
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // ignore
  }
}
