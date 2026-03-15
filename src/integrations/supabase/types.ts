export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          id: string
          metadata: Json | null
          new_value: string | null
          old_value: string | null
          performed_by: string
          target_user_id: string | null
          target_user_name: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          metadata?: Json | null
          new_value?: string | null
          old_value?: string | null
          performed_by: string
          target_user_id?: string | null
          target_user_name?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          new_value?: string | null
          old_value?: string | null
          performed_by?: string
          target_user_id?: string | null
          target_user_name?: string | null
        }
        Relationships: []
      }
      brand_partners: {
        Row: {
          active: boolean
          contact_email: string
          created_at: string
          id: string
          logo_url: string | null
          name: string
          password_hash: string
          slug: string
        }
        Insert: {
          active?: boolean
          contact_email: string
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          password_hash: string
          slug: string
        }
        Update: {
          active?: boolean
          contact_email?: string
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          password_hash?: string
          slug?: string
        }
        Relationships: []
      }
      collaboration_requests: {
        Row: {
          city: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          message: string | null
          portfolio_url: string | null
          role: string
          status: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          message?: string | null
          portfolio_url?: string | null
          role: string
          status?: string
        }
        Update: {
          city?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          message?: string | null
          portfolio_url?: string | null
          role?: string
          status?: string
        }
        Relationships: []
      }
      discount_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          user_id?: string
        }
        Relationships: []
      }
      event_registrations: {
        Row: {
          checked_in_at: string | null
          event_id: string
          id: string
          payment_status: string
          registered_at: string
          status: string
          stripe_payment_id: string | null
          user_id: string
          waitlist_position: number | null
        }
        Insert: {
          checked_in_at?: string | null
          event_id: string
          id?: string
          payment_status?: string
          registered_at?: string
          status?: string
          stripe_payment_id?: string | null
          user_id: string
          waitlist_position?: number | null
        }
        Update: {
          checked_in_at?: string | null
          event_id?: string
          id?: string
          payment_status?: string
          registered_at?: string
          status?: string
          stripe_payment_id?: string | null
          user_id?: string
          waitlist_position?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          access: string
          capacity: number | null
          created_at: string
          date: string
          description: string | null
          id: string
          location: string
          name: string
          price: number
          tag: string
        }
        Insert: {
          access: string
          capacity?: number | null
          created_at?: string
          date: string
          description?: string | null
          id?: string
          location: string
          name: string
          price?: number
          tag: string
        }
        Update: {
          access?: string
          capacity?: number | null
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          location?: string
          name?: string
          price?: number
          tag?: string
        }
        Relationships: []
      }
      guest_list_registrations: {
        Row: {
          created_at: string
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guest_list_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      invites: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          id: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          id?: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          id?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          metadata: Json | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          admin_notes: string | null
          age: number | null
          application_score: number | null
          application_status: string
          avatar_url: string | null
          bio: string | null
          buyer_tier: string
          city: string | null
          created_at: string
          email: string | null
          email_notifications: boolean
          event_frequency: string | null
          favourite_neighbourhoods: string | null
          full_name: string | null
          how_heard: string | null
          id: string
          ideal_night_out: string | null
          industry: string | null
          instagram: string | null
          interests: string[] | null
          invite_code: string | null
          job_title: string | null
          membership_type: string
          phone: string | null
          public_profile: boolean
          referral: string | null
          referral_code: string | null
          referral_notifications: boolean
          referred_by: string | null
          shopping_style: string | null
          tiktok: string | null
          total_points: number
          travel_style: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          age?: number | null
          application_score?: number | null
          application_status?: string
          avatar_url?: string | null
          bio?: string | null
          buyer_tier?: string
          city?: string | null
          created_at?: string
          email?: string | null
          email_notifications?: boolean
          event_frequency?: string | null
          favourite_neighbourhoods?: string | null
          full_name?: string | null
          how_heard?: string | null
          id?: string
          ideal_night_out?: string | null
          industry?: string | null
          instagram?: string | null
          interests?: string[] | null
          invite_code?: string | null
          job_title?: string | null
          membership_type?: string
          phone?: string | null
          public_profile?: boolean
          referral?: string | null
          referral_code?: string | null
          referral_notifications?: boolean
          referred_by?: string | null
          shopping_style?: string | null
          tiktok?: string | null
          total_points?: number
          travel_style?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          age?: number | null
          application_score?: number | null
          application_status?: string
          avatar_url?: string | null
          bio?: string | null
          buyer_tier?: string
          city?: string | null
          created_at?: string
          email?: string | null
          email_notifications?: boolean
          event_frequency?: string | null
          favourite_neighbourhoods?: string | null
          full_name?: string | null
          how_heard?: string | null
          id?: string
          ideal_night_out?: string | null
          industry?: string | null
          instagram?: string | null
          interests?: string[] | null
          invite_code?: string | null
          job_title?: string | null
          membership_type?: string
          phone?: string | null
          public_profile?: boolean
          referral?: string | null
          referral_code?: string | null
          referral_notifications?: boolean
          referred_by?: string | null
          shopping_style?: string | null
          tiktok?: string | null
          total_points?: number
          travel_style?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          amount: number
          brand_name: string
          created_at: string
          discount_code_id: string | null
          id: string
          notes: string | null
          purchase_date: string
          user_id: string
          verified_by: string | null
        }
        Insert: {
          amount: number
          brand_name: string
          created_at?: string
          discount_code_id?: string | null
          id?: string
          notes?: string | null
          purchase_date?: string
          user_id: string
          verified_by?: string | null
        }
        Update: {
          amount?: number
          brand_name?: string
          created_at?: string
          discount_code_id?: string | null
          id?: string
          notes?: string | null
          purchase_date?: string
          user_id?: string
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchases_discount_code_id_fkey"
            columns: ["discount_code_id"]
            isOneToOne: false
            referencedRelation: "discount_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_emails: {
        Row: {
          body: string
          created_at: string
          event_id: string
          id: string
          recipient_filter: string
          send_at: string
          status: string
          subject: string
        }
        Insert: {
          body: string
          created_at?: string
          event_id: string
          id?: string
          recipient_filter?: string
          send_at: string
          status?: string
          subject: string
        }
        Update: {
          body?: string
          created_at?: string
          event_id?: string
          id?: string
          recipient_filter?: string
          send_at?: string
          status?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_emails_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_invite: {
        Args: { p_code: string; p_user_id: string }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      register_for_event: {
        Args: { p_event_id: string; p_user_id: string }
        Returns: string
      }
      set_referral: {
        Args: { p_referral_code: string; p_user_id: string }
        Returns: undefined
      }
      validate_invite_code: { Args: { p_code: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
