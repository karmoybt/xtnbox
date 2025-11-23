import { H3Event } from 'h3'
import { deleteEnrollment } from '~/server/utils/enrollments'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const id = getRouterParam(event, 'id')
    
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Enrollment ID is required'
      })
    }

    const result = await deleteEnrollment(id)
    
    if (!result) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Enrollment not found'
      })
    }

    return { success: true, message: 'Enrollment marked as deleted' }
  } catch (error) {
    console.error('Error deleting enrollment:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Error deleting enrollment'
    })
  }
})