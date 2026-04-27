'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function submitTenancy(formData: {
  address: string
  city: string
  state: string
  country: string
  lat: number | null
  lng: number | null
  unitIdentifier: string
  startDate: string
  endDate: string
  agreementPath: string
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin?redirectTo=/dashboard/verify')

  // Find or create property
  const { data: existingProperty } = await supabase
    .from('properties')
    .select('id')
    .ilike('address', formData.address.trim())
    .ilike('city', formData.city.trim())
    .maybeSingle()

  let propertyId: string

  if (existingProperty) {
    propertyId = existingProperty.id
  } else {
    const { data: newProperty, error: propError } = await supabase
      .from('properties')
      .insert({
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        country: formData.country.trim(),
        lat: formData.lat,
        lng: formData.lng,
        created_by: user.id,
      })
      .select('id')
      .single()

    if (propError || !newProperty) {
      return { error: `Property: ${propError?.message ?? 'Unknown error'}` }
    }
    propertyId = newProperty.id
  }

  // Find or create unit
  const { data: existingUnit } = await supabase
    .from('units')
    .select('id')
    .eq('property_id', propertyId)
    .ilike('unit_identifier', formData.unitIdentifier.trim())
    .maybeSingle()

  let unitId: string

  if (existingUnit) {
    unitId = existingUnit.id
  } else {
    const { data: newUnit, error: unitError } = await supabase
      .from('units')
      .insert({ property_id: propertyId, unit_identifier: formData.unitIdentifier.trim() })
      .select('id')
      .single()

    if (unitError || !newUnit) {
      return { error: `Unit: ${unitError?.message ?? 'Unknown error'}` }
    }
    unitId = newUnit.id
  }

  // Insert tenancy
  const { error: tenancyError } = await supabase.from('tenancies').insert({
    user_id: user.id,
    unit_id: unitId,
    start_date: formData.startDate,
    end_date: formData.endDate || null,
    agreement_url: formData.agreementPath,
    verification_status: 'pending',
  })

  if (tenancyError) {
    return { error: `Tenancy: ${tenancyError.message}` }
  }

  return { error: null }
}
