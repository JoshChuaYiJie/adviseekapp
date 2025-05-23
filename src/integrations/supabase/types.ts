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
      application_responses: {
        Row: {
          created_at: string
          degree: string
          id: string
          Major: string
          question: string
          question_id: string
          response: string | null
          university: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          degree: string
          id?: string
          Major: string
          question: string
          question_id: string
          response?: string | null
          university: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          degree?: string
          id?: string
          Major?: string
          question?: string
          question_id?: string
          response?: string | null
          university?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      applied_programs: {
        Row: {
          college: string | null
          created_at: string
          degree: string | null
          extras: string | null
          id: string
          logo_path: string | null
          major: string
          school: string
          university: string
          user_id: string
        }
        Insert: {
          college?: string | null
          created_at?: string
          degree?: string | null
          extras?: string | null
          id?: string
          logo_path?: string | null
          major: string
          school: string
          university: string
          user_id: string
        }
        Update: {
          college?: string | null
          created_at?: string
          degree?: string | null
          extras?: string | null
          id?: string
          logo_path?: string | null
          major?: string
          school?: string
          university?: string
          user_id?: string
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
      consultant_applications: {
        Row: {
          about_yourself: string
          achievements: string
          created_at: string
          enthusiasm: number
          id: string
          school_and_course: string
          user_id: string
        }
        Insert: {
          about_yourself: string
          achievements: string
          created_at?: string
          enthusiasm: number
          id?: string
          school_and_course: string
          user_id: string
        }
        Update: {
          about_yourself?: string
          achievements?: string
          created_at?: string
          enthusiasm?: number
          id?: string
          school_and_course?: string
          user_id?: string
        }
        Relationships: []
      }
      open_ended_responses: {
        Row: {
          created_at: string
          id: number
          major: string | null
          question: string | null
          question_id: string | null
          response: string | null
          skipped: boolean | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          major?: string | null
          question?: string | null
          question_id?: string | null
          response?: string | null
          skipped?: boolean | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          major?: string | null
          question?: string | null
          question_id?: string | null
          response?: string | null
          skipped?: boolean | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          dislikes: string | null
          id: string
          likes: string | null
          personality_traits: string | null
          recommended_major: string | null
          riasec_code: string | null
          username: string | null
          work_environment_preferences: string | null
          work_value_code: string | null
        }
        Insert: {
          created_at?: string
          dislikes?: string | null
          id: string
          likes?: string | null
          personality_traits?: string | null
          recommended_major?: string | null
          riasec_code?: string | null
          username?: string | null
          work_environment_preferences?: string | null
          work_value_code?: string | null
        }
        Update: {
          created_at?: string
          dislikes?: string | null
          id?: string
          likes?: string | null
          personality_traits?: string | null
          recommended_major?: string | null
          riasec_code?: string | null
          username?: string | null
          work_environment_preferences?: string | null
          work_value_code?: string | null
        }
        Relationships: []
      }
      quiz_completion: {
        Row: {
          completed_at: string
          id: number
          quiz_type: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: number
          quiz_type: string
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: number
          quiz_type?: string
          user_id?: string
        }
        Relationships: []
      }
      recommendations_score: {
        Row: {
          created_at: string
          id: string
          module_code: string
          module_prefix: string
          rating: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          module_code: string
          module_prefix: string
          rating: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          module_code?: string
          module_prefix?: string
          rating?: number
          user_id?: string
        }
        Relationships: []
      }
      resumes: {
        Row: {
          activities: Json | null
          awards: string | null
          created_at: string
          education_dates: string | null
          educationItems: Json | null
          email: string | null
          file_path: string | null
          id: string
          institution: string | null
          interests: string | null
          is_pdf_upload: boolean | null
          it_skills: string | null
          languages: string | null
          name: string | null
          nationality: string | null
          phone: string | null
          qualifications: string | null
          resumeName: string | null
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
          educationItems?: Json | null
          email?: string | null
          file_path?: string | null
          id?: string
          institution?: string | null
          interests?: string | null
          is_pdf_upload?: boolean | null
          it_skills?: string | null
          languages?: string | null
          name?: string | null
          nationality?: string | null
          phone?: string | null
          qualifications?: string | null
          resumeName?: string | null
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
          educationItems?: Json | null
          email?: string | null
          file_path?: string | null
          id?: string
          institution?: string | null
          interests?: string | null
          is_pdf_upload?: boolean | null
          it_skills?: string | null
          languages?: string | null
          name?: string | null
          nationality?: string | null
          phone?: string | null
          qualifications?: string | null
          resumeName?: string | null
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
          feedback_text: string | null
          feedback_type: string | null
          id: number
          module_id: number | null
          page_context: string | null
          rating: number
          user_id: string
        }
        Insert: {
          created_at?: string
          feedback_text?: string | null
          feedback_type?: string | null
          id?: number
          module_id?: number | null
          page_context?: string | null
          rating: number
          user_id: string
        }
        Update: {
          created_at?: string
          feedback_text?: string | null
          feedback_type?: string | null
          id?: number
          module_id?: number | null
          page_context?: string | null
          rating?: number
          user_id?: string
        }
        Relationships: []
      }
      user_responses: {
        Row: {
          component: string | null
          created_at: string
          id: number
          question_id: string
          quiz_type: string | null
          response: string | null
          response_array: Json | null
          score: number | null
          user_id: string
        }
        Insert: {
          component?: string | null
          created_at?: string
          id?: number
          question_id: string
          quiz_type?: string | null
          response?: string | null
          response_array?: Json | null
          score?: number | null
          user_id: string
        }
        Update: {
          component?: string | null
          created_at?: string
          id?: number
          question_id?: string
          quiz_type?: string | null
          response?: string | null
          response_array?: Json | null
          score?: number | null
          user_id?: string
        }
        Relationships: []
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
        Relationships: []
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
      check_policy_exists: {
        Args: { table_name: string; policy_name: string }
        Returns: boolean
      }
      check_rls_enabled: {
        Args: { table_name: string }
        Returns: boolean
      }
      check_unique_constraint: {
        Args: { table_name: string; column_names: string[] }
        Returns: boolean
      }
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
