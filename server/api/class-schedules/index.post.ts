import { H3Event } from 'h3'
import { createClassSchedule, ClassScheduleInput } from '~/server/utils/class-schedules'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const body = await readBody(event)
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
      created_by: body.created_by
    }

    const schedule = await createClassSchedule(scheduleData)
    return { success: true, data: schedule }
  } catch (error) {
    console.error('Error creating class schedule:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Error creating class schedule'
    })
  }
})