import { H3Event } from 'h3'
import { updateUser, UserInput } from '~/server/utils/users'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)
    
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User ID is required'
      })
    }

    const userData: UserInput = {
      email: body.email,
      phone: body.phone,
      locale: body.locale,
      timezone: body.timezone,
      first_name: body.first_name,
      last_name: body.last_name,
      birth_date: body.birth_date,
      gender: body.gender,
      emergency_contact_name: body.emergency_contact_name,
      emergency_contact_phone: body.emergency_contact_phone,
      medical_conditions: body.medical_conditions,
      allergies: body.allergies,
      fitness_goals: body.fitness_goals,
      preferred_class_types: body.preferred_class_types,
      marketing_consent: body.marketing_consent,
      terms_accepted: body.terms_accepted,
      status: body.status,
      stripe_customer_id: body.stripe_customer_id,
      updated_by: body.updated_by
    }

    const user = await updateUser(id, userData)
    
    if (!user) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found'
      })
    }

    return { success: true, data: user }
  } catch (error) {
    console.error('Error updating user:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Error updating user'
    })
  }
})