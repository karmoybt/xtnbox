import { H3Event } from 'h3'
import { getUserById } from '~/server/utils/users'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const id = getRouterParam(event, 'id')
    
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User ID is required'
      })
    }

    const user = await getUserById(id)
    
    if (!user) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found'
      })
    }

    return { success: true, data: user }
  } catch (error) {
    console.error('Error fetching user:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Error fetching user'
    })
  }
})