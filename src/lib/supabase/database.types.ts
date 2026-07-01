export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role?: Database["public"]["Enums"]["app_role"]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      content_countries: {
        Row: {
          code: string
          name: string
          slug: string
          status: string
          summary: string
          source_ids: string[]
          last_reviewed_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          code: string
          name: string
          slug: string
          status: string
          summary: string
          source_ids?: string[]
          last_reviewed_at: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          code?: string
          name?: string
          slug?: string
          status?: string
          summary?: string
          source_ids?: string[]
          last_reviewed_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      content_sources: {
        Row: {
          id: string
          title: string
          url: string
          source_type: string
          country_code: string
          language: string
          last_reviewed_at: string
          description: string
          confidence: string
          applies_to_citizenship: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          title: string
          url: string
          source_type: string
          country_code: string
          language: string
          last_reviewed_at: string
          description: string
          confidence: string
          applies_to_citizenship?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          url?: string
          source_type?: string
          country_code?: string
          language?: string
          last_reviewed_at?: string
          description?: string
          confidence?: string
          applies_to_citizenship?: string[]
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_sources_country_code_fkey"
            columns: ["country_code"]
            referencedRelation: "content_countries"
            referencedColumns: ["code"]
          },
        ]
      }
      content_routes: {
        Row: {
          id: string
          country_code: string
          title: string
          short_description: string
          entry_type: string
          goals: string[]
          stay_durations: string[]
          publication_status: string
          confidence: string
          last_reviewed_at: string
          base_difficulty: number
          requirements: Json
          supports: Json
          timeline: Json
          cost: Json
          documents: string[]
          source_ids: string[]
          steps: Json
          risks: string[]
          decision_graph: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          country_code: string
          title: string
          short_description: string
          entry_type: string
          goals: string[]
          stay_durations: string[]
          publication_status: string
          confidence: string
          last_reviewed_at: string
          base_difficulty: number
          requirements?: Json
          supports?: Json
          timeline?: Json
          cost?: Json
          documents?: string[]
          source_ids?: string[]
          steps?: Json
          risks?: string[]
          decision_graph?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          country_code?: string
          title?: string
          short_description?: string
          entry_type?: string
          goals?: string[]
          stay_durations?: string[]
          publication_status?: string
          confidence?: string
          last_reviewed_at?: string
          base_difficulty?: number
          requirements?: Json
          supports?: Json
          timeline?: Json
          cost?: Json
          documents?: string[]
          source_ids?: string[]
          steps?: Json
          risks?: string[]
          decision_graph?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_routes_country_code_fkey"
            columns: ["country_code"]
            referencedRelation: "content_countries"
            referencedColumns: ["code"]
          },
        ]
      }
      partner_leads: {
        Row: {
          id: string
          organization_name: string
          contact_name: string
          contact: string
          website: string
          countries: string
          services: string
          message: string
          consent: boolean
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_name: string
          contact_name: string
          contact: string
          website?: string
          countries: string
          services: string
          message: string
          consent: boolean
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_name?: string
          contact_name?: string
          contact?: string
          website?: string
          countries?: string
          services?: string
          message?: string
          consent?: boolean
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_questionnaires: {
        Row: {
          id: string
          user_id: string
          profile: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          profile: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          profile?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      saved_route_plans: {
        Row: {
          id: string
          user_id: string
          route_id: string
          profile: Json | null
          assessment: Json | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          route_id: string
          profile?: Json | null
          assessment?: Json | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          route_id?: string
          profile?: Json | null
          assessment?: Json | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      specialist_requests: {
        Row: {
          id: string
          user_id: string
          route_id: string
          route_title: string
          country_name: string
          user_name: string
          contact: string
          question: string
          profile: Json | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          route_id: string
          route_title: string
          country_name: string
          user_name: string
          contact: string
          question: string
          profile?: Json | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          route_id?: string
          route_title?: string
          country_name?: string
          user_name?: string
          contact?: string
          question?: string
          profile?: Json | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      is_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
    }
    Enums: {
      app_role: "user" | "admin"
    }
    CompositeTypes: Record<string, never>
  }
}
