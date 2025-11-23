import { H3Event } from 'h3'
import { createAttendance, AttendanceInput } from '~/server/utils/attendance'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const body = await readBody(event)
    const attendanceData: AttendanceInput = {
      user_id: body.user_id,
      class_instance_id: body.class_instance_id,
      status: body.status || 'attended',
      recorded_at: body.recorded_at || new Date().toISOString(),
      recorded_by: body.recorded_by
    }

    const attendance = await createAttendance(attendanceData)
    return { success: true, data: attendance }
  } catch (error) {
    console.error('Error creating attendance:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Error creating attendance'
    })
  }
})