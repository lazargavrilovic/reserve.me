export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type SubscriptionStatus = "trial" | "active" | "past_due" | "canceled"
export type AppointmentStatus = "confirmed" | "cancelled" | "completed" | "no_show"
export type MemberRole = "owner" | "staff"
export type SubscriptionPlan = "starter" | "pro" | "enterprise"

// Flat row types (used in queries)
export type BusinessRow = {
  id: string
  slug: string
  name: string
  description: string | null
  logo_url: string | null
  timezone: string
  paddle_customer_id: string | null
  paddle_subscription_id: string | null
  subscription_status: SubscriptionStatus
  subscription_plan: string
  created_at: string
}

export type UserRow = {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
}

export type BusinessMemberRow = {
  id: string
  business_id: string
  user_id: string
  role: MemberRole
  created_at: string
}

export type ServiceRow = {
  id: string
  business_id: string
  name: string
  description: string | null
  duration_minutes: number
  price_cents: number
  currency: string
  is_active: boolean
  created_at: string
}

export type StaffProfileRow = {
  id: string
  business_id: string
  user_id: string | null
  display_name: string
  bio: string | null
  avatar_url: string | null
  google_calendar_token: Json | null
  google_calendar_id: string | null
  ical_feed_url: string | null
}

export type AvailabilityRow = {
  id: string
  staff_id: string
  day_of_week: number
  start_time: string
  end_time: string
}

export type AvailabilityOverrideRow = {
  id: string
  staff_id: string
  date: string
  is_unavailable: boolean
  start_time: string | null
  end_time: string | null
  reason: string | null
}

export type AppointmentRow = {
  id: string
  business_id: string
  service_id: string
  staff_id: string
  client_id: string | null
  client_name: string
  client_email: string
  client_phone: string | null
  start_time: string
  end_time: string
  status: AppointmentStatus
  notes: string | null
  google_event_id: string | null
  ical_uid: string | null
  created_at: string
}

export type ClientRow = {
  id: string
  business_id: string
  user_id: string | null
  email: string
  full_name: string
  phone: string | null
  notes: string | null
  created_at: string
}

export type SubscriptionRow = {
  id: string
  business_id: string
  stripe_subscription_id: string
  plan: SubscriptionPlan
  status: string
  current_period_end: string
  created_at: string
}

// Supabase Database type
export interface Database {
  public: {
    Tables: {
      businesses: {
        Row: BusinessRow
        Insert: {
          id?: string
          slug: string
          name: string
          description?: string | null
          logo_url?: string | null
          timezone?: string
          paddle_customer_id?: string | null
          paddle_subscription_id?: string | null
          subscription_status?: SubscriptionStatus
          subscription_plan?: string
          created_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          description?: string | null
          logo_url?: string | null
          timezone?: string
          paddle_customer_id?: string | null
          paddle_subscription_id?: string | null
          subscription_status?: SubscriptionStatus
          subscription_plan?: string
          created_at?: string
        }
        Relationships: []
      }
      users: {
        Row: UserRow
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Relationships: []
      }
      business_members: {
        Row: BusinessMemberRow
        Insert: {
          id?: string
          business_id: string
          user_id: string
          role: MemberRole
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          user_id?: string
          role?: MemberRole
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_members_business_id_fkey"
            columns: ["business_id"]
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_members_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      services: {
        Row: ServiceRow
        Insert: {
          id?: string
          business_id: string
          name: string
          description?: string | null
          duration_minutes: number
          price_cents: number
          currency?: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          name?: string
          description?: string | null
          duration_minutes?: number
          price_cents?: number
          currency?: string
          is_active?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_business_id_fkey"
            columns: ["business_id"]
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          }
        ]
      }
      staff_profiles: {
        Row: StaffProfileRow
        Insert: {
          id?: string
          business_id: string
          user_id?: string | null
          display_name: string
          bio?: string | null
          avatar_url?: string | null
          google_calendar_token?: Json | null
          google_calendar_id?: string | null
          ical_feed_url?: string | null
        }
        Update: {
          id?: string
          business_id?: string
          user_id?: string | null
          display_name?: string
          bio?: string | null
          avatar_url?: string | null
          google_calendar_token?: Json | null
          google_calendar_id?: string | null
          ical_feed_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_profiles_business_id_fkey"
            columns: ["business_id"]
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          }
        ]
      }
      availability: {
        Row: AvailabilityRow
        Insert: {
          id?: string
          staff_id: string
          day_of_week: number
          start_time: string
          end_time: string
        }
        Update: {
          id?: string
          staff_id?: string
          day_of_week?: number
          start_time?: string
          end_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_staff_id_fkey"
            columns: ["staff_id"]
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      availability_overrides: {
        Row: AvailabilityOverrideRow
        Insert: {
          id?: string
          staff_id: string
          date: string
          is_unavailable?: boolean
          start_time?: string | null
          end_time?: string | null
          reason?: string | null
        }
        Update: {
          id?: string
          staff_id?: string
          date?: string
          is_unavailable?: boolean
          start_time?: string | null
          end_time?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "availability_overrides_staff_id_fkey"
            columns: ["staff_id"]
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      appointments: {
        Row: AppointmentRow
        Insert: {
          id?: string
          business_id: string
          service_id: string
          staff_id: string
          client_id?: string | null
          client_name: string
          client_email: string
          client_phone?: string | null
          start_time: string
          end_time: string
          status?: AppointmentStatus
          notes?: string | null
          google_event_id?: string | null
          ical_uid?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          service_id?: string
          staff_id?: string
          client_id?: string | null
          client_name?: string
          client_email?: string
          client_phone?: string | null
          start_time?: string
          end_time?: string
          status?: AppointmentStatus
          notes?: string | null
          google_event_id?: string | null
          ical_uid?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_business_id_fkey"
            columns: ["business_id"]
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          }
        ]
      }
      clients: {
        Row: ClientRow
        Insert: {
          id?: string
          business_id: string
          user_id?: string | null
          email: string
          full_name: string
          phone?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          user_id?: string | null
          email?: string
          full_name?: string
          phone?: string | null
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_business_id_fkey"
            columns: ["business_id"]
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          }
        ]
      }
      subscriptions: {
        Row: SubscriptionRow
        Insert: {
          id?: string
          business_id: string
          stripe_subscription_id: string
          plan: SubscriptionPlan
          status: string
          current_period_end: string
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          stripe_subscription_id?: string
          plan?: SubscriptionPlan
          status?: string
          current_period_end?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_business_id_fkey"
            columns: ["business_id"]
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
