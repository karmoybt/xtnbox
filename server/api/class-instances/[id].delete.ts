import { H3Event } from 'h3'
import { deleteClassInstance } from '~/server/utils/class-instances'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const id = getRouterParam(event, 'id')
    
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Class Instance ID is required'
      })
    }

    const result = await deleteClassInstance(id)
    
    if (!result) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Class instance not found'
      })
    }

    return { success: true, message: 'Class instance marked as deleted' }
  } catch (error) {
    console.error('Error deleting class instance:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Error deleting class instance'
    })
  }
})