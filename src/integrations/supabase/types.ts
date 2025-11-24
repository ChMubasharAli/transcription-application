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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          active: boolean | null
          content: string
          created_at: string
          id: string
          priority: string | null
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          content: string
          created_at?: string
          id?: string
          priority?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          content?: string
          created_at?: string
          id?: string
          priority?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      dialogue_segments: {
        Row: {
          audio_url: string | null
          created_at: string
          dialogue_id: string
          end_time: number | null
          id: string
          segment_order: number
          speaker: string | null
          start_time: number | null
          text_content: string | null
          translation: string | null
          updated_at: string
        }
        Insert: {
          audio_url?: string | null
          created_at?: string
          dialogue_id: string
          end_time?: number | null
          id?: string
          segment_order: number
          speaker?: string | null
          start_time?: number | null
          text_content?: string | null
          translation?: string | null
          updated_at?: string
        }
        Update: {
          audio_url?: string | null
          created_at?: string
          dialogue_id?: string
          end_time?: number | null
          id?: string
          segment_order?: number
          speaker?: string | null
          start_time?: number | null
          text_content?: string | null
          translation?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dialogue_segments_dialogue_id_fkey"
            columns: ["dialogue_id"]
            isOneToOne: false
            referencedRelation: "dialogues"
            referencedColumns: ["id"]
          },
        ]
      }
      dialogues: {
        Row: {
          created_at: string
          description: string | null
          difficulty: string | null
          domain_id: string
          duration: string | null
          id: string
          language_id: string | null
          participants: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          difficulty?: string | null
          domain_id: string
          duration?: string | null
          id?: string
          language_id?: string | null
          participants?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          difficulty?: string | null
          domain_id?: string
          duration?: string | null
          id?: string
          language_id?: string | null
          participants?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dialogues_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dialogues_language_id_fkey"
            columns: ["language_id"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["id"]
          },
        ]
      }
      domains: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          difficulty: string | null
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          difficulty?: string | null
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          difficulty?: string | null
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      exam_responses: {
        Row: {
          audio_file_path: string
          created_at: string
          duration_seconds: number | null
          id: string
          question_id: string
          recorded_at: string
          transcript: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          audio_file_path: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          question_id: string
          recorded_at?: string
          transcript?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          audio_file_path?: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          question_id?: string
          recorded_at?: string
          transcript?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      languages: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      mock_tests: {
        Row: {
          created_at: string
          created_by: string
          dialogue1_id: string
          dialogue2_id: string
          difficulty: string | null
          id: string
          is_active: boolean | null
          language_id: string
          time_limit_minutes: number | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          dialogue1_id: string
          dialogue2_id: string
          difficulty?: string | null
          id?: string
          is_active?: boolean | null
          language_id: string
          time_limit_minutes?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          dialogue1_id?: string
          dialogue2_id?: string
          difficulty?: string | null
          id?: string
          is_active?: boolean | null
          language_id?: string
          time_limit_minutes?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      naati_attempts: {
        Row: {
          accuracy: number | null
          attempt_at: string
          consistency: number | null
          created_at: string
          dialogue1_total: number | null
          dialogue2_total: number | null
          fluency: number | null
          id: string
          language_code: string
          pronunciation: number | null
          register: number | null
          student_id: string
          test_type: string
          updated_at: string
          week_start: string
        }
        Insert: {
          accuracy?: number | null
          attempt_at?: string
          consistency?: number | null
          created_at?: string
          dialogue1_total?: number | null
          dialogue2_total?: number | null
          fluency?: number | null
          id?: string
          language_code: string
          pronunciation?: number | null
          register?: number | null
          student_id: string
          test_type: string
          updated_at?: string
          week_start: string
        }
        Update: {
          accuracy?: number | null
          attempt_at?: string
          consistency?: number | null
          created_at?: string
          dialogue1_total?: number | null
          dialogue2_total?: number | null
          fluency?: number | null
          id?: string
          language_code?: string
          pronunciation?: number | null
          register?: number | null
          student_id?: string
          test_type?: string
          updated_at?: string
          week_start?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          content_id: string | null
          created_at: string
          id: string
          is_read: boolean
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          content_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          content_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      practice_sessions: {
        Row: {
          activity_type: string | null
          created_at: string
          ended_at: string | null
          id: string
          started_at: string
          student_id: string
          updated_at: string
        }
        Insert: {
          activity_type?: string | null
          created_at?: string
          ended_at?: string | null
          id?: string
          started_at?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          activity_type?: string | null
          created_at?: string
          ended_at?: string | null
          id?: string
          started_at?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          exam_date: string
          full_name: string | null
          id: string
          language_id: string | null
          phone_number: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          exam_date: string
          full_name?: string | null
          id: string
          language_id?: string | null
          phone_number?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          exam_date?: string
          full_name?: string | null
          id?: string
          language_id?: string | null
          phone_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_language_id_fkey"
            columns: ["language_id"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["id"]
          },
        ]
      }
      rapid_review: {
        Row: {
          answer: string
          category: string | null
          created_at: string
          difficulty: string | null
          id: string
          language_id: string | null
          question: string
          updated_at: string
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string
          difficulty?: string | null
          id?: string
          language_id?: string | null
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string
          difficulty?: string | null
          id?: string
          language_id?: string | null
          question?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rapid_review_language_id_fkey"
            columns: ["language_id"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["id"]
          },
        ]
      }
      user_audio_responses: {
        Row: {
          accuracy_score: number | null
          ai_scores: Json | null
          audio_url: string | null
          content_quality_score: number | null
          created_at: string
          feedback: string | null
          fluency_score: number | null
          id: string
          overall_score: number | null
          pronunciation_score: number | null
          register_score: number | null
          segment_id: string
          updated_at: string
          user_id: string
          user_transcript: string | null
        }
        Insert: {
          accuracy_score?: number | null
          ai_scores?: Json | null
          audio_url?: string | null
          content_quality_score?: number | null
          created_at?: string
          feedback?: string | null
          fluency_score?: number | null
          id?: string
          overall_score?: number | null
          pronunciation_score?: number | null
          register_score?: number | null
          segment_id: string
          updated_at?: string
          user_id: string
          user_transcript?: string | null
        }
        Update: {
          accuracy_score?: number | null
          ai_scores?: Json | null
          audio_url?: string | null
          content_quality_score?: number | null
          created_at?: string
          feedback?: string | null
          fluency_score?: number | null
          id?: string
          overall_score?: number | null
          pronunciation_score?: number | null
          register_score?: number | null
          segment_id?: string
          updated_at?: string
          user_id?: string
          user_transcript?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_audio_responses_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "dialogue_segments"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_segment_responses: {
        Row: {
          ai_feedback: string | null
          attempt_number: number
          audio_response_url: string | null
          created_at: string
          fluency_score: number | null
          grammar_score: number | null
          id: string
          overall_score: number | null
          segment_id: string
          session_id: string
          time_spent_seconds: number | null
          transcribed_text: string | null
          translation_accuracy_score: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_feedback?: string | null
          attempt_number?: number
          audio_response_url?: string | null
          created_at?: string
          fluency_score?: number | null
          grammar_score?: number | null
          id?: string
          overall_score?: number | null
          segment_id: string
          session_id: string
          time_spent_seconds?: number | null
          transcribed_text?: string | null
          translation_accuracy_score?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_feedback?: string | null
          attempt_number?: number
          audio_response_url?: string | null
          created_at?: string
          fluency_score?: number | null
          grammar_score?: number | null
          id?: string
          overall_score?: number | null
          segment_id?: string
          session_id?: string
          time_spent_seconds?: number | null
          transcribed_text?: string | null
          translation_accuracy_score?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_segment_responses_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "dialogue_segments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_segment_responses_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "user_test_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_test_sessions: {
        Row: {
          completed_at: string | null
          completed_segments: number
          created_at: string
          dialogue_id: string
          id: string
          session_type: string
          started_at: string
          status: string
          target_language_id: string
          time_limit_seconds: number
          time_spent_seconds: number | null
          total_score: number | null
          total_segments: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_segments?: number
          created_at?: string
          dialogue_id: string
          id?: string
          session_type?: string
          started_at?: string
          status?: string
          target_language_id: string
          time_limit_seconds?: number
          time_spent_seconds?: number | null
          total_score?: number | null
          total_segments?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completed_segments?: number
          created_at?: string
          dialogue_id?: string
          id?: string
          session_type?: string
          started_at?: string
          status?: string
          target_language_id?: string
          time_limit_seconds?: number
          time_spent_seconds?: number | null
          total_score?: number | null
          total_segments?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_test_sessions_dialogue_id_fkey"
            columns: ["dialogue_id"]
            isOneToOne: false
            referencedRelation: "dialogues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_test_sessions_target_language_id_fkey"
            columns: ["target_language_id"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["id"]
          },
        ]
      }
      vocabulary: {
        Row: {
          audio_url: string | null
          category: string | null
          created_at: string
          definition: string | null
          difficulty_level: string | null
          example_sentence: string | null
          id: string
          language_id: string | null
          updated_at: string
          word: string
        }
        Insert: {
          audio_url?: string | null
          category?: string | null
          created_at?: string
          definition?: string | null
          difficulty_level?: string | null
          example_sentence?: string | null
          id?: string
          language_id?: string | null
          updated_at?: string
          word: string
        }
        Update: {
          audio_url?: string | null
          category?: string | null
          created_at?: string
          definition?: string | null
          difficulty_level?: string | null
          example_sentence?: string | null
          id?: string
          language_id?: string | null
          updated_at?: string
          word?: string
        }
        Relationships: [
          {
            foreignKeyName: "vocabulary_language_id_fkey"
            columns: ["language_id"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_all_time_practice_seconds: {
        Args: { p_student_id: string }
        Returns: number
      }
      get_today_practice_seconds: {
        Args: { p_student_id: string }
        Returns: number
      }
      get_user_email: { Args: { user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
