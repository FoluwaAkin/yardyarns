import { NextResponse, type NextRequest } from 'next/server'

const PLACES_URL = 'https://maps.googleapis.com/maps/api/place/autocomplete/json'
const DETAILS_URL = 'https://maps.googleapis.com/maps/api/place/details/json'

// GET /api/places?input=22+freedom+way   → autocomplete suggestions
// GET /api/places?placeId=ChIJ...        → place details (address components + lat/lng)
export async function GET(request: NextRequest) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey || apiKey === 'your_google_maps_api_key') {
    return NextResponse.json({ error: 'Google Maps API key not configured.' }, { status: 503 })
  }

  const { searchParams } = new URL(request.url)
  const input = searchParams.get('input')
  const placeId = searchParams.get('placeId')

  if (placeId) {
    // Fetch place details to get address components + geometry
    const url = new URL(DETAILS_URL)
    url.searchParams.set('place_id', placeId)
    url.searchParams.set('fields', 'address_components,formatted_address,geometry')
    url.searchParams.set('key', apiKey)

    const res = await fetch(url.toString())
    const data = await res.json()

    if (data.status !== 'OK') {
      return NextResponse.json({ error: data.status }, { status: 400 })
    }

    const components: { long_name: string; short_name: string; types: string[] }[] =
      data.result.address_components ?? []

    function get(type: string) {
      return components.find((c) => c.types.includes(type))?.long_name ?? ''
    }

    const streetNumber = get('street_number')
    const route = get('route')
    const address = [streetNumber, route].filter(Boolean).join(' ') || data.result.formatted_address
    const city = get('locality') || get('administrative_area_level_2')
    const state = get('administrative_area_level_1')
    const country = get('country')
    const lat = data.result.geometry?.location?.lat ?? null
    const lng = data.result.geometry?.location?.lng ?? null

    return NextResponse.json({ address, city, state, country, lat, lng, formatted: data.result.formatted_address })
  }

  if (!input || input.trim().length < 2) {
    return NextResponse.json({ predictions: [] })
  }

  const url = new URL(PLACES_URL)
  url.searchParams.set('input', input.trim())
  // No 'types' filter so named buildings, estates, and addresses all appear
  url.searchParams.set('components', 'country:ng')
  url.searchParams.set('key', apiKey)

  const res = await fetch(url.toString())
  const data = await res.json()

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    return NextResponse.json({ error: data.status, predictions: [] }, { status: 400 })
  }

  const predictions = (data.predictions ?? []).map((p: {
    place_id: string
    description: string
    structured_formatting: { main_text: string; secondary_text: string }
  }) => ({
    placeId: p.place_id,
    description: p.description,
    mainText: p.structured_formatting?.main_text ?? p.description,
    secondaryText: p.structured_formatting?.secondary_text ?? '',
  }))

  return NextResponse.json({ predictions })
}
