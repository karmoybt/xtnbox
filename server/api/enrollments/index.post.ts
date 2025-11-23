import { H3Event } from 'h3'
import { createEnrollment, EnrollmentInput } from '~/server/utils/enrollments'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const body = await readBody(event)
    const enrollmentData: EnrollmentInput = {
      user_id: body.user_id,
      class_instance_id: body.class_instance_id,
      enrollment_type: body.enrollment_type,
      status: body.status || 'confirmed',
      waitlist_position: body.waitlist_position,
      enrolled_at: body.enrolled_at,
      created_by: body.created_by
    }

    const enrollment = await createEnrollment(enrollmentData)
    return { success: true, data: enrollment }
  } catch (error) {
    console.error('Error creating enrollment:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Error creating enrollment'
    })
  }
})