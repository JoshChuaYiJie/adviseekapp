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
      achievements: {
        Row: {
          achievement_key: string
          created_at: string
          id: number
          progress: number | null
          unlocked: boolean | null
          unlocked_at: string | null
          user_id: string | null
        }
        Insert: {
          achievement_key: string
          created_at?: string
          id?: number
          progress?: number | null
          unlocked?: boolean | null
          unlocked_at?: string | null
          user_id?: string | null
        }
        Update: {
          achievement_key?: string
          created_at?: string
          id?: number
          progress?: number | null
          unlocked?: boolean | null
          unlocked_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      community_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          content: string
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      modules: {
        Row: {
          aus_cus: number
          course_code: string
          description: string | null
          id: number
          semester: string
          title: string
          university: string
        }
        Insert: {
          aus_cus: number
          course_code: string
          description?: string | null
          id?: number
          semester: string
          title: string
          university: string
        }
        Update: {
          aus_cus?: number
          course_code?: string
          description?: string | null
          id?: number
          semester?: string
          title?: string
          university?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          username: string | null
        }
        Insert: {
          created_at?: string
          id: string
          username?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          username?: string | null
        }
        Relationships: []
      }
      quiz_questions: {
        Row: {
          id: number
          options: Json | null
          question_text: string
          question_type: string
          section: string
        }
        Insert: {
          id?: number
          options?: Json | null
          question_text: string
          question_type: string
          section: string
        }
        Update: {
          id?: number
          options?: Json | null
          question_text?: string
          question_type?: string
          section?: string
        }
        Relationships: []
      }
      recommendations: {
        Row: {
          created_at: string
          id: number
          module_id: number
          reason: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          module_id: number
          reason: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          module_id?: number
          reason?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommendations_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      resumes: {
        Row: {
          activities: Json | null
          awards: string | null
          created_at: string
          education_dates: string | null
          email: string | null
          id: string
          institution: string | null
          interests: string | null
          it_skills: string | null
          languages: string | null
          name: string | null
          nationality: string | null
          phone: string | null
          qualifications: string | null
          template_type: string
          updated_at: string
          user_id: string
          work_experience: Json | null
        }
        Insert: {
          activities?: Json | null
          awards?: string | null
          created_at?: string
          education_dates?: string | null
          email?: string | null
          id?: string
          institution?: string | null
          interests?: string | null
          it_skills?: string | null
          languages?: string | null
          name?: string | null
          nationality?: string | null
          phone?: string | null
          qualifications?: string | null
          template_type: string
          updated_at?: string
          user_id: string
          work_experience?: Json | null
        }
        Update: {
          activities?: Json | null
          awards?: string | null
          created_at?: string
          education_dates?: string | null
          email?: string | null
          id?: string
          institution?: string | null
          interests?: string | null
          it_skills?: string | null
          languages?: string | null
          name?: string | null
          nationality?: string | null
          phone?: string | null
          qualifications?: string | null
          template_type?: string
          updated_at?: string
          user_id?: string
          work_experience?: Json | null
        }
        Relationships: []
      }
      user_feedback: {
        Row: {
          created_at: string
          id: number
          module_id: number
          rating: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          module_id: number
          rating: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          module_id?: number
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_feedback_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      user_responses: {
        Row: {
          created_at: string
          id: number
          question_id: number
          response: string | null
          response_array: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          question_id: number
          response?: string | null
          response_array?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          question_id?: number
          response?: string | null
          response_array?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_selections: {
        Row: {
          created_at: string
          id: number
          module_id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          module_id: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          module_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_selections_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          app_notifications: boolean | null
          bio: string | null
          created_at: string | null
          email_notifications: boolean | null
          id: string
          name: string | null
          newsletter_subscription: boolean | null
          updated_at: string | null
        }
        Insert: {
          app_notifications?: boolean | null
          bio?: string | null
          created_at?: string | null
          email_notifications?: boolean | null
          id: string
          name?: string | null
          newsletter_subscription?: boolean | null
          updated_at?: string | null
        }
        Update: {
          app_notifications?: boolean | null
          bio?: string | null
          created_at?: string | null
          email_notifications?: boolean | null
          id?: string
          name?: string | null
          newsletter_subscription?: boolean | null
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
      achievement_type:
        | "community_contributor"
        | "knowledge_seeker"
        | "first_milestone"
        | "academic_explorer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      achievement_type: [
        "community_contributor",
        "knowledge_seeker",
        "first_milestone",
        "academic_explorer",
      ],
    },
  },
} as const
