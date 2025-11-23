import { H3Event } from 'h3'
import { getEnrollmentById } from '~/server/utils/enrollments'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const id = getRouterParam(event, 'id')
    
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Enrollment ID is required'
      })
    }

    const enrollment = await getEnrollmentById(id)
    
    if (!enrollment) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Enrollment not found'
      })
    }

    return { success: true, data: enrollment }
  } catch (error) {
    console.error('Error fetching enrollment:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Error fetching enrollment'
    })
  }
})