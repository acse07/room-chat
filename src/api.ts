const API_BASE = 'https://inai-col3.fishrungames.com/api'

export type Tokens = { access: string }

async function request(path: string, body: unknown, access?: string): Promise<Record<string, unknown>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (access) headers.Authorization = `Bearer ${access}`

  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    credentials: 'include',
  })

  const data = await response.json().catch(() => ({})) as Record<string, unknown>
  if (!response.ok) {
    const detail = data.detail ?? data.username ?? data.password ?? data.non_field_errors
    throw new Error(Array.isArray(detail) ? detail.join(' ') : String(detail ?? 'Не удалось выполнить запрос'))
  }
  return data
}

export async function login(username: string, password: string): Promise<Tokens> {
  const data = await request('/login/', { username, password })
  if (typeof data.access !== 'string') throw new Error('Сервер не вернул access токен')
  return { access: data.access }
}

export async function register(username: string, password: string): Promise<Tokens> {
  const data = await request('/register/', { username, password })
  if (typeof data.access !== 'string') throw new Error('Сервер не вернул access токен')
  return { access: data.access }
}

export async function logout(tokens: Tokens): Promise<void> {
  await request('/logout/', {}, tokens.access)
}
