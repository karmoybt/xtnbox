import { H3Event } from 'h3'
import { getClassInstances } from '~/server/utils/class-instances'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const query = getQuery(event)
    const date = query.date as string | undefined
    
    const instances = await getClassInstances(date)
    return { success: true, data: instances }
  } catch (error) {
    console.error('Error fetching class instances:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Error fetching class instances'
    })
  }
})