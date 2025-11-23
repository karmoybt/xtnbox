import { H3Event } from 'h3'
import { deleteUser } from '~/server/utils/users'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const id = getRouterParam(event, 'id')
    
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User ID is required'
      })
    }

    const result = await deleteUser(id)
    
    if (!result) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found'
      })
    }

    return { success: true, message: 'User marked as deleted' }
  } catch (error) {
    console.error('Error deleting user:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Error deleting user'
    })
  }
})