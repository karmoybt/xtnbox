import { H3Event } from 'h3'
import { updateClassInstance, ClassInstanceInput } from '~/server/utils/class-instances'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)
    
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Class Instance ID is required'
      })
    }

    const instanceData: ClassInstanceInput = {
      class_schedule_id: body.class_schedule_id,
      scheduled_date: body.scheduled_date,
      start_time: body.start_time,
      duration: body.duration,
      instructor_id: body.instructor_id,
      location: body.location,
      status: body.status,
      max_capacity: body.max_capacity,
      updated_by: body.updated_by
    }

    const instance = await updateClassInstance(id, instanceData)
    
    if (!instance) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Class instance not found'
      })
    }

    return { success: true, data: instance }
  } catch (error) {
    console.error('Error updating class instance:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Error updating class instance'
    })
  }
})