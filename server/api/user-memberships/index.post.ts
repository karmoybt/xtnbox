import { H3Event } from 'h3'
import { createUserMembership, UserMembershipInput } from '~/server/utils/user-memberships'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const body = await readBody(event)
    const userMembershipData: UserMembershipInput = {
      user_id: body.user_id,
      membership_id: body.membership_id,
      start_date: body.start_date || new Date().toISOString(),
      end_date: body.end_date,
      status: body.status || 'active',
      stripe_subscription_id: body.stripe_subscription_id,
      created_by: body.created_by
    }

    const userMembership = await createUserMembership(userMembershipData)
    return { success: true, data: userMembership }
  } catch (error) {
    console.error('Error creating user membership:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Error creating user membership'
    })
  }
})