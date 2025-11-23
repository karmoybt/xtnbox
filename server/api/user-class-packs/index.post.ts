import { H3Event } from 'h3'
import { createUserClassPack, UserClassPackInput } from '~/server/utils/user-class-packs'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const body = await readBody(event)
    const userClassPackData: UserClassPackInput = {
      user_id: body.user_id,
      class_pack_id: body.class_pack_id,
      purchased_credits: body.purchased_credits,
      remaining_credits: body.purchased_credits,
      price_paid: body.price_paid,
      purchase_date: body.purchase_date || new Date().toISOString(),
      expiration_date: body.expiration_date,
      stripe_payment_intent_id: body.stripe_payment_intent_id,
      created_by: body.created_by
    }

    const userClassPack = await createUserClassPack(userClassPackData)
    return { success: true, data: userClassPack }
  } catch (error) {
    console.error('Error creating user class pack:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Error creating user class pack'
    })
  }
})