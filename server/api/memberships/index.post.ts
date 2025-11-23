import { H3Event } from 'h3'
import { createMembership, MembershipInput } from '~/server/utils/memberships'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const body = await readBody(event)
    const membershipData: MembershipInput = {
      name: body.name,
      description: body.description,
      duration_days: body.duration_days,
      price: body.price,
      stripe_price_id: body.stripe_price_id,
      max_classes_per_week: body.max_classes_per_week,
      features: body.features,
      created_by: body.created_by
    }

    const membership = await createMembership(membershipData)
    return { success: true, data: membership }
  } catch (error) {
    console.error('Error creating membership:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Error creating membership'
    })
  }
})