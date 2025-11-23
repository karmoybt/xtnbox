import { H3Event } from 'h3'
import { getClassPacks } from '~/server/utils/class-packs'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const classPacks = await getClassPacks()
    return { success: true, data: classPacks }
  } catch (error) {
    console.error('Error fetching class packs:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Error fetching class packs'
    })
  }
})