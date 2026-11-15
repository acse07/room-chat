const API_BASE = 'https://inai-col3.fishrungames.com/api'

export type Tokens = { access: string; refresh?: string }

async function request(path: string, body: unknown): Promise<Record<string, unknown>> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = await response.json().catch(() => ({})) as Record<string, unknown>
  if (!response.ok) {
    const detail = data.detail ?? data.username ?? data.password ?? data.non_field_errors
    throw new Error(Array.isArray(detail) ? detail.join(' ') : String(detail ?? 'Не удалось выполнить запрос'))
  }
  return data
}

export async function login(username: string, password: string): Promise<Tokens> {
  const data = await request('/token/', { username, password })
  if (typeof data.access !== 'string') throw new Error('Сервер не вернул access токен')
  return { access: data.access, refresh: typeof data.refresh === 'string' ? data.refresh : undefined }
}

export async function register(username: string, password: string): Promise<void> {
  await request('/register/', { username, password })
}
