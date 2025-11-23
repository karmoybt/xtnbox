import { H3Event } from 'h3'
import { getLeadById } from '~/server/utils/leads'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const id = getRouterParam(event, 'id')
    
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Lead ID is required'
      })
    }

    const lead = await getLeadById(id)
    
    if (!lead) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Lead not found'
      })
    }

    return { success: true, data: lead }
  } catch (error) {
    console.error('Error fetching lead:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Error fetching lead'
    })
  }
})