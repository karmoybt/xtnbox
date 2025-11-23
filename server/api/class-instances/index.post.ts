import { H3Event } from 'h3'
import { createClassInstance, ClassInstanceInput } from '~/server/utils/class-instances'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const body = await readBody(event)
    const instanceData: ClassInstanceInput = {
      class_schedule_id: body.class_schedule_id,
      scheduled_date: body.scheduled_date,
      start_time: body.start_time,
      duration: body.duration,
      instructor_id: body.instructor_id,
      location: body.location,
      status: body.status || 'scheduled',
      max_capacity: body.max_capacity,
      created_by: body.created_by
    }

    const instance = await createClassInstance(instanceData)
    return { success: true, data: instance }
  } catch (error) {
    console.error('Error creating class instance:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Error creating class instance'
    })
  }
})