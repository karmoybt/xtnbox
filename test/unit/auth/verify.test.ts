// test/unit/auth/verify.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { $fetch } from '@nuxt/test-utils'
import type { ResultSet, Row } from '@libsql/client'

/* ---------- mocks (antes que los imports reales) ---------- */
vi.mock('../../../app/server/db/client', () => ({
  db: { execute: vi.fn() }
}))
vi.mock('../../../app/server/redis/client', () => ({
  redis: { get: vi.fn(), setex: vi.fn() }
}))

/* ---------- imports de los mocks ---------- */
import { db } from '../../../app/server/db/client'
import { redis } from '../../../app/server/redis/client'

/* ---------- helpers (re-usados del login.test.ts) ---------- */
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

/* ---------- mock del módulo webauthn-server ---------- */
vi.mock('webauthn-server', async () => {
  const actual = await vi.importActual<typeof import('webauthn-server')>('webauthn-server')
  return {
    ...actual,
    verifyAuthenticationResponse: vi.fn().mockResolvedValue({
      verified: true,
      authenticationInfo: { newCounter: 1 }
    })
  }
})

/* ---------- tipos de la respuesta ---------- */
interface VerifyResponse {
  success: boolean
}

/* ---------- tests ---------- */
describe('POST /api/auth/login/verify', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates session on valid credential', async () => {
    vi.mocked(db.execute)
      .mockResolvedValueOnce(fakeResultSet([fakeRow({ id: 'usr_abc123' })])) // usuario
      .mockResolvedValueOnce(
        fakeResultSet([
          fakeRow({
            public_key: Buffer.from([1, 2, 3]),
            counter: 0
          })
        ])
      ) // credencial

    vi.mocked(redis.get).mockResolvedValue('valid_challenge_123')

    const fakeCred = {
      rawId: new Uint8Array([1, 2, 3]),
      response: {
        authenticatorData: new Uint8Array([4, 5, 6]),
        clientDataJSON: new Uint8Array([7, 8, 9]),
        signature: new Uint8Array([10, 11, 12])
      }
    }

    const res = await $fetch<VerifyResponse>('/api/auth/login/verify', {
      method: 'POST',
      body: {
        email: 'test@example.com',
        credential: fakeCred
      }
    })

    expect(res.success).toBe(true)
    expect(db.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        sql: expect.stringContaining('INSERT INTO sessions_store')
      })
    )
  })
})