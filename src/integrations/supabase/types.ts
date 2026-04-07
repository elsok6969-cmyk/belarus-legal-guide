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
          created_at: string | null
          document_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          document_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
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
      calendar_subscriptions: {
        Row: {
          audience: string | null
          created_at: string | null
          email: string
          id: string
          tax_types: string[] | null
        }
        Insert: {
          audience?: string | null
          created_at?: string | null
          email: string
          id?: string
          tax_types?: string[] | null
        }
        Update: {
          audience?: string | null
          created_at?: string | null
          email?: string
          id?: string
          tax_types?: string[] | null
        }
        Relationships: []
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
      deadlines: {
        Row: {
          created_at: string
          deadline_date: string
          deadline_type: string
          description: string | null
          document_id: string | null
          id: string
          profession_tags: string[] | null
          recurrence_rule: string | null
          recurring: boolean
          title: string
        }
        Insert: {
          created_at?: string
          deadline_date: string
          deadline_type: string
          description?: string | null
          document_id?: string | null
          id?: string
          profession_tags?: string[] | null
          recurrence_rule?: string | null
          recurring?: boolean
          title: string
        }
        Update: {
          created_at?: string
          deadline_date?: string
          deadline_type?: string
          description?: string | null
          document_id?: string | null
          id?: string
          profession_tags?: string[] | null
          recurrence_rule?: string | null
          recurring?: boolean
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "deadlines_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_relations: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          relation_type: string
          source_document_id: string
          target_document_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          relation_type: string
          source_document_id: string
          target_document_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          relation_type?: string
          source_document_id?: string
          target_document_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_relations_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_relations_target_document_id_fkey"
            columns: ["target_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_sections: {
        Row: {
          content_markdown: string | null
          content_text: string | null
          created_at: string | null
          document_id: string
          id: string
          level: number
          number: string | null
          parent_id: string | null
          path: string | null
          section_type: string
          sort_order: number
          title: string | null
        }
        Insert: {
          content_markdown?: string | null
          content_text?: string | null
          created_at?: string | null
          document_id: string
          id?: string
          level?: number
          number?: string | null
          parent_id?: string | null
          path?: string | null
          section_type: string
          sort_order: number
          title?: string | null
        }
        Update: {
          content_markdown?: string | null
          content_text?: string | null
          created_at?: string | null
          document_id?: string
          id?: string
          level?: number
          number?: string | null
          parent_id?: string | null
          path?: string | null
          section_type?: string
          sort_order?: number
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_sections_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_sections_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "document_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      document_types: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name_ru: string
          slug: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name_ru: string
          slug: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name_ru?: string
          slug?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      document_versions: {
        Row: {
          change_description: string | null
          content_markdown: string | null
          content_text: string | null
          created_at: string | null
          document_id: string
          effective_date: string | null
          id: string
          version_number: number
        }
        Insert: {
          change_description?: string | null
          content_markdown?: string | null
          content_text?: string | null
          created_at?: string | null
          document_id: string
          effective_date?: string | null
          id?: string
          version_number: number
        }
        Update: {
          change_description?: string | null
          content_markdown?: string | null
          content_text?: string | null
          created_at?: string | null
          document_id?: string
          effective_date?: string | null
          id?: string
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
          content_markdown: string | null
          content_text: string | null
          created_at: string | null
          doc_date: string | null
          doc_number: string | null
          document_type_id: string
          effective_date: string | null
          expiry_date: string | null
          id: string
          issuing_body_id: string | null
          last_updated: string | null
          metadata: Json | null
          raw_html: string | null
          short_title: string | null
          source_url: string | null
          status: string
          title: string
          version: number | null
        }
        Insert: {
          content_markdown?: string | null
          content_text?: string | null
          created_at?: string | null
          doc_date?: string | null
          doc_number?: string | null
          document_type_id: string
          effective_date?: string | null
          expiry_date?: string | null
          id?: string
          issuing_body_id?: string | null
          last_updated?: string | null
          metadata?: Json | null
          raw_html?: string | null
          short_title?: string | null
          source_url?: string | null
          status?: string
          title: string
          version?: number | null
        }
        Update: {
          content_markdown?: string | null
          content_text?: string | null
          created_at?: string | null
          doc_date?: string | null
          doc_number?: string | null
          document_type_id?: string
          effective_date?: string | null
          expiry_date?: string | null
          id?: string
          issuing_body_id?: string | null
          last_updated?: string | null
          metadata?: Json | null
          raw_html?: string | null
          short_title?: string | null
          source_url?: string | null
          status?: string
          title?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_document_type_id_fkey"
            columns: ["document_type_id"]
            isOneToOne: false
            referencedRelation: "document_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_issuing_body_id_fkey"
            columns: ["issuing_body_id"]
            isOneToOne: false
            referencedRelation: "issuing_bodies"
            referencedColumns: ["id"]
          },
        ]
      }
      economic_indicators: {
        Row: {
          current_value: string
          effective_date: string | null
          id: string
          name_ru: string
          slug: string
          source_url: string | null
          updated_at: string
          value_type: string | null
        }
        Insert: {
          current_value: string
          effective_date?: string | null
          id?: string
          name_ru: string
          slug: string
          source_url?: string | null
          updated_at?: string
          value_type?: string | null
        }
        Update: {
          current_value?: string
          effective_date?: string | null
          id?: string
          name_ru?: string
          slug?: string
          source_url?: string | null
          updated_at?: string
          value_type?: string | null
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
      form_documents: {
        Row: {
          category: string
          created_at: string
          description: string | null
          file_size: number | null
          file_type: string | null
          file_url: string | null
          id: string
          is_fillable: boolean | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_fillable?: boolean | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_fillable?: boolean | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      guide_categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name_ru: string
          parent_id: string | null
          profession: string | null
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name_ru: string
          parent_id?: string | null
          profession?: string | null
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name_ru?: string
          parent_id?: string | null
          profession?: string | null
          slug?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "guide_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "guide_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_items: {
        Row: {
          category_id: string
          created_at: string
          description: string | null
          document_id: string | null
          id: string
          sort_order: number
          title_override: string | null
        }
        Insert: {
          category_id: string
          created_at?: string
          description?: string | null
          document_id?: string | null
          id?: string
          sort_order?: number
          title_override?: string | null
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string | null
          document_id?: string | null
          id?: string
          sort_order?: number
          title_override?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guide_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "guide_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_items_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      import_logs: {
        Row: {
          completed_at: string | null
          duration_ms: number | null
          error_message: string | null
          errors: number | null
          id: string
          imported: number | null
          limit_count: number | null
          started_at: string | null
          status: string | null
          type: string | null
          updated: number | null
        }
        Insert: {
          completed_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          errors?: number | null
          id?: string
          imported?: number | null
          limit_count?: number | null
          started_at?: string | null
          status?: string | null
          type?: string | null
          updated?: number | null
        }
        Update: {
          completed_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          errors?: number | null
          id?: string
          imported?: number | null
          limit_count?: number | null
          started_at?: string | null
          status?: string | null
          type?: string | null
          updated?: number | null
        }
        Relationships: []
      }
      issuing_bodies: {
        Row: {
          created_at: string | null
          id: string
          name_ru: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name_ru: string
          slug: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name_ru?: string
          slug?: string
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
      subscription_limits: {
        Row: {
          daily_limit: number | null
          feature: string
          id: string
          monthly_limit: number | null
          plan: string
        }
        Insert: {
          daily_limit?: number | null
          feature: string
          id?: string
          monthly_limit?: number | null
          plan: string
        }
        Update: {
          daily_limit?: number | null
          feature?: string
          id?: string
          monthly_limit?: number | null
          plan?: string
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
          created_at: string | null
          document_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          document_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
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
      tax_deadlines: {
        Row: {
          audience: string[] | null
          created_at: string | null
          deadline_date: string
          description: string | null
          document_url: string | null
          id: string
          is_recurring: boolean | null
          recurrence_rule: string | null
          tax_type: string | null
          title: string
        }
        Insert: {
          audience?: string[] | null
          created_at?: string | null
          deadline_date: string
          description?: string | null
          document_url?: string | null
          id?: string
          is_recurring?: boolean | null
          recurrence_rule?: string | null
          tax_type?: string | null
          title: string
        }
        Update: {
          audience?: string[] | null
          created_at?: string | null
          deadline_date?: string
          description?: string | null
          document_url?: string | null
          id?: string
          is_recurring?: boolean | null
          recurrence_rule?: string | null
          tax_type?: string | null
          title?: string
        }
        Relationships: []
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
      usage_tracking: {
        Row: {
          feature: string
          id: string
          used_at: string
          user_id: string
        }
        Insert: {
          feature: string
          id?: string
          used_at?: string
          user_id: string
        }
        Update: {
          feature?: string
          id?: string
          used_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_activity: {
        Row: {
          action: string
          created_at: string | null
          document_id: string | null
          id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          document_id?: string | null
          id?: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
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
      user_document_history: {
        Row: {
          document_id: string
          id: string
          user_id: string
          viewed_at: string
        }
        Insert: {
          document_id: string
          id?: string
          user_id: string
          viewed_at?: string
        }
        Update: {
          document_id?: string
          id?: string
          user_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_document_history_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      user_favorites: {
        Row: {
          created_at: string
          document_id: string
          id: string
          note: string | null
          on_watch: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          document_id: string
          id?: string
          note?: string | null
          on_watch?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          document_id?: string
          id?: string
          note?: string | null
          on_watch?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorites_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notifications: {
        Row: {
          created_at: string
          document_id: string | null
          id: string
          is_read: boolean
          message: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_id?: string | null
          id?: string
          is_read?: boolean
          message?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_id?: string | null
          id?: string
          is_read?: boolean
          message?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notifications_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          company_name: string | null
          created_at: string
          full_name: string | null
          id: string
          profession: string | null
          settings: Json
          subscription_expires_at: string | null
          subscription_plan: string
          updated_at: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          profession?: string | null
          settings?: Json
          subscription_expires_at?: string | null
          subscription_plan?: string
          updated_at?: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          profession?: string | null
          settings?: Json
          subscription_expires_at?: string | null
          subscription_plan?: string
          updated_at?: string
        }
        Relationships: []
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
      check_limit: {
        Args: { p_feature: string; p_user_id: string }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_usage: {
        Args: { p_feature: string; p_user_id: string }
        Returns: undefined
      }
      increment_view_count: { Args: { doc_id: string }; Returns: undefined }
      search_documents: {
        Args: {
          exact_match?: boolean
          filter_body?: string
          filter_date_from?: string
          filter_date_to?: string
          filter_status?: string
          filter_type?: string
          result_limit?: number
          result_offset?: number
          search_query?: string
          title_only?: boolean
        }
        Returns: {
          doc_date: string
          doc_number: string
          document_type_name: string
          document_type_slug: string
          id: string
          issuing_body_name: string
          rank: number
          short_title: string
          snippet: string
          status: string
          title: string
          total_count: number
        }[]
      }
      search_within_document: {
        Args: { p_document_id: string; search_query: string }
        Returns: {
          number: string
          rank: number
          section_id: string
          section_type: string
          snippet: string
          title: string
        }[]
      }
    }
    Enums: {
      app_role: "user" | "admin"
      audience_type: "accountant" | "lawyer" | "general"
      change_type: "amended" | "new_version" | "repealed"
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
    },
  },
} as const
