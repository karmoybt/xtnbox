import { H3Event } from 'h3'
import { getEnrollments } from '~/server/utils/enrollments'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const query = getQuery(event)
    const user_id = query.user_id as string | undefined
    
    const enrollments = await getEnrollments(user_id)
    return { success: true, data: enrollments }
  } catch (error) {
    console.error('Error fetching enrollments:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Error fetching enrollments'
    })
  }
})