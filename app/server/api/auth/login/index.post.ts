// app/server/api/auth/login/index.post.ts
import { z } from 'zod'
import { generateAuthenticationOptions } from 'webauthn-server'
import { db } from '../../../db/client'
import { getLogger } from '../../../audit/logger'
import { redis } from '../../../redis/client'
import { defineEventHandler, readValidatedBody } from 'h3'

const loginSchema = z.object({
  email: z.string().email(),
})

interface UserRow {
  id: string
}

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, loginSchema.parse)
  const { email } = body

  const { rows } = await db.execute({
    sql: 'SELECT id FROM users WHERE email = ? AND deleted_at IS NULL',
    args: [email],
  })

  const user = rows[0] as UserRow | undefined

  if (!user) {
    getLogger('USER_LOGIN_ATTEMPT_NONEXISTENT', {
      email,
      ip_address: event.context.ip,
    })
    // No revelar que el usuario no existe (evitar enumeration)
    return { options: { challenge: 'dummy' } }
  }

  const options = generateAuthenticationOptions({
    rpID: 'localhost',
    timeout: 60_000,
    userVerification: 'preferred',
    allowCredentials: [],
  })

  await redis.setEx(`auth_challenge:${user.id}`, 60, options.challenge)

  getLogger('USER_LOGIN_CHALLENGE_ISSUED', {
    user_id: user.id,
    email,
    ip_address: event.context.ip,
    challenge_key: `auth_challenge:${user.id}`,
  })

  return { options }
})