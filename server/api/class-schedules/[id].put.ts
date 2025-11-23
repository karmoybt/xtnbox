import { H3Event } from 'h3'
import { updateClassSchedule, ClassScheduleInput } from '~/server/utils/class-schedules'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)
    
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Class Schedule ID is required'
      })
    }

    const scheduleData: ClassScheduleInput = {
      name: body.name,
      description: body.description,
      day_of_week: body.day_of_week,
      start_time: body.start_time,
      duration: body.duration,
      max_capacity: body.max_capacity,
      instructor_id: body.instructor_id,
      location: body.location,
      class_type: body.class_type,
      difficulty_level: body.difficulty_level,
      updated_by: body.updated_by
    }

    const schedule = await updateClassSchedule(id, scheduleData)
    
    if (!schedule) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Class schedule not found'
      })
    }

    return { success: true, data: schedule }
  } catch (error) {
    console.error('Error updating class schedule:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Error updating class schedule'
    })
  }
})