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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      article_topics: {
        Row: {
          article_id: string
          topic_id: string
        }
        Insert: {
          article_id: string
          topic_id: string
        }
        Update: {
          article_id?: string
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_topics_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_topics_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          audience: Database["public"]["Enums"]["audience_type"]
          body: string | null
          created_at: string
          excerpt: string | null
          expert_id: string | null
          id: string
          published_at: string | null
          slug: string
          title: string
          updated_at: string
          views: number
        }
        Insert: {
          audience?: Database["public"]["Enums"]["audience_type"]
          body?: string | null
          created_at?: string
          excerpt?: string | null
          expert_id?: string | null
          id?: string
          published_at?: string | null
          slug: string
          title: string
          updated_at?: string
          views?: number
        }
        Update: {
          audience?: Database["public"]["Enums"]["audience_type"]
          body?: string | null
          created_at?: string
          excerpt?: string | null
          expert_id?: string | null
          id?: string
          published_at?: string | null
          slug?: string
          title?: string
          updated_at?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "articles_expert_id_fkey"
            columns: ["expert_id"]
            isOneToOne: false
            referencedRelation: "experts"
            referencedColumns: ["id"]
          },
        ]
      }
      assistant_conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string
          title: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string
          title?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string
          title?: string | null
          user_id?: string
        }
        Relationships: []
      }
      assistant_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          sources: Json | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          sources?: Json | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          sources?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "assistant_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "assistant_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      bookmarks: {
        Row: {
          created_at: string
          document_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      currency_rates: {
        Row: {
          change_value: number | null
          created_at: string
          currency_code: string
          currency_name: string
          id: string
          rate: number
          rate_date: string
        }
        Insert: {
          change_value?: number | null
          created_at?: string
          currency_code: string
          currency_name: string
          id?: string
          rate: number
          rate_date: string
        }
        Update: {
          change_value?: number | null
          created_at?: string
          currency_code?: string
          currency_name?: string
          id?: string
          rate?: number
          rate_date?: string
        }
        Relationships: []
      }
      deadline_calendar: {
        Row: {
          audience: Database["public"]["Enums"]["audience_type"]
          category: string
          created_at: string
          deadline_date: string
          description: string | null
          id: string
          title: string
        }
        Insert: {
          audience?: Database["public"]["Enums"]["audience_type"]
          category?: string
          created_at?: string
          deadline_date: string
          description?: string | null
          id?: string
          title: string
        }
        Update: {
          audience?: Database["public"]["Enums"]["audience_type"]
          category?: string
          created_at?: string
          deadline_date?: string
          description?: string | null
          id?: string
          title?: string
        }
        Relationships: []
      }
      document_sections: {
        Row: {
          content: string | null
          created_at: string
          document_id: string
          heading: string | null
          id: string
          level: number
          sort_order: number
        }
        Insert: {
          content?: string | null
          created_at?: string
          document_id: string
          heading?: string | null
          id?: string
          level?: number
          sort_order?: number
        }
        Update: {
          content?: string | null
          created_at?: string
          document_id?: string
          heading?: string | null
          id?: string
          level?: number
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_sections_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_topics: {
        Row: {
          document_id: string
          topic_id: string
        }
        Insert: {
          document_id: string
          topic_id: string
        }
        Update: {
          document_id?: string
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_topics_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_topics_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      document_versions: {
        Row: {
          change_type: Database["public"]["Enums"]["change_type"]
          detected_at: string
          document_id: string
          id: string
          summary: string | null
          version_number: number
        }
        Insert: {
          change_type: Database["public"]["Enums"]["change_type"]
          detected_at?: string
          document_id: string
          id?: string
          summary?: string | null
          version_number?: number
        }
        Update: {
          change_type?: Database["public"]["Enums"]["change_type"]
          detected_at?: string
          document_id?: string
          id?: string
          summary?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_versions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          body_text: string | null
          created_at: string
          date_adopted: string | null
          date_effective: string | null
          doc_number: string | null
          doc_type: string
          fts: unknown
          id: string
          is_free: boolean | null
          organ: string | null
          reg_date: string | null
          reg_number: string | null
          slug: string | null
          source_url: string | null
          status: Database["public"]["Enums"]["document_status"]
          summary: string | null
          title: string
          updated_at: string
          view_count: number | null
        }
        Insert: {
          body_text?: string | null
          created_at?: string
          date_adopted?: string | null
          date_effective?: string | null
          doc_number?: string | null
          doc_type?: string
          fts?: unknown
          id?: string
          is_free?: boolean | null
          organ?: string | null
          reg_date?: string | null
          reg_number?: string | null
          slug?: string | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          summary?: string | null
          title: string
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          body_text?: string | null
          created_at?: string
          date_adopted?: string | null
          date_effective?: string | null
          doc_number?: string | null
          doc_type?: string
          fts?: unknown
          id?: string
          is_free?: boolean | null
          organ?: string | null
          reg_date?: string | null
          reg_number?: string | null
          slug?: string | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          summary?: string | null
          title?: string
          updated_at?: string
          view_count?: number | null
        }
        Relationships: []
      }
      experts: {
        Row: {
          article_count: number
          avatar_url: string | null
          bio: string | null
          created_at: string
          id: string
          name: string
          specialty: string | null
        }
        Insert: {
          article_count?: number
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          name: string
          specialty?: string | null
        }
        Update: {
          article_count?: number
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          name?: string
          specialty?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ai_requests_reset_at: string | null
          ai_requests_today: number | null
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          full_name: string | null
          id: string
          plan: string | null
          plan_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_requests_reset_at?: string | null
          ai_requests_today?: number | null
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          plan?: string | null
          plan_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_requests_reset_at?: string | null
          ai_requests_today?: number | null
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          plan?: string | null
          plan_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscription_requests: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
          phone: string | null
          plan: string
          status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          phone?: string | null
          plan: string
          status?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          plan?: string
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          document_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          created_at: string
          description: string | null
          document_count: number
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          document_count?: number
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          document_count?: number
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      user_activity: {
        Row: {
          action: string
          created_at: string
          document_id: string | null
          id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          document_id?: string | null
          id?: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          document_id?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
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
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          audience: Database["public"]["Enums"]["audience_type"]
          created_at: string
          email_notifications: boolean
          id: string
          theme: string
          update_frequency: string
          updated_at: string
          user_id: string
        }
        Insert: {
          audience?: Database["public"]["Enums"]["audience_type"]
          created_at?: string
          email_notifications?: boolean
          id?: string
          theme?: string
          update_frequency?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          audience?: Database["public"]["Enums"]["audience_type"]
          created_at?: string
          email_notifications?: boolean
          id?: string
          theme?: string
          update_frequency?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      view_history: {
        Row: {
          document_id: string
          id: string
          user_id: string
          viewed_at: string | null
        }
        Insert: {
          document_id: string
          id?: string
          user_id: string
          viewed_at?: string | null
        }
        Update: {
          document_id?: string
          id?: string
          user_id?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "view_history_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_view_count: { Args: { doc_id: string }; Returns: undefined }
    }
    Enums: {
      app_role: "user" | "admin"
      audience_type: "accountant" | "lawyer" | "general"
      change_type: "amended" | "new_version" | "repealed"
      document_status: "active" | "amended" | "repealed"
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
      app_role: ["user", "admin"],
      audience_type: ["accountant", "lawyer", "general"],
      change_type: ["amended", "new_version", "repealed"],
      document_status: ["active", "amended", "repealed"],
    },
  },
} as const
