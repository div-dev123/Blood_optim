export class ApiError extends Error {
  status: number
  body: unknown

  constructor(message: string, status: number, body: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

function joinUrl(base: string, path: string): string {
  if (!base) return path
  const normalizedBase = base.replace(/\/$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${normalizedBase}${normalizedPath}`
}

async function parseErrorBody(res: Response): Promise<unknown> {
  const contentType = res.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    try {
      return await res.json()
    } catch {
      return null
    }
  }

  try {
    return await res.text()
  } catch {
    return null
  }
}

function extractDetail(body: unknown): string | null {
  if (!body) return null
  if (typeof body === 'string') return body

  if (typeof body === 'object' && body !== null && 'detail' in body) {
    const detail = (body as { detail?: unknown }).detail
    if (typeof detail === 'string') return detail
    try {
      return JSON.stringify(detail)
    } catch {
      return String(detail)
    }
  }

  return null
}

export async function apiGet<T>(path: string, options?: { signal?: AbortSignal }): Promise<T> {
  const url = joinUrl(API_BASE_URL, path)
  const res = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal: options?.signal,
  })

  if (!res.ok) {
    const body = await parseErrorBody(res)
    const message = extractDetail(body) ?? `${res.status} ${res.statusText}`
    throw new ApiError(message, res.status, body)
  }

  return (await res.json()) as T
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  options?: { signal?: AbortSignal },
): Promise<T> {
  const url = joinUrl(API_BASE_URL, path)
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: options?.signal,
  })

  if (!res.ok) {
    const errBody = await parseErrorBody(res)
    const message = extractDetail(errBody) ?? `${res.status} ${res.statusText}`
    throw new ApiError(message, res.status, errBody)
  }

  return (await res.json()) as T
}
