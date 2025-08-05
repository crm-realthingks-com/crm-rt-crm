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
          annual_revenue: number | null
          city: string | null
          company: string | null
          company_name: string | null
          contact_name: string
          contact_owner: string | null
          contact_source: Database["public"]["Enums"]["contact_source"] | null
          country: string | null
          created_at: string | null
          description: string | null
          email: string | null
          id: string
          industry: Database["public"]["Enums"]["industry_type"] | null
          lead_status: string | null
          linkedin: string | null
          mobile_no: string | null
          no_of_employees: number | null
          phone: string | null
          phone_no: string | null
          position: string | null
          region: Database["public"]["Enums"]["region_type"] | null
          source: Database["public"]["Enums"]["contact_source"] | null
          state: string | null
          updated_at: string | null
          user_id: string
          website: string | null
        }
        Insert: {
          annual_revenue?: number | null
          city?: string | null
          company?: string | null
          company_name?: string | null
          contact_name: string
          contact_owner?: string | null
          contact_source?: Database["public"]["Enums"]["contact_source"] | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          industry?: Database["public"]["Enums"]["industry_type"] | null
          lead_status?: string | null
          linkedin?: string | null
          mobile_no?: string | null
          no_of_employees?: number | null
          phone?: string | null
          phone_no?: string | null
          position?: string | null
          region?: Database["public"]["Enums"]["region_type"] | null
          source?: Database["public"]["Enums"]["contact_source"] | null
          state?: string | null
          updated_at?: string | null
          user_id: string
          website?: string | null
        }
        Update: {
          annual_revenue?: number | null
          city?: string | null
          company?: string | null
          company_name?: string | null
          contact_name?: string
          contact_owner?: string | null
          contact_source?: Database["public"]["Enums"]["contact_source"] | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          industry?: Database["public"]["Enums"]["industry_type"] | null
          lead_status?: string | null
          linkedin?: string | null
          mobile_no?: string | null
          no_of_employees?: number | null
          phone?: string | null
          phone_no?: string | null
          position?: string | null
          region?: Database["public"]["Enums"]["region_type"] | null
          source?: Database["public"]["Enums"]["contact_source"] | null
          state?: string | null
          updated_at?: string | null
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      deals: {
        Row: {
          action_items: string | null
          budget: number | null
          business_value: string | null
          close_amount: number | null
          close_date: string | null
          close_reason: string | null
          closing: string | null
          closing_date: string | null
          company_name: string | null
          created_at: string | null
          created_by: string | null
          currency_type: string | null
          current_status: string | null
          customer_challenges: string | null
          customer_name: string | null
          customer_need: string | null
          deal_name: string
          decision_maker: string | null
          decision_maker_level: string | null
          discussion_date: string | null
          discussion_notes: string | null
          drop_reason: string | null
          end_date: string | null
          expected_closing_date: string | null
          handoff_status: string | null
          id: string
          implementation_start_date: string | null
          internal_comment: string | null
          is_recurring: string | null
          lead_description: string | null
          lead_name: string | null
          lead_owner: string | null
          lead_source: Database["public"]["Enums"]["contact_source"] | null
          lost_reason: string | null
          mobile_no: string | null
          modified_at: string | null
          modified_by: string | null
          need_improvement: string | null
          negotiation_status: string | null
          next_follow_up: string | null
          offer_amount: number | null
          offer_date: string | null
          offer_terms: string | null
          offer_valid_until: string | null
          phone_no: string | null
          priority: number | null
          probability: number | null
          project_duration: number | null
          project_name: string | null
          proposal_due_date: string | null
          qualified_notes: string | null
          quarterly_revenue_q1: number | null
          quarterly_revenue_q2: number | null
          quarterly_revenue_q3: number | null
          quarterly_revenue_q4: number | null
          region: string | null
          relationship_strength: string | null
          rfq_deadline: string | null
          rfq_received_date: string | null
          rfq_requirements: string | null
          rfq_sent_date: string | null
          rfq_status: string | null
          signed_contract_date: string | null
          stage: Database["public"]["Enums"]["deal_stage"] | null
          start_date: string | null
          timeline: string | null
          total_contract_value: number | null
          total_revenue: number | null
          updated_at: string | null
          user_id: string
          won_reason: string | null
        }
        Insert: {
          action_items?: string | null
          budget?: number | null
          business_value?: string | null
          close_amount?: number | null
          close_date?: string | null
          close_reason?: string | null
          closing?: string | null
          closing_date?: string | null
          company_name?: string | null
          created_at?: string | null
          created_by?: string | null
          currency_type?: string | null
          current_status?: string | null
          customer_challenges?: string | null
          customer_name?: string | null
          customer_need?: string | null
          deal_name: string
          decision_maker?: string | null
          decision_maker_level?: string | null
          discussion_date?: string | null
          discussion_notes?: string | null
          drop_reason?: string | null
          end_date?: string | null
          expected_closing_date?: string | null
          handoff_status?: string | null
          id?: string
          implementation_start_date?: string | null
          internal_comment?: string | null
          is_recurring?: string | null
          lead_description?: string | null
          lead_name?: string | null
          lead_owner?: string | null
          lead_source?: Database["public"]["Enums"]["contact_source"] | null
          lost_reason?: string | null
          mobile_no?: string | null
          modified_at?: string | null
          modified_by?: string | null
          need_improvement?: string | null
          negotiation_status?: string | null
          next_follow_up?: string | null
          offer_amount?: number | null
          offer_date?: string | null
          offer_terms?: string | null
          offer_valid_until?: string | null
          phone_no?: string | null
          priority?: number | null
          probability?: number | null
          project_duration?: number | null
          project_name?: string | null
          proposal_due_date?: string | null
          qualified_notes?: string | null
          quarterly_revenue_q1?: number | null
          quarterly_revenue_q2?: number | null
          quarterly_revenue_q3?: number | null
          quarterly_revenue_q4?: number | null
          region?: string | null
          relationship_strength?: string | null
          rfq_deadline?: string | null
          rfq_received_date?: string | null
          rfq_requirements?: string | null
          rfq_sent_date?: string | null
          rfq_status?: string | null
          signed_contract_date?: string | null
          stage?: Database["public"]["Enums"]["deal_stage"] | null
          start_date?: string | null
          timeline?: string | null
          total_contract_value?: number | null
          total_revenue?: number | null
          updated_at?: string | null
          user_id: string
          won_reason?: string | null
        }
        Update: {
          action_items?: string | null
          budget?: number | null
          business_value?: string | null
          close_amount?: number | null
          close_date?: string | null
          close_reason?: string | null
          closing?: string | null
          closing_date?: string | null
          company_name?: string | null
          created_at?: string | null
          created_by?: string | null
          currency_type?: string | null
          current_status?: string | null
          customer_challenges?: string | null
          customer_name?: string | null
          customer_need?: string | null
          deal_name?: string
          decision_maker?: string | null
          decision_maker_level?: string | null
          discussion_date?: string | null
          discussion_notes?: string | null
          drop_reason?: string | null
          end_date?: string | null
          expected_closing_date?: string | null
          handoff_status?: string | null
          id?: string
          implementation_start_date?: string | null
          internal_comment?: string | null
          is_recurring?: string | null
          lead_description?: string | null
          lead_name?: string | null
          lead_owner?: string | null
          lead_source?: Database["public"]["Enums"]["contact_source"] | null
          lost_reason?: string | null
          mobile_no?: string | null
          modified_at?: string | null
          modified_by?: string | null
          need_improvement?: string | null
          negotiation_status?: string | null
          next_follow_up?: string | null
          offer_amount?: number | null
          offer_date?: string | null
          offer_terms?: string | null
          offer_valid_until?: string | null
          phone_no?: string | null
          priority?: number | null
          probability?: number | null
          project_duration?: number | null
          project_name?: string | null
          proposal_due_date?: string | null
          qualified_notes?: string | null
          quarterly_revenue_q1?: number | null
          quarterly_revenue_q2?: number | null
          quarterly_revenue_q3?: number | null
          quarterly_revenue_q4?: number | null
          region?: string | null
          relationship_strength?: string | null
          rfq_deadline?: string | null
          rfq_received_date?: string | null
          rfq_requirements?: string | null
          rfq_sent_date?: string | null
          rfq_status?: string | null
          signed_contract_date?: string | null
          stage?: Database["public"]["Enums"]["deal_stage"] | null
          start_date?: string | null
          timeline?: string | null
          total_contract_value?: number | null
          total_revenue?: number | null
          updated_at?: string | null
          user_id?: string
          won_reason?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          annual_revenue: number | null
          city: string | null
          company_name: string | null
          contact_name: string | null
          contact_source: Database["public"]["Enums"]["contact_source"] | null
          country: string | null
          created_at: string | null
          description: string | null
          email: string | null
          id: string
          industry: Database["public"]["Enums"]["industry_type"] | null
          lead_name: string
          lead_owner: string | null
          lead_status: string | null
          linkedin: string | null
          mobile_no: string | null
          no_of_employees: number | null
          phone_no: string | null
          position: string | null
          region: Database["public"]["Enums"]["region_type"] | null
          source: Database["public"]["Enums"]["contact_source"] | null
          state: string | null
          updated_at: string | null
          user_id: string
          website: string | null
        }
        Insert: {
          annual_revenue?: number | null
          city?: string | null
          company_name?: string | null
          contact_name?: string | null
          contact_source?: Database["public"]["Enums"]["contact_source"] | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          industry?: Database["public"]["Enums"]["industry_type"] | null
          lead_name: string
          lead_owner?: string | null
          lead_status?: string | null
          linkedin?: string | null
          mobile_no?: string | null
          no_of_employees?: number | null
          phone_no?: string | null
          position?: string | null
          region?: Database["public"]["Enums"]["region_type"] | null
          source?: Database["public"]["Enums"]["contact_source"] | null
          state?: string | null
          updated_at?: string | null
          user_id: string
          website?: string | null
        }
        Update: {
          annual_revenue?: number | null
          city?: string | null
          company_name?: string | null
          contact_name?: string | null
          contact_source?: Database["public"]["Enums"]["contact_source"] | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          industry?: Database["public"]["Enums"]["industry_type"] | null
          lead_name?: string
          lead_owner?: string | null
          lead_status?: string | null
          linkedin?: string | null
          mobile_no?: string | null
          no_of_employees?: number | null
          phone_no?: string | null
          position?: string | null
          region?: Database["public"]["Enums"]["region_type"] | null
          source?: Database["public"]["Enums"]["contact_source"] | null
          state?: string | null
          updated_at?: string | null
          user_id?: string
          website?: string | null
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
          agenda: string | null
          contact_id: string | null
          created_at: string | null
          created_by: string | null
          deal_id: string | null
          description: string | null
          end_time: string | null
          follow_up_required: boolean | null
          host: string | null
          id: string
          lead_id: string | null
          location: string | null
          next_action: string | null
          outcome: string | null
          participants: string[] | null
          priority: string | null
          start_time: string
          status: string | null
          tags: string[] | null
          teams_link: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          agenda?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          deal_id?: string | null
          description?: string | null
          end_time?: string | null
          follow_up_required?: boolean | null
          host?: string | null
          id?: string
          lead_id?: string | null
          location?: string | null
          next_action?: string | null
          outcome?: string | null
          participants?: string[] | null
          priority?: string | null
          start_time: string
          status?: string | null
          tags?: string[] | null
          teams_link?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          agenda?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          deal_id?: string | null
          description?: string | null
          end_time?: string | null
          follow_up_required?: boolean | null
          host?: string | null
          id?: string
          lead_id?: string | null
          location?: string | null
          next_action?: string | null
          outcome?: string | null
          participants?: string[] | null
          priority?: string | null
          start_time?: string
          status?: string | null
          tags?: string[] | null
          teams_link?: string | null
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
      yearly_revenue_targets: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          total_target: number
          updated_at: string | null
          year: number
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          total_target: number
          updated_at?: string | null
          year: number
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          total_target?: number
          updated_at?: string | null
          year?: number
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
