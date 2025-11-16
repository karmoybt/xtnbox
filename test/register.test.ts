// test/register-verify.test.ts
import { describe, it, expect, vi, type Mock } from 'vitest';
import { $fetch } from '@nuxt/test-utils';
import { db } from '../app/server/db/client';

// 2.  Mock del cliente
vi.mock('../app/server/db/client', () => ({
  db: { execute: vi.fn() },
}));

// 3.  Mock de webauthn-server (ahora usas verifyRegistration)
vi.mock('webauthn-server', () => ({
  verifyRegistration: vi.fn().mockResolvedValue({
    verified: true,
    registrationInfo: {
      credentialID: new Uint8Array([1, 2, 3]),
      credentialPublicKey: new Uint8Array([4, 5, 6]),
      counter: 0,
    },
  }),
}));

interface RegisterOk {
  success: boolean;
  user: { id: string; email: string };
}

describe('Register Verify', () => {
  it('should create user and session on valid passkey', async () => {
    (db.execute as Mock).mockResolvedValue({ rows: [] });

    const res = await $fetch<RegisterOk>('/api/auth/register/verify', {
      method: 'POST',
      body: {
        email: 'test@example.com',
        credential: { response: { transports: [] } },
      },
    });

    expect(res.success).toBe(true);
    expect(res.user.email).toBe('test@example.com');
  });
});