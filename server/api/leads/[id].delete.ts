import { H3Event } from 'h3'
import { deleteLead } from '~/server/utils/leads'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const id = getRouterParam(event, 'id')
    
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Lead ID is required'
      })
    }

    const result = await deleteLead(id)
    
    if (!result) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Lead not found'
      })
    }

    return { success: true, message: 'Lead marked as deleted' }
  } catch (error) {
    console.error('Error deleting lead:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Error deleting lead'
    })
  }
})