import { H3Event } from 'h3'
import { getClassInstanceById } from '~/server/utils/class-instances'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const id = getRouterParam(event, 'id')
    
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Class Instance ID is required'
      })
    }

    const instance = await getClassInstanceById(id)
    
    if (!instance) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Class instance not found'
      })
    }

    return { success: true, data: instance }
  } catch (error) {
    console.error('Error fetching class instance:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Error fetching class instance'
    })
  }
})