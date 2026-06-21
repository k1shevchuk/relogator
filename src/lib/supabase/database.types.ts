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
