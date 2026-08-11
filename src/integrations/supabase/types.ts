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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      entries: {
        Row: {
          captured_at: string
          check_me: boolean
          created_at: string
          day: string
          detail: Json
          id: string
          label: string
          photo_path: string | null
          section: string
          source: string
          user_id: string
          zone: string
        }
        Insert: {
          captured_at?: string
          check_me?: boolean
          created_at?: string
          day?: string
          detail?: Json
          id?: string
          label: string
          photo_path?: string | null
          section: string
          source: string
          user_id: string
          zone: string
        }
        Update: {
          captured_at?: string
          check_me?: boolean
          created_at?: string
          day?: string
          detail?: Json
          id?: string
          label?: string
          photo_path?: string | null
          section?: string
          source?: string
          user_id?: string
          zone?: string
        }
        Relationships: []
      }
      findings: {
        Row: {
          captured_at: string
          category: string
          check_me: boolean
          citation: string | null
          created_at: string
          day: string
          entry_id: string | null
          grade: string
          id: string
          line_1: string
          line_2: string | null
          line_3: string | null
          photo_path: string | null
          status: string
          user_id: string
          zone: string
        }
        Insert: {
          captured_at?: string
          category: string
          check_me?: boolean
          citation?: string | null
          created_at?: string
          day?: string
          entry_id?: string | null
          grade?: string
          id?: string
          line_1: string
          line_2?: string | null
          line_3?: string | null
          photo_path?: string | null
          status?: string
          user_id: string
          zone: string
        }
        Update: {
          captured_at?: string
          category?: string
          check_me?: boolean
          citation?: string | null
          created_at?: string
          day?: string
          entry_id?: string | null
          grade?: string
          id?: string
          line_1?: string
          line_2?: string | null
          line_3?: string | null
          photo_path?: string | null
          status?: string
          user_id?: string
          zone?: string
        }
        Relationships: [
          {
            foreignKeyName: "findings_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
        ]
      }
      memory: {
        Row: {
          created_at: string
          hits: number
          id: string
          kind: string
          last_used: string
          payload: Json
          user_id: string
          value: string
        }
        Insert: {
          created_at?: string
          hits?: number
          id?: string
          kind: string
          last_used?: string
          payload?: Json
          user_id: string
          value: string
        }
        Update: {
          created_at?: string
          hits?: number
          id?: string
          kind?: string
          last_used?: string
          payload?: Json
          user_id?: string
          value?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          client_name: string | null
          content: Json
          created_at: string
          day: string
          id: string
          kind: string
          overall_grade: string | null
          user_id: string
        }
        Insert: {
          client_name?: string | null
          content?: Json
          created_at?: string
          day?: string
          id?: string
          kind: string
          overall_grade?: string | null
          user_id: string
        }
        Update: {
          client_name?: string | null
          content?: Json
          created_at?: string
          day?: string
          id?: string
          kind?: string
          overall_grade?: string | null
          user_id?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      snags: {
        Row: {
          captured_at: string
          check_me: boolean
          citation: string | null
          close_out: string | null
          created_at: string
          day: string
          description: string
          entry_id: string | null
          id: string
          likely_cause: string | null
          location: string
          photo_path: string | null
          rectification: string | null
          severity: string
          trade: string
          user_id: string
          verdict: string | null
          zone: string
        }
        Insert: {
          captured_at?: string
          check_me?: boolean
          citation?: string | null
          close_out?: string | null
          created_at?: string
          day?: string
          description: string
          entry_id?: string | null
          id?: string
          likely_cause?: string | null
          location: string
          photo_path?: string | null
          rectification?: string | null
          severity?: string
          trade: string
          user_id: string
          verdict?: string | null
          zone: string
        }
        Update: {
          captured_at?: string
          check_me?: boolean
          citation?: string | null
          close_out?: string | null
          created_at?: string
          day?: string
          description?: string
          entry_id?: string | null
          id?: string
          likely_cause?: string | null
          location?: string
          photo_path?: string | null
          rectification?: string | null
          severity?: string
          trade?: string
          user_id?: string
          verdict?: string | null
          zone?: string
        }
        Relationships: [
          {
            foreignKeyName: "snags_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
