import { H3Event } from 'h3'
import { getUserMemberships } from '~/server/utils/user-memberships'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const query = getQuery(event)
    const user_id = query.user_id as string | undefined
    
    const userMemberships = await getUserMemberships(user_id)
    return { success: true, data: userMemberships }
  } catch (error) {
    console.error('Error fetching user memberships:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Error fetching user memberships'
    })
  }
})