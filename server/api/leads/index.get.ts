import { H3Event } from 'h3'
import { getLeads } from '~/server/utils/leads'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const query = getQuery(event)
    const status = query.status as string | undefined
    
    const leads = await getLeads(status)
    return { success: true, data: leads }
  } catch (error) {
    console.error('Error fetching leads:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Error fetching leads'
    })
  }
})