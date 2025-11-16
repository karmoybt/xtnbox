// server/api/auth/register.post.ts
import { z } from 'zod';
import { generateRegistrationOptions } from 'webauthn-server';
import { db } from '../../../db/client';
import { getLogger } from '../../../audit/logger';

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
});

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, registerSchema.parse);
  const { email } = body;

  // Verificar si ya existe
  const existing = await db
    .execute({
      sql: 'SELECT id FROM users WHERE email = ? AND deleted_at IS NULL',
      args: [email],
    })
    .then(r => r.rows[0]);

  if (existing) {
    throw createError({ statusCode: 409, message: 'User already exists' });
  }

  // Generar desafío WebAuthn
  const challenge = generateRegistrationOptions({
    rpName: 'CristinaCRM',
    rpID: 'localhost', 
    userID: email,
    userName: email,
    timeout: 60000,
    attestationType: 'none',
  });

  getLogger('USER_REGISTRATION_STARTED', {
    email,
    challenge: challenge.challenge,
    ip_address: event.context.ip,
    user_agent: event.context.userAgent,
  });

  return {
    challenge,
  };
});