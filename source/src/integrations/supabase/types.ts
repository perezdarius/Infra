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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          detail: string | null
          entity: string
          entity_id: string | null
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          detail?: string | null
          entity: string
          entity_id?: string | null
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          detail?: string | null
          entity?: string
          entity_id?: string | null
          id?: string
        }
        Relationships: []
      }
      infrastructure_items: {
        Row: {
          category: Database["public"]["Enums"]["report_category"]
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          location: string
          name: string
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["report_category"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          location: string
          name: string
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["report_category"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          location?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      maintenance_records: {
        Row: {
          completed_date: string | null
          cost: number | null
          created_at: string
          created_by: string | null
          id: string
          infrastructure_id: string | null
          office: string | null
          report_id: string | null
          scheduled_date: string | null
          status: Database["public"]["Enums"]["maintenance_status"]
          updated_at: string
          work_description: string
        }
        Insert: {
          completed_date?: string | null
          cost?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          infrastructure_id?: string | null
          office?: string | null
          report_id?: string | null
          scheduled_date?: string | null
          status?: Database["public"]["Enums"]["maintenance_status"]
          updated_at?: string
          work_description: string
        }
        Update: {
          completed_date?: string | null
          cost?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          infrastructure_id?: string | null
          office?: string | null
          report_id?: string | null
          scheduled_date?: string | null
          status?: Database["public"]["Enums"]["maintenance_status"]
          updated_at?: string
          work_description?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_records_infrastructure_id_fkey"
            columns: ["infrastructure_id"]
            isOneToOne: false
            referencedRelation: "infrastructure_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_records_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "public_report_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_records_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "public_report_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_records_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          barangay: string | null
          created_at: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          barangay?: string | null
          created_at?: string
          full_name?: string
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          barangay?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      report_attachments: {
        Row: {
          created_at: string
          file_name: string
          id: string
          mime_type: string
          report_id: string
          size_bytes: number
          storage_path: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          file_name: string
          id?: string
          mime_type: string
          report_id: string
          size_bytes: number
          storage_path: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          file_name?: string
          id?: string
          mime_type?: string
          report_id?: string
          size_bytes?: number
          storage_path?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_attachments_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "public_report_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_attachments_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "public_report_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_attachments_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      report_internal_notes: {
        Row: {
          author_id: string
          created_at: string
          id: string
          note: string
          report_id: string
        }
        Insert: {
          author_id: string
          created_at?: string
          id?: string
          note: string
          report_id: string
        }
        Update: {
          author_id?: string
          created_at?: string
          id?: string
          note?: string
          report_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_internal_notes_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "public_report_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_internal_notes_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "public_report_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_internal_notes_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      report_resolutions: {
        Row: {
          created_at: string
          id: string
          photos: Json
          reply: string
          report_id: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          id?: string
          photos: Json
          reply: string
          report_id: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          id?: string
          photos?: Json
          reply?: string
          report_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_resolutions_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "public_report_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_resolutions_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "public_report_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_resolutions_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      report_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          from_status: Database["public"]["Enums"]["report_status"] | null
          id: string
          note: string | null
          report_id: string
          to_status: Database["public"]["Enums"]["report_status"]
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["report_status"] | null
          id?: string
          note?: string | null
          report_id: string
          to_status: Database["public"]["Enums"]["report_status"]
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["report_status"] | null
          id?: string
          note?: string | null
          report_id?: string
          to_status?: Database["public"]["Enums"]["report_status"]
        }
        Relationships: [
          {
            foreignKeyName: "report_status_history_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "public_report_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_status_history_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "public_report_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_status_history_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          address: string
          archive_reason: string | null
          archived_at: string | null
          archived_by: string | null
          assigned_office: string | null
          assigned_to: string | null
          barangay: string | null
          category: Database["public"]["Enums"]["report_category"]
          contact_phone: string | null
          created_at: string
          description: string
          duplicate_of: string | null
          duplicate_reason: string | null
          id: string
          landmark: string | null
          latitude: number | null
          longitude: number | null
          priority: Database["public"]["Enums"]["report_priority"]
          reference_no: string
          reporter_id: string
          resolution_id: string | null
          severity: Database["public"]["Enums"]["report_severity"]
          status: Database["public"]["Enums"]["report_status"]
          title: string
          updated_at: string
        }
        Insert: {
          address: string
          archive_reason?: string | null
          archived_at?: string | null
          archived_by?: string | null
          assigned_office?: string | null
          assigned_to?: string | null
          barangay?: string | null
          category: Database["public"]["Enums"]["report_category"]
          contact_phone?: string | null
          created_at?: string
          description: string
          duplicate_of?: string | null
          duplicate_reason?: string | null
          id?: string
          landmark?: string | null
          latitude?: number | null
          longitude?: number | null
          priority?: Database["public"]["Enums"]["report_priority"]
          reference_no?: string
          reporter_id: string
          resolution_id?: string | null
          severity: Database["public"]["Enums"]["report_severity"]
          status?: Database["public"]["Enums"]["report_status"]
          title: string
          updated_at?: string
        }
        Update: {
          address?: string
          archive_reason?: string | null
          archived_at?: string | null
          archived_by?: string | null
          assigned_office?: string | null
          assigned_to?: string | null
          barangay?: string | null
          category?: Database["public"]["Enums"]["report_category"]
          contact_phone?: string | null
          created_at?: string
          description?: string
          duplicate_of?: string | null
          duplicate_reason?: string | null
          id?: string
          landmark?: string | null
          latitude?: number | null
          longitude?: number | null
          priority?: Database["public"]["Enums"]["report_priority"]
          reference_no?: string
          reporter_id?: string
          resolution_id?: string | null
          severity?: Database["public"]["Enums"]["report_severity"]
          status?: Database["public"]["Enums"]["report_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_duplicate_of_fkey"
            columns: ["duplicate_of"]
            isOneToOne: false
            referencedRelation: "public_report_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_duplicate_of_fkey"
            columns: ["duplicate_of"]
            isOneToOne: false
            referencedRelation: "public_report_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_duplicate_of_fkey"
            columns: ["duplicate_of"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_resolution_id_fkey"
            columns: ["resolution_id"]
            isOneToOne: false
            referencedRelation: "public_report_resolutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_resolution_id_fkey"
            columns: ["resolution_id"]
            isOneToOne: false
            referencedRelation: "report_resolutions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_report_list: {
        Row: {
          barangay: string | null
          category: Database["public"]["Enums"]["report_category"] | null
          created_at: string | null
          description: string | null
          id: string | null
          reference_no: string | null
          severity: Database["public"]["Enums"]["report_severity"] | null
          status: Database["public"]["Enums"]["report_status"] | null
          title: string | null
        }
        Insert: {
          barangay?: string | null
          category?: Database["public"]["Enums"]["report_category"] | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          reference_no?: string | null
          severity?: Database["public"]["Enums"]["report_severity"] | null
          status?: Database["public"]["Enums"]["report_status"] | null
          title?: string | null
        }
        Update: {
          barangay?: string | null
          category?: Database["public"]["Enums"]["report_category"] | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          reference_no?: string | null
          severity?: Database["public"]["Enums"]["report_severity"] | null
          status?: Database["public"]["Enums"]["report_status"] | null
          title?: string | null
        }
        Relationships: []
      }
      public_report_resolutions: {
        Row: {
          created_at: string | null
          id: string | null
          photos: Json | null
          reply: string | null
          report_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_resolutions_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "public_report_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_resolutions_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "public_report_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_resolutions_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      public_report_stats: {
        Row: {
          category: Database["public"]["Enums"]["report_category"] | null
          created_at: string | null
          id: string | null
          month: string | null
          priority: Database["public"]["Enums"]["report_priority"] | null
          severity: Database["public"]["Enums"]["report_severity"] | null
          status: Database["public"]["Enums"]["report_status"] | null
        }
        Insert: {
          category?: Database["public"]["Enums"]["report_category"] | null
          created_at?: string | null
          id?: string | null
          month?: never
          priority?: Database["public"]["Enums"]["report_priority"] | null
          severity?: Database["public"]["Enums"]["report_severity"] | null
          status?: Database["public"]["Enums"]["report_status"] | null
        }
        Update: {
          category?: Database["public"]["Enums"]["report_category"] | null
          created_at?: string | null
          id?: string | null
          month?: never
          priority?: Database["public"]["Enums"]["report_priority"] | null
          severity?: Database["public"]["Enums"]["report_severity"] | null
          status?: Database["public"]["Enums"]["report_status"] | null
        }
        Relationships: []
      }
    }
    Functions: {
      archive_report: {
        Args: { _reason: string; _report_id: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_resolution_photo: { Args: { _path: string }; Returns: boolean }
      is_staff_or_admin: { Args: { _user_id: string }; Returns: boolean }
      public_report_photos: {
        Args: never
        Returns: {
          file_name: string
          mime_type: string
          report_id: string
          storage_path: string
        }[]
      }
      resolve_report: {
        Args: { _photos: Json; _reply: string; _report_id: string }
        Returns: string
      }
      restore_report: { Args: { _report_id: string }; Returns: undefined }
      update_report_status: {
        Args: {
          _note: string
          _report_id: string
          _status: Database["public"]["Enums"]["report_status"]
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "staff" | "resident"
      maintenance_status:
        | "planned"
        | "scheduled"
        | "in_progress"
        | "completed"
        | "cancelled"
      report_category:
        | "road"
        | "bridge"
        | "streetlight"
        | "drainage"
        | "sidewalk"
        | "public_building"
      report_priority: "low" | "normal" | "high" | "urgent"
      report_severity: "low" | "medium" | "high" | "critical"
      report_status:
        | "submitted"
        | "under_review"
        | "needs_info"
        | "assigned"
        | "scheduled"
        | "in_progress"
        | "resolved"
        | "duplicate"
        | "rejected"
        | "withdrawn"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "staff", "resident"],
      maintenance_status: [
        "planned",
        "scheduled",
        "in_progress",
        "completed",
        "cancelled",
      ],
      report_category: [
        "road",
        "bridge",
        "streetlight",
        "drainage",
        "sidewalk",
        "public_building",
      ],
      report_priority: ["low", "normal", "high", "urgent"],
      report_severity: ["low", "medium", "high", "critical"],
      report_status: [
        "submitted",
        "under_review",
        "needs_info",
        "assigned",
        "scheduled",
        "in_progress",
        "resolved",
        "duplicate",
        "rejected",
        "withdrawn",
      ],
    },
  },
} as const
