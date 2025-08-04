export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      contacts: {
        Row: {
          company: string | null
          contact_name: string
          contact_owner: string | null
          created_at: string | null
          description: string | null
          email: string | null
          id: string
          industry: Database["public"]["Enums"]["industry_type"] | null
          linkedin: string | null
          phone: string | null
          position: string | null
          region: Database["public"]["Enums"]["region_type"] | null
          source: Database["public"]["Enums"]["contact_source"] | null
          updated_at: string | null
          user_id: string
          website: string | null
        }
        Insert: {
          company?: string | null
          contact_name: string
          contact_owner?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          industry?: Database["public"]["Enums"]["industry_type"] | null
          linkedin?: string | null
          phone?: string | null
          position?: string | null
          region?: Database["public"]["Enums"]["region_type"] | null
          source?: Database["public"]["Enums"]["contact_source"] | null
          updated_at?: string | null
          user_id: string
          website?: string | null
        }
        Update: {
          company?: string | null
          contact_name?: string
          contact_owner?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          industry?: Database["public"]["Enums"]["industry_type"] | null
          linkedin?: string | null
          phone?: string | null
          position?: string | null
          region?: Database["public"]["Enums"]["region_type"] | null
          source?: Database["public"]["Enums"]["contact_source"] | null
          updated_at?: string | null
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      deals: {
        Row: {
          budget: number | null
          close_amount: number | null
          close_date: string | null
          close_reason: string | null
          company_name: string | null
          created_at: string | null
          deal_name: string
          decision_maker: string | null
          discussion_date: string | null
          discussion_notes: string | null
          id: string
          lead_description: string | null
          lead_name: string | null
          lead_owner: string | null
          lead_source: Database["public"]["Enums"]["contact_source"] | null
          negotiation_status: string | null
          next_follow_up: string | null
          offer_amount: number | null
          offer_date: string | null
          offer_terms: string | null
          offer_valid_until: string | null
          phone_no: string | null
          qualified_notes: string | null
          rfq_deadline: string | null
          rfq_requirements: string | null
          rfq_sent_date: string | null
          stage: Database["public"]["Enums"]["deal_stage"] | null
          timeline: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          budget?: number | null
          close_amount?: number | null
          close_date?: string | null
          close_reason?: string | null
          company_name?: string | null
          created_at?: string | null
          deal_name: string
          decision_maker?: string | null
          discussion_date?: string | null
          discussion_notes?: string | null
          id?: string
          lead_description?: string | null
          lead_name?: string | null
          lead_owner?: string | null
          lead_source?: Database["public"]["Enums"]["contact_source"] | null
          negotiation_status?: string | null
          next_follow_up?: string | null
          offer_amount?: number | null
          offer_date?: string | null
          offer_terms?: string | null
          offer_valid_until?: string | null
          phone_no?: string | null
          qualified_notes?: string | null
          rfq_deadline?: string | null
          rfq_requirements?: string | null
          rfq_sent_date?: string | null
          stage?: Database["public"]["Enums"]["deal_stage"] | null
          timeline?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          budget?: number | null
          close_amount?: number | null
          close_date?: string | null
          close_reason?: string | null
          company_name?: string | null
          created_at?: string | null
          deal_name?: string
          decision_maker?: string | null
          discussion_date?: string | null
          discussion_notes?: string | null
          id?: string
          lead_description?: string | null
          lead_name?: string | null
          lead_owner?: string | null
          lead_source?: Database["public"]["Enums"]["contact_source"] | null
          negotiation_status?: string | null
          next_follow_up?: string | null
          offer_amount?: number | null
          offer_date?: string | null
          offer_terms?: string | null
          offer_valid_until?: string | null
          phone_no?: string | null
          qualified_notes?: string | null
          rfq_deadline?: string | null
          rfq_requirements?: string | null
          rfq_sent_date?: string | null
          stage?: Database["public"]["Enums"]["deal_stage"] | null
          timeline?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          company_name: string | null
          created_at: string | null
          description: string | null
          email: string | null
          id: string
          industry: Database["public"]["Enums"]["industry_type"] | null
          lead_name: string
          lead_owner: string | null
          phone_no: string | null
          region: Database["public"]["Enums"]["region_type"] | null
          source: Database["public"]["Enums"]["contact_source"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          industry?: Database["public"]["Enums"]["industry_type"] | null
          lead_name: string
          lead_owner?: string | null
          phone_no?: string | null
          region?: Database["public"]["Enums"]["region_type"] | null
          source?: Database["public"]["Enums"]["contact_source"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_name?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          industry?: Database["public"]["Enums"]["industry_type"] | null
          lead_name?: string
          lead_owner?: string | null
          phone_no?: string | null
          region?: Database["public"]["Enums"]["region_type"] | null
          source?: Database["public"]["Enums"]["contact_source"] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      meeting_outcomes: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          interested_in_deal: boolean | null
          meeting_id: string
          next_steps: string | null
          outcome_type: string
          summary: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          interested_in_deal?: boolean | null
          meeting_id: string
          next_steps?: string | null
          outcome_type: string
          summary?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          interested_in_deal?: boolean | null
          meeting_id?: string
          next_steps?: string | null
          outcome_type?: string
          summary?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_meeting_outcomes_meeting_id"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          created_at: string | null
          description: string | null
          end_time: string | null
          id: string
          location: string | null
          start_time: string
          status: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          id?: string
          location?: string | null
          start_time: string
          status?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          id?: string
          location?: string | null
          start_time?: string
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          display_name: string
          email: string
          id: string
          last_login: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_name: string
          email: string
          id: string
          last_login?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string
          email?: string
          id?: string
          last_login?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      contact_source:
        | "Website"
        | "LinkedIn"
        | "Referral"
        | "Cold Call"
        | "Email Campaign"
        | "Trade Show"
        | "Other"
      deal_stage:
        | "Lead"
        | "Discussions"
        | "Qualified"
        | "RFQ"
        | "Offered"
        | "Won"
        | "Lost"
        | "Dropped"
      industry_type:
        | "Technology"
        | "Healthcare"
        | "Finance"
        | "Manufacturing"
        | "Retail"
        | "Education"
        | "Government"
        | "Other"
      region_type:
        | "North America"
        | "Europe"
        | "Asia Pacific"
        | "Latin America"
        | "Middle East"
        | "Africa"
      user_role: "Admin" | "Manager" | "User"
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
    Enums: {
      contact_source: [
        "Website",
        "LinkedIn",
        "Referral",
        "Cold Call",
        "Email Campaign",
        "Trade Show",
        "Other",
      ],
      deal_stage: [
        "Lead",
        "Discussions",
        "Qualified",
        "RFQ",
        "Offered",
        "Won",
        "Lost",
        "Dropped",
      ],
      industry_type: [
        "Technology",
        "Healthcare",
        "Finance",
        "Manufacturing",
        "Retail",
        "Education",
        "Government",
        "Other",
      ],
      region_type: [
        "North America",
        "Europe",
        "Asia Pacific",
        "Latin America",
        "Middle East",
        "Africa",
      ],
      user_role: ["Admin", "Manager", "User"],
    },
  },
} as const
