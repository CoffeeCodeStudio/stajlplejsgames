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
      memory_events: {
        Row: {
          card_a_id: number | null
          card_b_id: number | null
          created_at: string
          event_at: string
          event_type: string
          id: string
          session_id: string
        }
        Insert: {
          card_a_id?: number | null
          card_b_id?: number | null
          created_at?: string
          event_at?: string
          event_type: string
          id?: string
          session_id: string
        }
        Update: {
          card_a_id?: number | null
          card_b_id?: number | null
          created_at?: string
          event_at?: string
          event_type?: string
          id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memory_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "memory_sessions"
            referencedColumns: ["id"]
          },
        ]
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
      memory_sessions: {
        Row: {
          created_at: string
          difficulty: string
          finished_at: string | null
          id: string
          is_valid: boolean
          pairs: number
          score: number | null
          session_token: string
          started_at: string
          username: string
        }
        Insert: {
          created_at?: string
          difficulty?: string
          finished_at?: string | null
          id?: string
          is_valid?: boolean
          pairs?: number
          score?: number | null
          session_token?: string
          started_at?: string
          username: string
        }
        Update: {
          created_at?: string
          difficulty?: string
          finished_at?: string | null
          id?: string
          is_valid?: boolean
          pairs?: number
          score?: number | null
          session_token?: string
          started_at?: string
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
          last_seen: string
          lobby_id: string
          score: number
          user_id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          id?: string
          joined_at?: string
          last_seen?: string
          lobby_id: string
          score?: number
          user_id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          id?: string
          joined_at?: string
          last_seen?: string
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
