export type ReviewAspect =
  | 'security'
  | 'electricity'
  | 'water'
  | 'landlord_responsiveness'
  | 'landlord_relationship'
  | 'aesthetics'
  | 'sanitation'
  | 'amenities'

export const REVIEW_ASPECTS: { key: ReviewAspect; label: string }[] = [
  { key: 'security', label: 'Security' },
  { key: 'electricity', label: 'Electricity' },
  { key: 'water', label: 'Water' },
  { key: 'landlord_responsiveness', label: 'Landlord Responsiveness' },
  { key: 'landlord_relationship', label: 'Landlord Relationship' },
  { key: 'aesthetics', label: 'Aesthetics' },
  { key: 'sanitation', label: 'Sanitation' },
  { key: 'amenities', label: 'Amenities' },
]

export type VerificationStatus = 'pending' | 'verified' | 'rejected'
export type FeedFilter = 'all' | 'verified' | 'unverified'
