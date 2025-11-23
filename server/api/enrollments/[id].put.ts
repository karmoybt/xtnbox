import { H3Event } from 'h3'
import { updateEnrollment, EnrollmentInput } from '~/server/utils/enrollments'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)
    
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Enrollment ID is required'
      })
    }

    const enrollmentData: EnrollmentInput = {
      user_id: body.user_id,
      class_instance_id: body.class_instance_id,
      enrollment_type: body.enrollment_type,
      status: body.status,
      waitlist_position: body.waitlist_position,
      enrolled_at: body.enrolled_at,
      updated_by: body.updated_by
    }

    const enrollment = await updateEnrollment(id, enrollmentData)
    
    if (!enrollment) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Enrollment not found'
      })
    }

    return { success: true, data: enrollment }
  } catch (error) {
    console.error('Error updating enrollment:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Error updating enrollment'
    })
  }
})