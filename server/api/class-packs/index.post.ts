import { H3Event } from 'h3'
import { createClassPack, ClassPackInput } from '~/server/utils/class-packs'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const body = await readBody(event)
    const classPackData: ClassPackInput = {
      name: body.name,
      description: body.description,
      credits: body.credits,
      price: body.price,
      duration_days: body.duration_days,
      stripe_price_id: body.stripe_price_id,
      features: body.features,
      created_by: body.created_by
    }

    const classPack = await createClassPack(classPackData)
    return { success: true, data: classPack }
  } catch (error) {
    console.error('Error creating class pack:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Error creating class pack'
    })
  }
})