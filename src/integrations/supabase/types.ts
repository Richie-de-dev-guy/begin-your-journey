export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      announcements: {
        Row: {
          body: string;
          created_at: string;
          created_by: string | null;
          expires_at: string | null;
          id: string;
          image_url: string | null;
          is_featured: boolean;
          priority: number;
          published_at: string | null;
          status: Database["public"]["Enums"]["content_status"];
          title: string;
          updated_at: string;
        };
        Insert: {
          body?: string;
          created_at?: string;
          created_by?: string | null;
          expires_at?: string | null;
          id?: string;
          image_url?: string | null;
          is_featured?: boolean;
          priority?: number;
          published_at?: string | null;
          status?: Database["public"]["Enums"]["content_status"];
          title: string;
          updated_at?: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          created_by?: string | null;
          expires_at?: string | null;
          id?: string;
          image_url?: string | null;
          is_featured?: boolean;
          priority?: number;
          published_at?: string | null;
          status?: Database["public"]["Enums"]["content_status"];
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      about_sections: {
        Row: {
          body: string;
          display_order: number;
          is_placeholder: boolean;
          key: string;
          title: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          body?: string;
          display_order: number;
          is_placeholder?: boolean;
          key: string;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          body?: string;
          display_order?: number;
          is_placeholder?: boolean;
          key?: string;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          action: string;
          actor_id: string;
          created_at: string;
          entity_id: string | null;
          entity_type: string;
          id: string;
          metadata: Json;
        };
        Insert: {
          action: string;
          actor_id: string;
          created_at?: string;
          entity_id?: string | null;
          entity_type: string;
          id?: string;
          metadata?: Json;
        };
        Update: {
          action?: string;
          actor_id?: string;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string;
          id?: string;
          metadata?: Json;
        };
        Relationships: [];
      };
      events: {
        Row: {
          created_at: string;
          created_by: string | null;
          description: string;
          ends_at: string | null;
          featured_image_url: string | null;
          id: string;
          is_featured: boolean;
          online_url: string | null;
          published_at: string | null;
          registration_url: string | null;
          slug: string;
          starts_at: string;
          status: Database["public"]["Enums"]["content_status"];
          timezone: string;
          title: string;
          updated_at: string;
          venue: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          description?: string;
          ends_at?: string | null;
          featured_image_url?: string | null;
          id?: string;
          is_featured?: boolean;
          online_url?: string | null;
          published_at?: string | null;
          registration_url?: string | null;
          slug: string;
          starts_at: string;
          status?: Database["public"]["Enums"]["content_status"];
          timezone?: string;
          title: string;
          updated_at?: string;
          venue?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          description?: string;
          ends_at?: string | null;
          featured_image_url?: string | null;
          id?: string;
          is_featured?: boolean;
          online_url?: string | null;
          published_at?: string | null;
          registration_url?: string | null;
          slug?: string;
          starts_at?: string;
          status?: Database["public"]["Enums"]["content_status"];
          timezone?: string;
          title?: string;
          updated_at?: string;
          venue?: string | null;
        };
        Relationships: [];
      };
      inquiries: {
        Row: {
          assigned_to: string | null;
          created_at: string;
          email: string;
          full_name: string;
          id: string;
          internal_notes: string | null;
          message: string;
          phone: string | null;
          status: Database["public"]["Enums"]["inquiry_status"];
          subject: string;
          updated_at: string;
        };
        Insert: {
          assigned_to?: string | null;
          created_at?: string;
          email: string;
          full_name: string;
          id?: string;
          internal_notes?: string | null;
          message: string;
          phone?: string | null;
          status?: Database["public"]["Enums"]["inquiry_status"];
          subject?: string;
          updated_at?: string;
        };
        Update: {
          assigned_to?: string | null;
          created_at?: string;
          email?: string;
          full_name?: string;
          id?: string;
          internal_notes?: string | null;
          message?: string;
          phone?: string | null;
          status?: Database["public"]["Enums"]["inquiry_status"];
          subject?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      media_assets: {
        Row: {
          alt_text: string | null;
          created_at: string;
          file_name: string;
          height: number | null;
          id: string;
          mime_type: string;
          size_bytes: number;
          storage_path: string;
          uploaded_by: string | null;
          width: number | null;
        };
        Insert: {
          alt_text?: string | null;
          created_at?: string;
          file_name: string;
          height?: number | null;
          id?: string;
          mime_type: string;
          size_bytes?: number;
          storage_path: string;
          uploaded_by?: string | null;
          width?: number | null;
        };
        Update: {
          alt_text?: string | null;
          created_at?: string;
          file_name?: string;
          height?: number | null;
          id?: string;
          mime_type?: string;
          size_bytes?: number;
          storage_path?: string;
          uploaded_by?: string | null;
          width?: number | null;
        };
        Relationships: [];
      };
      ministries: {
        Row: {
          contact: string | null;
          created_at: string;
          created_by: string | null;
          description: string;
          display_order: number;
          featured_image_url: string | null;
          id: string;
          is_active: boolean;
          name: string;
          schedule: string | null;
          slug: string;
          status: Database["public"]["Enums"]["content_status"];
          updated_at: string;
        };
        Insert: {
          contact?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string;
          display_order?: number;
          featured_image_url?: string | null;
          id?: string;
          is_active?: boolean;
          name: string;
          schedule?: string | null;
          slug: string;
          status?: Database["public"]["Enums"]["content_status"];
          updated_at?: string;
        };
        Update: {
          contact?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string;
          display_order?: number;
          featured_image_url?: string | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          schedule?: string | null;
          slug?: string;
          status?: Database["public"]["Enums"]["content_status"];
          updated_at?: string;
        };
        Relationships: [];
      };
      pages: {
        Row: {
          body: string;
          created_at: string;
          created_by: string | null;
          featured_image_url: string | null;
          id: string;
          published_at: string | null;
          seo_description: string | null;
          seo_title: string | null;
          slug: string;
          status: Database["public"]["Enums"]["content_status"];
          title: string;
          updated_at: string;
        };
        Insert: {
          body?: string;
          created_at?: string;
          created_by?: string | null;
          featured_image_url?: string | null;
          id?: string;
          published_at?: string | null;
          seo_description?: string | null;
          seo_title?: string | null;
          slug: string;
          status?: Database["public"]["Enums"]["content_status"];
          title: string;
          updated_at?: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          created_by?: string | null;
          featured_image_url?: string | null;
          id?: string;
          published_at?: string | null;
          seo_description?: string | null;
          seo_title?: string | null;
          slug?: string;
          status?: Database["public"]["Enums"]["content_status"];
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      prayer_requests: {
        Row: {
          assigned_to: string | null;
          contact: string | null;
          created_at: string;
          id: string;
          internal_notes: string | null;
          is_private: boolean;
          message: string;
          status: Database["public"]["Enums"]["prayer_status"];
          submitter_name: string | null;
          updated_at: string;
        };
        Insert: {
          assigned_to?: string | null;
          contact?: string | null;
          created_at?: string;
          id?: string;
          internal_notes?: string | null;
          is_private?: boolean;
          message: string;
          status?: Database["public"]["Enums"]["prayer_status"];
          submitter_name?: string | null;
          updated_at?: string;
        };
        Update: {
          assigned_to?: string | null;
          contact?: string | null;
          created_at?: string;
          id?: string;
          internal_notes?: string | null;
          is_private?: boolean;
          message?: string;
          status?: Database["public"]["Enums"]["prayer_status"];
          submitter_name?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string | null;
          full_name: string | null;
          id: string;
          is_active: boolean;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id: string;
          is_active?: boolean;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      role_permissions: {
        Row: {
          id: string;
          permission: string;
          role: Database["public"]["Enums"]["app_role"];
        };
        Insert: {
          id?: string;
          permission: string;
          role: Database["public"]["Enums"]["app_role"];
        };
        Update: {
          id?: string;
          permission?: string;
          role?: Database["public"]["Enums"]["app_role"];
        };
        Relationships: [];
      };
      sermons: {
        Row: {
          audio_url: string | null;
          created_at: string;
          created_by: string | null;
          description: string;
          id: string;
          is_featured: boolean;
          passage: string | null;
          published_at: string | null;
          sermon_date: string | null;
          slug: string;
          speaker: string;
          status: Database["public"]["Enums"]["content_status"];
          thumbnail_url: string | null;
          title: string;
          topic: string | null;
          updated_at: string;
          video_url: string | null;
        };
        Insert: {
          audio_url?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string;
          id?: string;
          is_featured?: boolean;
          passage?: string | null;
          published_at?: string | null;
          sermon_date?: string | null;
          slug: string;
          speaker?: string;
          status?: Database["public"]["Enums"]["content_status"];
          thumbnail_url?: string | null;
          title: string;
          topic?: string | null;
          updated_at?: string;
          video_url?: string | null;
        };
        Update: {
          audio_url?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string;
          id?: string;
          is_featured?: boolean;
          passage?: string | null;
          published_at?: string | null;
          sermon_date?: string | null;
          slug?: string;
          speaker?: string;
          status?: Database["public"]["Enums"]["content_status"];
          thumbnail_url?: string | null;
          title?: string;
          topic?: string | null;
          updated_at?: string;
          video_url?: string | null;
        };
        Relationships: [];
      };
      staff_invitations: {
        Row: {
          accepted_at: string | null;
          created_at: string;
          email: string;
          id: string;
          invited_by: string | null;
          role: Database["public"]["Enums"]["app_role"];
        };
        Insert: {
          accepted_at?: string | null;
          created_at?: string;
          email: string;
          id?: string;
          invited_by?: string | null;
          role: Database["public"]["Enums"]["app_role"];
        };
        Update: {
          accepted_at?: string | null;
          created_at?: string;
          email?: string;
          id?: string;
          invited_by?: string | null;
          role?: Database["public"]["Enums"]["app_role"];
        };
        Relationships: [];
      };
      user_permissions: {
        Row: {
          id: string;
          permission: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          permission: string;
          user_id: string;
        };
        Update: {
          id?: string;
          permission?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_permission: {
        Args: { _permission: string; _user_id: string };
        Returns: boolean;
      };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "super_admin" | "pastor" | "content_editor" | "event_coordinator" | "support_staff";
      content_status: "draft" | "published" | "archived";
      inquiry_status: "new" | "in_progress" | "contacted" | "resolved" | "archived";
      prayer_status: "new" | "under_prayer" | "follow_up" | "completed" | "archived";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["super_admin", "pastor", "content_editor", "event_coordinator", "support_staff"],
      content_status: ["draft", "published", "archived"],
      inquiry_status: ["new", "in_progress", "contacted", "resolved", "archived"],
      prayer_status: ["new", "under_prayer", "follow_up", "completed", "archived"],
    },
  },
} as const;
