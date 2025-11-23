import { H3Event } from 'h3'
import { getUsers } from '~/server/utils/users'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const users = await getUsers()
    return { success: true, data: users }
  } catch (error) {
    console.error('Error fetching users:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Error fetching users'
    })
  }
})