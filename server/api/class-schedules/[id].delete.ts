import { H3Event } from 'h3'
import { deleteClassSchedule } from '~/server/utils/class-schedules'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const id = getRouterParam(event, 'id')
    
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Class Schedule ID is required'
      })
    }

    const result = await deleteClassSchedule(id)
    
    if (!result) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Class schedule not found'
      })
    }

    return { success: true, message: 'Class schedule marked as deleted' }
  } catch (error) {
    console.error('Error deleting class schedule:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Error deleting class schedule'
    })
  }
})