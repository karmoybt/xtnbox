import { H3Event } from 'h3'
import { getClassSchedules } from '~/server/utils/class-schedules'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const schedules = await getClassSchedules()
    return { success: true, data: schedules }
  } catch (error) {
    console.error('Error fetching class schedules:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Error fetching class schedules'
    })
  }
})