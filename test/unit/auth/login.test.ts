// test/unit/auth/login.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { $fetch } from '@nuxt/test-utils'
import type { ResultSet, Row } from '@libsql/client'

/* ---------- mocks (antes que los imports reales) ---------- */
vi.mock('../../../app/server/db/client', () => ({
  db: { execute: vi.fn() }
}))
vi.mock('../../../app/server/redis/client', () => ({
  redis: { setex: vi.fn() }
}))

/* ---------- imports de los mocks ---------- */
import { db } from '../../../app/server/db/client'
import { redis } from '../../../app/server/redis/client'

/* ---------- tipos ---------- */
interface LoginResponse {
  options: { challenge?: string }
}

/* ---------- helpers ---------- */
function fakeRow(overrides: Record<string, unknown> = {}): Row {
  return {
    length: 0,               // obligatoria en Row
    ...overrides,
  } as Row
}

function fakeResultSet(rows: Row[] = []): ResultSet {
  return {
    rows,
    columns: [],
    columnTypes: [],
    rowsAffected: rows.length,
    lastInsertRowid: rows.length ? BigInt(1) : undefined,
    toJSON: () => ({}),
  } as ResultSet
}

/* ---------- tests ---------- */
describe('POST /api/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns auth options for existing user', async () => {
    vi.mocked(db.execute).mockResolvedValueOnce(fakeResultSet([fakeRow({ id: 'usr_abc123' })]))
    vi.mocked(redis.setex).mockResolvedValueOnce('OK')

    const res = await $fetch<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: { email: 'test@example.com' }
    })

    expect(res.options).toBeDefined()
    expect(redis.setex).toHaveBeenCalledWith(
      'auth_challenge:usr_abc123',
      60,
      expect.any(String)
    )
  })

  it('does not reveal non-existent user', async () => {
    vi.mocked(db.execute).mockResolvedValueOnce(fakeResultSet([]))

    const res = await $fetch<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: { email: 'notexists@example.com' }
    })

    expect(res.options).toBeDefined()
    expect(res.options.challenge).toBe('dummy')
  })
})