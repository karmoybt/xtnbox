import { H3Event } from 'h3'
import { getClassScheduleById } from '~/server/utils/class-schedules'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const id = getRouterParam(event, 'id')
    
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Class Schedule ID is required'
      })
    }

    const schedule = await getClassScheduleById(id)
    
    if (!schedule) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Class schedule not found'
      })
    }

    return { success: true, data: schedule }
  } catch (error) {
    console.error('Error fetching class schedule:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Error fetching class schedule'
    })
  }
})