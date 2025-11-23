import { H3Event } from 'h3'
import { getMemberships } from '~/server/utils/memberships'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const memberships = await getMemberships()
    return { success: true, data: memberships }
  } catch (error) {
    console.error('Error fetching memberships:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Error fetching memberships'
    })
  }
})