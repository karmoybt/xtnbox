// app/server/api/auth/register/index.post.ts
import { z } from 'zod'
import { generateRegistrationOptions } from 'webauthn-server'
import { db } from '../../../db/client'
import { getLogger } from '../../../audit/logger'
import { redis } from '../../../redis/client'
import { defineEventHandler, readValidatedBody, createError } from 'h3'

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, registerSchema.parse)
  const { email } = body

  // Verificar si ya existe
  const { rows } = await db.execute({
    sql: 'SELECT id FROM users WHERE email = ? AND deleted_at IS NULL',
    args: [email],
  })

  if (rows.length > 0) {
    throw createError({ statusCode: 409, message: 'User already exists' })
  }

  // Generar desafío WebAuthn
  const challenge = generateRegistrationOptions({
    rpName: 'CristinaCRM',
    rpID: 'localhost',
    userID: email,
    userName: email,
    timeout: 60000,
    attestationType: 'none',
  })

  const challengeKey = `reg_challenge:${email}`
  await redis.setEx(challengeKey, 60, challenge.challenge)

  getLogger('USER_REGISTRATION_STARTED', {
    email,
    challenge: challenge.challenge,
    ip_address: event.context.ip,
    user_agent: event.context.userAgent,
  })

  return { challenge: challenge.challenge }
})