// test/unit/leads/leads.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { $fetch } from '@nuxt/test-utils'
import type { ResultSet, Row } from '@libsql/client'

/* ---------- mocks ---------- */
vi.mock('../../../app/server/db/client', () => ({
  db: { execute: vi.fn() }
}))
import { db } from '../../../app/server/db/client'

/* ---------- helpers (re-usados) ---------- */
function fakeRow(overrides: Record<string, unknown> = {}): Row {
  return { length: 0, ...overrides } as Row
}
function fakeResultSet(rows: Row[] = []): ResultSet {
  return {
    rows,
    columns: [],
    columnTypes: [],
    rowsAffected: rows.length,
    lastInsertRowid: rows.length ? BigInt(1) : undefined,
    toJSON: () => ({})
  } as ResultSet
}

/* ---------- tipos de respuesta ---------- */
interface LeadsResponse {
  leads: Array<{ id: string; full_name: string; status: string; created_at: string }>
  hasMore: boolean
}
interface LeadResponse {
  id: string
  full_name: string
  status: string
}

/* ---------- tests ---------- */
describe('GET /api/leads', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns paginated leads', async () => {
    vi.mocked(db.execute).mockResolvedValueOnce(
      fakeResultSet([
        fakeRow({ id: 'lead_1', full_name: 'Alice', status: 'new', created_at: '2025-11-15T10:00:00Z' }),
        fakeRow({ id: 'lead_2', full_name: 'Bob', status: 'pending', created_at: '2025-11-14T09:00:00Z' })
      ])
    )

    const res = await $fetch<LeadsResponse>('/api/leads?limit=2')

    expect(res.leads).toHaveLength(2)
    expect(res.hasMore).toBe(false)
  })
})

describe('POST /api/leads', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates a new lead', async () => {
    vi.mocked(db.execute).mockResolvedValueOnce(fakeResultSet([]))

    const res = await $fetch<LeadResponse>('/api/leads', {
      method: 'POST',
      body: { full_name: 'Carlos', status: 'new' }
    })

    expect(res.id).toBeDefined()
    expect(res.full_name).toBe('Carlos')
  })
})