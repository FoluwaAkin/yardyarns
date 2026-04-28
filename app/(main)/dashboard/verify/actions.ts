'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { sendTenancyNotification } from '@/lib/email'

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
  // Validate the user via the cookie-based session client
  const authClient = await createClient()
  const { data: { session } } = await authClient.auth.getSession()
  if (!session) redirect('/auth/signin?redirectTo=/dashboard/verify')

  const user = session.user

  // Create a DB client that explicitly carries the user's JWT in the
  // Authorization header. This guarantees auth.uid() works in Postgres
  // regardless of how cookies are forwarded by the framework.
  const db = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${session.access_token}` } } }
  )

  // Find or create property
  const { data: existingProperty } = await db
    .from('properties')
    .select('id')
    .ilike('address', formData.address.trim())
    .ilike('city', formData.city.trim())
    .maybeSingle()

  let propertyId: string

  if (existingProperty) {
    propertyId = existingProperty.id
  } else {
    const { data: newProperty, error: propError } = await db
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
      return { error: propError?.message ?? 'Failed to create property.' }
    }
    propertyId = newProperty.id
  }

  // Find or create unit
  const { data: existingUnit } = await db
    .from('units')
    .select('id')
    .eq('property_id', propertyId)
    .ilike('unit_identifier', formData.unitIdentifier.trim())
    .maybeSingle()

  let unitId: string

  if (existingUnit) {
    unitId = existingUnit.id
  } else {
    const { data: newUnit, error: unitError } = await db
      .from('units')
      .insert({ property_id: propertyId, unit_identifier: formData.unitIdentifier.trim() })
      .select('id')
      .single()

    if (unitError || !newUnit) {
      return { error: unitError?.message ?? 'Failed to create unit.' }
    }
    unitId = newUnit.id
  }

  // Duplicate guard — block if a non-rejected tenancy already exists for this user+unit
  const { data: existingTenancy } = await db
    .from('tenancies')
    .select('id, verification_status')
    .eq('user_id', user.id)
    .eq('unit_id', unitId)
    .in('verification_status', ['pending', 'verified'])
    .maybeSingle()

  if (existingTenancy) {
    if (existingTenancy.verification_status === 'verified') {
      return { error: 'You already have a verified tenancy for this unit.' }
    }
    return { error: 'You already submitted a verification request for this unit. We\'ll notify you once it\'s reviewed.' }
  }

  // Insert tenancy
  const { error: tenancyError } = await db.from('tenancies').insert({
    user_id: user.id,
    unit_id: unitId,
    start_date: formData.startDate,
    end_date: formData.endDate || null,
    agreement_url: formData.agreementPath,
    verification_status: 'pending',
  })

  if (tenancyError) {
    return { error: tenancyError.message }
  }

  // Fetch username + email for the notification (best-effort — don't fail the request if it errors)
  const [profileResult] = await Promise.all([
    db.from('profiles').select('username').eq('id', user.id).single(),
  ])

  await sendTenancyNotification({
    username: profileResult.data?.username ?? user.id,
    userEmail: user.email ?? 'unknown',
    propertyAddress: `${formData.address}, ${formData.city}, ${formData.state}`,
    unitIdentifier: formData.unitIdentifier,
    startDate: formData.startDate,
    endDate: formData.endDate || null,
    agreementPath: formData.agreementPath,
  }).catch(() => {
    // Swallow email errors — tenancy was saved successfully
  })

  return { error: null }
}
