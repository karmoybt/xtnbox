import { H3Event } from 'h3'
import { updateLead, LeadInput } from '~/server/utils/leads'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)
    
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Lead ID is required'
      })
    }

    const leadData: LeadInput = {
      email: body.email,
      phone: body.phone,
      first_name: body.first_name,
      last_name: body.last_name,
      source: body.source,
      status: body.status,
      utm_source: body.utm_source,
      utm_medium: body.utm_medium,
      utm_campaign: body.utm_campaign,
      notes: body.notes,
      assigned_to: body.assigned_to,
      updated_by: body.updated_by
    }

    const lead = await updateLead(id, leadData)
    
    if (!lead) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Lead not found'
      })
    }

    return { success: true, data: lead }
  } catch (error) {
    console.error('Error updating lead:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Error updating lead'
    })
  }
})