import { H3Event } from 'h3'
import { getAttendanceRecords } from '~/server/utils/attendance'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const query = getQuery(event)
    const user_id = query.user_id as string | undefined
    const from = query.from as string | undefined
    const to = query.to as string | undefined
    
    const attendanceRecords = await getAttendanceRecords(user_id, from, to)
    return { success: true, data: attendanceRecords }
  } catch (error) {
    console.error('Error fetching attendance records:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Error fetching attendance records'
    })
  }
})