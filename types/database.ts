export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          email_verified: boolean
          phone_verified: boolean
          created_at: string
        }
        Insert: {
          id: string
          username: string
          email_verified?: boolean
          phone_verified?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          email_verified?: boolean
          phone_verified?: boolean
          created_at?: string
        }
      }
      properties: {
        Row: {
          id: string
          name: string | null
          address: string
          city: string
          state: string
          country: string
          lat: number | null
          lng: number | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          name?: string | null
          address: string
          city: string
          state: string
          country: string
          lat?: number | null
          lng?: number | null
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string | null
          address?: string
          city?: string
          state?: string
          country?: string
          lat?: number | null
          lng?: number | null
          created_by?: string
          created_at?: string
        }
      }
      units: {
        Row: {
          id: string
          property_id: string
          unit_identifier: string
          created_at: string
        }
        Insert: {
          id?: string
          property_id: string
          unit_identifier: string
          created_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          unit_identifier?: string
          created_at?: string
        }
      }
      tenancies: {
        Row: {
          id: string
          user_id: string
          unit_id: string
          start_date: string
          end_date: string | null
          agreement_url: string | null
          verification_status: 'pending' | 'verified' | 'rejected'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          unit_id: string
          start_date: string
          end_date?: string | null
          agreement_url?: string | null
          verification_status?: 'pending' | 'verified' | 'rejected'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          unit_id?: string
          start_date?: string
          end_date?: string | null
          agreement_url?: string | null
          verification_status?: 'pending' | 'verified' | 'rejected'
          created_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          user_id: string
          unit_id: string
          tenancy_id: string | null
          period_start: string
          period_end: string
          body: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          unit_id: string
          tenancy_id?: string | null
          period_start: string
          period_end: string
          body: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          unit_id?: string
          tenancy_id?: string | null
          period_start?: string
          period_end?: string
          body?: string
          created_at?: string
        }
      }
      ratings: {
        Row: {
          id: string
          review_id: string
          aspect: string
          score: number
        }
        Insert: {
          id?: string
          review_id: string
          aspect: string
          score: number
        }
        Update: {
          id?: string
          review_id?: string
          aspect?: string
          score?: number
        }
      }
      posts: {
        Row: {
          id: string
          user_id: string
          unit_id: string
          body: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          unit_id: string
          body: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          unit_id?: string
          body?: string
          created_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          review_id: string | null
          post_id: string | null
          user_id: string
          parent_id: string | null
          body: string
          created_at: string
        }
        Insert: {
          id?: string
          review_id?: string | null
          post_id?: string | null
          user_id: string
          parent_id?: string | null
          body: string
          created_at?: string
        }
        Update: {
          id?: string
          review_id?: string | null
          post_id?: string | null
          user_id?: string
          parent_id?: string | null
          body?: string
          created_at?: string
        }
      }
      likes: {
        Row: {
          id: string
          review_id: string | null
          post_id: string | null
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          review_id?: string | null
          post_id?: string | null
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          review_id?: string | null
          post_id?: string | null
          user_id?: string
          created_at?: string
        }
      }
    }
    Views: {
      unit_aggregate_scores: {
        Row: {
          unit_id: string
          aspect: string
          avg_score: number
          review_count: number
        }
      }
    }
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
