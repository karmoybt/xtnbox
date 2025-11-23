import { H3Event } from 'h3'
import { createUser, UserInput } from '~/server/utils/users'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const body = await readBody(event)
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
      status: body.status || 'active',
      stripe_customer_id: body.stripe_customer_id,
      created_by: body.created_by
    }

    const user = await createUser(userData)
    return { success: true, data: user }
  } catch (error) {
    console.error('Error creating user:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Error creating user'
    })
  }
})