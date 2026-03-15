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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      avatar_uploads: {
        Row: {
          created_at: string
          denial_reason: string | null
          id: string
          image_url: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          denial_reason?: string | null
          id?: string
          image_url: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          denial_reason?: string | null
          id?: string
          image_url?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      bot_settings: {
        Row: {
          activity_level: number
          allowed_contexts: string[]
          avatar_url: string | null
          created_at: string
          cron_interval: string
          id: string
          is_active: boolean
          name: string
          recent_phrases: Json
          system_prompt: string
          tone_of_voice: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_level?: number
          allowed_contexts?: string[]
          avatar_url?: string | null
          created_at?: string
          cron_interval?: string
          id?: string
          is_active?: boolean
          name: string
          recent_phrases?: Json
          system_prompt?: string
          tone_of_voice?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_level?: number
          allowed_contexts?: string[]
          avatar_url?: string | null
          created_at?: string
          cron_interval?: string
          id?: string
          is_active?: boolean
          name?: string
          recent_phrases?: Json
          system_prompt?: string
          tone_of_voice?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      call_participants: {
        Row: {
          call_id: string
          id: string
          joined_at: string
          left_at: string | null
          user_id: string
        }
        Insert: {
          call_id: string
          id?: string
          joined_at?: string
          left_at?: string | null
          user_id: string
        }
        Update: {
          call_id?: string
          id?: string
          joined_at?: string
          left_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_participants_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "call_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      call_sessions: {
        Row: {
          call_type: string
          caller_id: string
          channel_name: string
          created_at: string
          ended_at: string | null
          id: string
        }
        Insert: {
          call_type?: string
          caller_id: string
          channel_name: string
          created_at?: string
          ended_at?: string | null
          id?: string
        }
        Update: {
          call_type?: string
          caller_id?: string
          channel_name?: string
          created_at?: string
          ended_at?: string | null
          id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          recipient_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          recipient_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          recipient_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      daily_news: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          expires_at: string
          id: string
          is_active: boolean
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          is_active?: boolean
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          is_active?: boolean
        }
        Relationships: []
      }
      friend_votes: {
        Row: {
          created_at: string
          id: string
          target_user_id: string
          vote_category: string
          voter_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          target_user_id: string
          vote_category: string
          voter_id: string
        }
        Update: {
          created_at?: string
          id?: string
          target_user_id?: string
          vote_category?: string
          voter_id?: string
        }
        Relationships: []
      }
      friends: {
        Row: {
          category: string
          created_at: string
          friend_id: string
          id: string
          is_best_friend: boolean
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          friend_id: string
          id?: string
          is_best_friend?: boolean
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          friend_id?: string
          id?: string
          is_best_friend?: boolean
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      good_vibe_allowances: {
        Row: {
          created_at: string
          id: string
          is_paid_user: boolean
          last_reset_at: string
          monthly_allowance: number
          updated_at: string
          user_id: string
          vibes_used_this_month: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_paid_user?: boolean
          last_reset_at?: string
          monthly_allowance?: number
          updated_at?: string
          user_id: string
          vibes_used_this_month?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_paid_user?: boolean
          last_reset_at?: string
          monthly_allowance?: number
          updated_at?: string
          user_id?: string
          vibes_used_this_month?: number
        }
        Relationships: []
      }
      good_vibes: {
        Row: {
          created_at: string
          giver_id: string
          id: string
          target_id: string
          target_type: string
        }
        Insert: {
          created_at?: string
          giver_id: string
          id?: string
          target_id: string
          target_type: string
        }
        Update: {
          created_at?: string
          giver_id?: string
          id?: string
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      guestbook_entries: {
        Row: {
          author_avatar: string | null
          author_name: string
          created_at: string
          id: string
          message: string
          user_id: string
        }
        Insert: {
          author_avatar?: string | null
          author_name: string
          created_at?: string
          id?: string
          message: string
          user_id: string
        }
        Update: {
          author_avatar?: string | null
          author_name?: string
          created_at?: string
          id?: string
          message?: string
          user_id?: string
        }
        Relationships: []
      }
      klotter: {
        Row: {
          author_avatar: string | null
          author_name: string
          comment: string | null
          created_at: string
          id: string
          image_url: string
          user_id: string
        }
        Insert: {
          author_avatar?: string | null
          author_name: string
          comment?: string | null
          created_at?: string
          id?: string
          image_url: string
          user_id: string
        }
        Update: {
          author_avatar?: string | null
          author_name?: string
          comment?: string | null
          created_at?: string
          id?: string
          image_url?: string
          user_id?: string
        }
        Relationships: []
      }
      lajv_messages: {
        Row: {
          avatar_url: string | null
          created_at: string
          expires_at: string
          id: string
          message: string
          user_id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          message: string
          user_id: string
          username?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          message?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      memory_highscores: {
        Row: {
          avatar_url: string | null
          created_at: string
          difficulty: string
          id: string
          moves: number
          score: number
          time_seconds: number
          user_id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          difficulty?: string
          id?: string
          moves: number
          score: number
          time_seconds: number
          user_id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          difficulty?: string
          id?: string
          moves?: number
          score?: number
          time_seconds?: number
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          deleted_by_recipient: boolean
          deleted_by_sender: boolean
          id: string
          is_read: boolean
          is_starred: boolean
          recipient_id: string
          sender_id: string
          subject: string
        }
        Insert: {
          content: string
          created_at?: string
          deleted_by_recipient?: boolean
          deleted_by_sender?: boolean
          id?: string
          is_read?: boolean
          is_starred?: boolean
          recipient_id: string
          sender_id: string
          subject: string
        }
        Update: {
          content?: string
          created_at?: string
          deleted_by_recipient?: boolean
          deleted_by_sender?: boolean
          id?: string
          is_read?: boolean
          is_starred?: boolean
          recipient_id?: string
          sender_id?: string
          subject?: string
        }
        Relationships: []
      }
      news_articles: {
        Row: {
          author_name: string
          content: string
          created_at: string
          icon: string
          id: string
          image_url: string | null
          is_published: boolean
          title: string
          updated_at: string
        }
        Insert: {
          author_name?: string
          content: string
          created_at?: string
          icon?: string
          id?: string
          image_url?: string | null
          is_published?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          author_name?: string
          content?: string
          created_at?: string
          icon?: string
          id?: string
          image_url?: string | null
          is_published?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profile_guestbook: {
        Row: {
          author_avatar: string | null
          author_id: string
          author_name: string
          created_at: string
          id: string
          is_read: boolean
          message: string
          profile_owner_id: string
        }
        Insert: {
          author_avatar?: string | null
          author_id: string
          author_name: string
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          profile_owner_id: string
        }
        Update: {
          author_avatar?: string | null
          author_id?: string
          author_name?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          profile_owner_id?: string
        }
        Relationships: []
      }
      profile_visits: {
        Row: {
          id: string
          profile_owner_id: string
          visited_at: string
          visitor_id: string
        }
        Insert: {
          id?: string
          profile_owner_id: string
          visited_at?: string
          visitor_id: string
        }
        Update: {
          id?: string
          profile_owner_id?: string
          visited_at?: string
          visitor_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          avatar_url: string | null
          bio: string | null
          body_type: string | null
          city: string | null
          clothing: string | null
          created_at: string
          eats: string | null
          gender: string | null
          hair_color: string | null
          id: string
          interests: string | null
          is_admin: boolean
          is_approved: boolean
          is_bot: boolean
          last_seen: string | null
          likes: string | null
          listens_to: string | null
          looking_for: string[] | null
          occupation: string | null
          personality: string | null
          prefers: string | null
          relationship: string | null
          spanar_in: string | null
          status_message: string | null
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          body_type?: string | null
          city?: string | null
          clothing?: string | null
          created_at?: string
          eats?: string | null
          gender?: string | null
          hair_color?: string | null
          id?: string
          interests?: string | null
          is_admin?: boolean
          is_approved?: boolean
          is_bot?: boolean
          last_seen?: string | null
          likes?: string | null
          listens_to?: string | null
          looking_for?: string[] | null
          occupation?: string | null
          personality?: string | null
          prefers?: string | null
          relationship?: string | null
          spanar_in?: string | null
          status_message?: string | null
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          body_type?: string | null
          city?: string | null
          clothing?: string | null
          created_at?: string
          eats?: string | null
          gender?: string | null
          hair_color?: string | null
          id?: string
          interests?: string | null
          is_admin?: boolean
          is_approved?: boolean
          is_bot?: boolean
          last_seen?: string | null
          likes?: string | null
          listens_to?: string | null
          looking_for?: string[] | null
          occupation?: string | null
          personality?: string | null
          prefers?: string | null
          relationship?: string | null
          spanar_in?: string | null
          status_message?: string | null
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      scribble_guesses: {
        Row: {
          created_at: string
          guess: string
          id: string
          is_correct: boolean
          lobby_id: string
          user_id: string
          username: string
        }
        Insert: {
          created_at?: string
          guess: string
          id?: string
          is_correct?: boolean
          lobby_id: string
          user_id: string
          username: string
        }
        Update: {
          created_at?: string
          guess?: string
          id?: string
          is_correct?: boolean
          lobby_id?: string
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "scribble_guesses_lobby_id_fkey"
            columns: ["lobby_id"]
            isOneToOne: false
            referencedRelation: "scribble_lobbies"
            referencedColumns: ["id"]
          },
        ]
      }
      scribble_lobbies: {
        Row: {
          created_at: string
          creator_id: string
          creator_username: string
          current_drawer_id: string | null
          current_word: string | null
          description: string | null
          id: string
          round_number: number
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          creator_username: string
          current_drawer_id?: string | null
          current_word?: string | null
          description?: string | null
          id?: string
          round_number?: number
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          creator_username?: string
          current_drawer_id?: string | null
          current_word?: string | null
          description?: string | null
          id?: string
          round_number?: number
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      scribble_players: {
        Row: {
          avatar_url: string | null
          id: string
          joined_at: string
          lobby_id: string
          score: number
          user_id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          id?: string
          joined_at?: string
          lobby_id: string
          score?: number
          user_id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          id?: string
          joined_at?: string
          lobby_id?: string
          score?: number
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "scribble_players_lobby_id_fkey"
            columns: ["lobby_id"]
            isOneToOne: false
            referencedRelation: "scribble_lobbies"
            referencedColumns: ["id"]
          },
        ]
      }
      snake_highscores: {
        Row: {
          apples_eaten: number
          avatar_url: string | null
          created_at: string
          id: string
          score: number
          time_seconds: number
          user_id: string
          username: string
        }
        Insert: {
          apples_eaten?: number
          avatar_url?: string | null
          created_at?: string
          id?: string
          score: number
          time_seconds?: number
          user_id: string
          username: string
        }
        Update: {
          apples_eaten?: number
          avatar_url?: string | null
          created_at?: string
          id?: string
          score?: number
          time_seconds?: number
          user_id?: string
          username?: string
        }
        Relationships: []
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      count_good_vibes: {
        Args: { p_target_id: string; p_target_type: string }
        Returns: number
      }
      delete_expired_lajv_messages: { Args: never; Returns: undefined }
      delete_user_cascade: { Args: { p_user_id: string }; Returns: undefined }
      give_good_vibe: {
        Args: { p_target_id: string; p_target_type: string }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_user_vibed: {
        Args: { p_target_id: string; p_target_type: string }
        Returns: boolean
      }
      reset_monthly_vibes_if_needed: {
        Args: { p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "banned"
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
      app_role: ["admin", "moderator", "user", "banned"],
    },
  },
} as const
