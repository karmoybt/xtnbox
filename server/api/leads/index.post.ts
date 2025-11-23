import { H3Event } from 'h3'
import { createLead, LeadInput } from '~/server/utils/leads'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const body = await readBody(event)
    const leadData: LeadInput = {
      email: body.email,
      phone: body.phone,
      first_name: body.first_name,
      last_name: body.last_name,
      source: body.source,
      status: body.status || 'new',
      utm_source: body.utm_source,
      utm_medium: body.utm_medium,
      utm_campaign: body.utm_campaign,
      notes: body.notes,
      assigned_to: body.assigned_to,
      created_by: body.created_by
    }

    const lead = await createLead(leadData)
    return { success: true, data: lead }
  } catch (error) {
    console.error('Error creating lead:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Error creating lead'
    })
  }
})