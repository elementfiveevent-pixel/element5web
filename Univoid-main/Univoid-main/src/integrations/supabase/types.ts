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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          status: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          status?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          status?: string
        }
        Relationships: []
      }
      blocked_email_domains: {
        Row: {
          created_at: string
          domain: string
          id: string
        }
        Insert: {
          created_at?: string
          domain: string
          id?: string
        }
        Update: {
          created_at?: string
          domain?: string
          id?: string
        }
        Relationships: []
      }
      books: {
        Row: {
          author: string | null
          book_status: Database["public"]["Enums"]["book_status"]
          category: string | null
          condition: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          image_urls: string[] | null
          is_sold: boolean
          listing_type: string | null
          price: number | null
          seller_address: string
          seller_email: string
          seller_mobile: string
          slug: string | null
          status: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at: string
          views_count: number
        }
        Insert: {
          author?: string | null
          book_status?: Database["public"]["Enums"]["book_status"]
          category?: string | null
          condition?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          image_urls?: string[] | null
          is_sold?: boolean
          listing_type?: string | null
          price?: number | null
          seller_address: string
          seller_email: string
          seller_mobile: string
          slug?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at?: string
          views_count?: number
        }
        Update: {
          author?: string | null
          book_status?: Database["public"]["Enums"]["book_status"]
          category?: string | null
          condition?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          image_urls?: string[] | null
          is_sold?: boolean
          listing_type?: string | null
          price?: number | null
          seller_address?: string
          seller_email?: string
          seller_mobile?: string
          slug?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          title?: string
          updated_at?: string
          views_count?: number
        }
        Relationships: []
      }
      check_in_audit_log: {
        Row: {
          action: string
          created_at: string | null
          device_fingerprint: string | null
          event_id: string
          id: string
          ip_address: string | null
          metadata: Json | null
          organizer_id: string
          ticket_id: string
          user_agent: string | null
          verification_method: string
        }
        Insert: {
          action: string
          created_at?: string | null
          device_fingerprint?: string | null
          event_id: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          organizer_id: string
          ticket_id: string
          user_agent?: string | null
          verification_method: string
        }
        Update: {
          action?: string
          created_at?: string | null
          device_fingerprint?: string | null
          event_id?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          organizer_id?: string
          ticket_id?: string
          user_agent?: string | null
          verification_method?: string
        }
        Relationships: [
          {
            foreignKeyName: "check_in_audit_log_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "check_in_audit_log_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "event_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      club_members: {
        Row: {
          club_id: string
          created_at: string
          id: string
          membership_id: string | null
          user_id: string
          verified: boolean
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          club_id: string
          created_at?: string
          id?: string
          membership_id?: string | null
          user_id: string
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          club_id?: string
          created_at?: string
          id?: string
          membership_id?: string | null
          user_id?: string
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "club_members_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      clubs: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          logo_url: string | null
          name: string
          short_name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          short_name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          short_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      colleges: {
        Row: {
          college_name: string
          college_type: string | null
          created_at: string
          district: string
          id: string
          is_popular: boolean | null
          state: string
          university: string
        }
        Insert: {
          college_name: string
          college_type?: string | null
          created_at?: string
          district: string
          id?: string
          is_popular?: boolean | null
          state: string
          university: string
        }
        Update: {
          college_name?: string
          college_type?: string | null
          created_at?: string
          district?: string
          id?: string
          is_popular?: boolean | null
          state?: string
          university?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          is_read: boolean
          message: string
          name: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_read?: boolean
          message: string
          name: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_read?: boolean
          message?: string
          name?: string
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          body_preview: string | null
          created_at: string
          error_message: string | null
          event_id: string | null
          id: string
          recipients_count: number
          sender_id: string
          sender_type: string
          sent_at: string | null
          status: string
          subject: string
        }
        Insert: {
          body_preview?: string | null
          created_at?: string
          error_message?: string | null
          event_id?: string | null
          id?: string
          recipients_count?: number
          sender_id: string
          sender_type: string
          sent_at?: string | null
          status?: string
          subject: string
        }
        Update: {
          body_preview?: string | null
          created_at?: string
          error_message?: string | null
          event_id?: string | null
          id?: string
          recipients_count?: number
          sender_id?: string
          sender_type?: string
          sent_at?: string | null
          status?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      email_preferences: {
        Row: {
          created_at: string
          event_alerts: boolean
          id: string
          interest_based_alerts: boolean | null
          location_based_alerts: boolean | null
          scholarship_alerts: boolean
          updated_at: string
          user_id: string
          weekly_digest: boolean
        }
        Insert: {
          created_at?: string
          event_alerts?: boolean
          id?: string
          interest_based_alerts?: boolean | null
          location_based_alerts?: boolean | null
          scholarship_alerts?: boolean
          updated_at?: string
          user_id: string
          weekly_digest?: boolean
        }
        Update: {
          created_at?: string
          event_alerts?: boolean
          id?: string
          interest_based_alerts?: boolean | null
          location_based_alerts?: boolean | null
          scholarship_alerts?: boolean
          updated_at?: string
          user_id?: string
          weekly_digest?: boolean
        }
        Relationships: []
      }
      error_logs: {
        Row: {
          component_name: string | null
          created_at: string
          error_message: string
          error_stack: string | null
          error_type: string
          id: string
          metadata: Json | null
          page_route: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          component_name?: string | null
          created_at?: string
          error_message: string
          error_stack?: string | null
          error_type: string
          id?: string
          metadata?: Json | null
          page_route?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          component_name?: string | null
          created_at?: string
          error_message?: string
          error_stack?: string | null
          error_type?: string
          id?: string
          metadata?: Json | null
          page_route?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      event_checkout_visits: {
        Row: {
          created_at: string
          event_id: string
          id: string
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_checkout_visits_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_clubs: {
        Row: {
          club_id: string
          created_at: string
          event_id: string
          id: string
          member_benefits: string | null
          member_price: number
        }
        Insert: {
          club_id: string
          created_at?: string
          event_id: string
          id?: string
          member_benefits?: string | null
          member_price?: number
        }
        Update: {
          club_id?: string
          created_at?: string
          event_id?: string
          id?: string
          member_benefits?: string | null
          member_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_clubs_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_clubs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_delete_log: {
        Row: {
          deleted_at: string
          deleted_by: string
          event_id: string
          event_title: string
          id: string
          metadata: Json | null
          organizer_id: string
          registrations_count: number | null
        }
        Insert: {
          deleted_at?: string
          deleted_by: string
          event_id: string
          event_title: string
          id?: string
          metadata?: Json | null
          organizer_id: string
          registrations_count?: number | null
        }
        Update: {
          deleted_at?: string
          deleted_by?: string
          event_id?: string
          event_title?: string
          id?: string
          metadata?: Json | null
          organizer_id?: string
          registrations_count?: number | null
        }
        Relationships: []
      }
      event_form_fields: {
        Row: {
          conditional_logic: Json | null
          created_at: string
          description: string | null
          event_id: string
          field_order: number
          field_type: Database["public"]["Enums"]["form_field_type"]
          id: string
          is_required: boolean
          label: string
          options: Json | null
          placeholder: string | null
          updated_at: string
          validation_rules: Json | null
        }
        Insert: {
          conditional_logic?: Json | null
          created_at?: string
          description?: string | null
          event_id: string
          field_order?: number
          field_type?: Database["public"]["Enums"]["form_field_type"]
          id?: string
          is_required?: boolean
          label: string
          options?: Json | null
          placeholder?: string | null
          updated_at?: string
          validation_rules?: Json | null
        }
        Update: {
          conditional_logic?: Json | null
          created_at?: string
          description?: string | null
          event_id?: string
          field_order?: number
          field_type?: Database["public"]["Enums"]["form_field_type"]
          id?: string
          is_required?: boolean
          label?: string
          options?: Json | null
          placeholder?: string | null
          updated_at?: string
          validation_rules?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "event_form_fields_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_form_templates: {
        Row: {
          created_at: string
          description: string | null
          fields: Json
          id: string
          name: string
          organizer_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          fields?: Json
          id?: string
          name: string
          organizer_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          fields?: Json
          id?: string
          name?: string
          organizer_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      event_materials: {
        Row: {
          created_at: string
          downloads_count: number
          event_id: string
          file_type: string
          file_url: string
          id: string
          title: string
        }
        Insert: {
          created_at?: string
          downloads_count?: number
          event_id: string
          file_type: string
          file_url: string
          id?: string
          title: string
        }
        Update: {
          created_at?: string
          downloads_count?: number
          event_id?: string
          file_type?: string
          file_url?: string
          id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_materials_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          addons_amount: number | null
          base_amount: number | null
          created_at: string
          custom_data: Json | null
          event_id: string
          group_size: number | null
          id: string
          is_group_booking: boolean | null
          payment_screenshot_url: string | null
          payment_status: Database["public"]["Enums"]["ticket_status"]
          razorpay_order_id: string | null
          razorpay_paid_at: string | null
          razorpay_payment_details: Json | null
          razorpay_payment_id: string | null
          razorpay_payment_method: string | null
          razorpay_payment_status: string | null
          reviewed_at: string | null
          team_id: string | null
          total_amount: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          addons_amount?: number | null
          base_amount?: number | null
          created_at?: string
          custom_data?: Json | null
          event_id: string
          group_size?: number | null
          id?: string
          is_group_booking?: boolean | null
          payment_screenshot_url?: string | null
          payment_status?: Database["public"]["Enums"]["ticket_status"]
          razorpay_order_id?: string | null
          razorpay_paid_at?: string | null
          razorpay_payment_details?: Json | null
          razorpay_payment_id?: string | null
          razorpay_payment_method?: string | null
          razorpay_payment_status?: string | null
          reviewed_at?: string | null
          team_id?: string | null
          total_amount?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          addons_amount?: number | null
          base_amount?: number | null
          created_at?: string
          custom_data?: Json | null
          event_id?: string
          group_size?: number | null
          id?: string
          is_group_booking?: boolean | null
          payment_screenshot_url?: string | null
          payment_status?: Database["public"]["Enums"]["ticket_status"]
          razorpay_order_id?: string | null
          razorpay_paid_at?: string | null
          razorpay_payment_details?: Json | null
          razorpay_payment_id?: string | null
          razorpay_payment_method?: string | null
          razorpay_payment_status?: string | null
          reviewed_at?: string | null
          team_id?: string | null
          total_amount?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_sheets_config: {
        Row: {
          auto_sync: boolean
          created_at: string
          event_id: string
          id: string
          last_sync_at: string | null
          sheet_name: string
          spreadsheet_id: string
          updated_at: string
        }
        Insert: {
          auto_sync?: boolean
          created_at?: string
          event_id: string
          id?: string
          last_sync_at?: string | null
          sheet_name?: string
          spreadsheet_id: string
          updated_at?: string
        }
        Update: {
          auto_sync?: boolean
          created_at?: string
          event_id?: string
          id?: string
          last_sync_at?: string | null
          sheet_name?: string
          spreadsheet_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_sheets_config_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_tickets: {
        Row: {
          abuse_flag: boolean | null
          created_at: string
          device_fingerprint: string | null
          event_id: string
          group_entry_acknowledged: boolean | null
          group_size: number | null
          id: string
          is_group_booking: boolean | null
          is_used: boolean
          last_scan_attempt: string | null
          qr_code: string
          registration_id: string
          scan_attempts: number | null
          token_hash: string | null
          used_at: string | null
          used_by: string | null
          user_id: string
          verification_method: string | null
        }
        Insert: {
          abuse_flag?: boolean | null
          created_at?: string
          device_fingerprint?: string | null
          event_id: string
          group_entry_acknowledged?: boolean | null
          group_size?: number | null
          id?: string
          is_group_booking?: boolean | null
          is_used?: boolean
          last_scan_attempt?: string | null
          qr_code: string
          registration_id: string
          scan_attempts?: number | null
          token_hash?: string | null
          used_at?: string | null
          used_by?: string | null
          user_id: string
          verification_method?: string | null
        }
        Update: {
          abuse_flag?: boolean | null
          created_at?: string
          device_fingerprint?: string | null
          event_id?: string
          group_entry_acknowledged?: boolean | null
          group_size?: number | null
          id?: string
          is_group_booking?: boolean | null
          is_used?: boolean
          last_scan_attempt?: string | null
          qr_code?: string
          registration_id?: string
          scan_attempts?: number | null
          token_hash?: string | null
          used_at?: string | null
          used_by?: string | null
          user_id?: string
          verification_method?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_tickets_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "event_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_upsell_settings: {
        Row: {
          created_at: string
          event_id: string
          id: string
          show_addons: boolean
          show_group_offers: boolean
          updated_at: string
          upsell_enabled: boolean
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          show_addons?: boolean
          show_group_offers?: boolean
          updated_at?: string
          upsell_enabled?: boolean
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          show_addons?: boolean
          show_group_offers?: boolean
          updated_at?: string
          upsell_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "event_upsell_settings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_upsells: {
        Row: {
          allow_custom_input: boolean | null
          created_at: string
          custom_input_label: string | null
          custom_input_max_length: number | null
          custom_input_placeholder: string | null
          description: string | null
          discount_amount: number | null
          display_order: number
          event_id: string
          group_size: number | null
          id: string
          is_active: boolean
          max_quantity: number | null
          min_quantity: number | null
          name: string
          price: number
          updated_at: string
          upsell_type: string
        }
        Insert: {
          allow_custom_input?: boolean | null
          created_at?: string
          custom_input_label?: string | null
          custom_input_max_length?: number | null
          custom_input_placeholder?: string | null
          description?: string | null
          discount_amount?: number | null
          display_order?: number
          event_id: string
          group_size?: number | null
          id?: string
          is_active?: boolean
          max_quantity?: number | null
          min_quantity?: number | null
          name: string
          price?: number
          updated_at?: string
          upsell_type: string
        }
        Update: {
          allow_custom_input?: boolean | null
          created_at?: string
          custom_input_label?: string | null
          custom_input_max_length?: number | null
          custom_input_placeholder?: string | null
          description?: string | null
          discount_amount?: number | null
          display_order?: number
          event_id?: string
          group_size?: number | null
          id?: string
          is_active?: boolean
          max_quantity?: number | null
          min_quantity?: number | null
          name?: string
          price?: number
          updated_at?: string
          upsell_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_upsells_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_volunteer_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          event_id: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["volunteer_invite_role"]
          status: Database["public"]["Enums"]["volunteer_invite_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          event_id: string
          id?: string
          invited_by: string
          role?: Database["public"]["Enums"]["volunteer_invite_role"]
          status?: Database["public"]["Enums"]["volunteer_invite_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          event_id?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["volunteer_invite_role"]
          status?: Database["public"]["Enums"]["volunteer_invite_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_volunteer_invites_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          allow_audience_members: boolean
          artist_free_entry: boolean
          category: string
          city: string | null
          created_at: string
          custom_fields: Json | null
          description: string | null
          enable_quick_register: boolean
          end_date: string | null
          event_type: string
          flyer_url: string | null
          id: string
          is_location_decided: boolean
          is_paid: boolean
          maps_link: string | null
          max_capacity: number | null
          organizer_id: string
          poster_ratio: string | null
          price: number | null
          registration_end_date: string | null
          registrations_count: number
          slug: string | null
          start_date: string
          state: string | null
          status: Database["public"]["Enums"]["event_status"]
          terms_conditions: string | null
          title: string
          updated_at: string
          upi_qr_url: string | null
          upi_vpa: string | null
          venue_address: string | null
          venue_name: string | null
          views_count: number
        }
        Insert: {
          allow_audience_members?: boolean
          artist_free_entry?: boolean
          category: string
          city?: string | null
          created_at?: string
          custom_fields?: Json | null
          description?: string | null
          enable_quick_register?: boolean
          end_date?: string | null
          event_type: string
          flyer_url?: string | null
          id?: string
          is_location_decided?: boolean
          is_paid?: boolean
          maps_link?: string | null
          max_capacity?: number | null
          organizer_id: string
          poster_ratio?: string | null
          price?: number | null
          registration_end_date?: string | null
          registrations_count?: number
          slug?: string | null
          start_date: string
          state?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          terms_conditions?: string | null
          title: string
          updated_at?: string
          upi_qr_url?: string | null
          upi_vpa?: string | null
          venue_address?: string | null
          venue_name?: string | null
          views_count?: number
        }
        Update: {
          allow_audience_members?: boolean
          artist_free_entry?: boolean
          category?: string
          city?: string | null
          created_at?: string
          custom_fields?: Json | null
          description?: string | null
          enable_quick_register?: boolean
          end_date?: string | null
          event_type?: string
          flyer_url?: string | null
          id?: string
          is_location_decided?: boolean
          is_paid?: boolean
          maps_link?: string | null
          max_capacity?: number | null
          organizer_id?: string
          poster_ratio?: string | null
          price?: number | null
          registration_end_date?: string | null
          registrations_count?: number
          slug?: string | null
          start_date?: string
          state?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          terms_conditions?: string | null
          title?: string
          updated_at?: string
          upi_qr_url?: string | null
          upi_vpa?: string | null
          venue_address?: string | null
          venue_name?: string | null
          views_count?: number
        }
        Relationships: []
      }
      lookup_branches: {
        Row: {
          created_at: string
          id: string
          is_popular: boolean | null
          name: string
          short_name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_popular?: boolean | null
          name: string
          short_name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_popular?: boolean | null
          name?: string
          short_name?: string | null
        }
        Relationships: []
      }
      lookup_cities: {
        Row: {
          created_at: string
          id: string
          is_popular: boolean | null
          name: string
          state_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_popular?: boolean | null
          name: string
          state_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_popular?: boolean | null
          name?: string
          state_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lookup_cities_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "lookup_states"
            referencedColumns: ["id"]
          },
        ]
      }
      lookup_states: {
        Row: {
          code: string | null
          created_at: string
          id: string
          is_popular: boolean | null
          name: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          is_popular?: boolean | null
          name: string
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          is_popular?: boolean | null
          name?: string
        }
        Relationships: []
      }
      lookup_universities: {
        Row: {
          city_id: string | null
          created_at: string
          id: string
          is_popular: boolean | null
          name: string
          state_id: string | null
          type: string | null
        }
        Insert: {
          city_id?: string | null
          created_at?: string
          id?: string
          is_popular?: boolean | null
          name: string
          state_id?: string | null
          type?: string | null
        }
        Update: {
          city_id?: string | null
          created_at?: string
          id?: string
          is_popular?: boolean | null
          name?: string
          state_id?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lookup_universities_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "lookup_cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lookup_universities_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "lookup_states"
            referencedColumns: ["id"]
          },
        ]
      }
      material_likes: {
        Row: {
          created_at: string
          id: string
          material_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          material_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          material_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_likes_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          admin_previewed: boolean | null
          branch: string | null
          college: string | null
          course: string | null
          created_at: string
          created_by: string
          description: string | null
          downloads_count: number
          file_hash: string | null
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          language: string | null
          likes_count: number
          preview_file_url: string | null
          preview_page_limit: number | null
          preview_ready: boolean | null
          shares_count: number
          status: Database["public"]["Enums"]["content_status"]
          subject: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          views_count: number
        }
        Insert: {
          admin_previewed?: boolean | null
          branch?: string | null
          college?: string | null
          course?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          downloads_count?: number
          file_hash?: string | null
          file_size?: number | null
          file_type: string
          file_url: string
          id?: string
          language?: string | null
          likes_count?: number
          preview_file_url?: string | null
          preview_page_limit?: number | null
          preview_ready?: boolean | null
          shares_count?: number
          status?: Database["public"]["Enums"]["content_status"]
          subject?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          views_count?: number
        }
        Update: {
          admin_previewed?: boolean | null
          branch?: string | null
          college?: string | null
          course?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          downloads_count?: number
          file_hash?: string | null
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          language?: string | null
          likes_count?: number
          preview_file_url?: string | null
          preview_page_limit?: number | null
          preview_ready?: boolean | null
          shares_count?: number
          status?: Database["public"]["Enums"]["content_status"]
          subject?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          views_count?: number
        }
        Relationships: []
      }
      news: {
        Row: {
          category: string | null
          content: string
          created_at: string
          created_by: string
          external_link: string | null
          id: string
          image_urls: string[] | null
          status: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          created_by: string
          external_link?: string | null
          id?: string
          image_urls?: string[] | null
          status?: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          created_by?: string
          external_link?: string | null
          id?: string
          image_urls?: string[] | null
          status?: Database["public"]["Enums"]["content_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      organizer_applications: {
        Row: {
          created_at: string
          id: string
          proof_url: string
          reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["organizer_application_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          proof_url: string
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["organizer_application_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          proof_url?: string
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["organizer_application_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      organizer_followers: {
        Row: {
          followed_at: string
          id: string
          organizer_id: string
          user_id: string
        }
        Insert: {
          followed_at?: string
          id?: string
          organizer_id: string
          user_id: string
        }
        Update: {
          followed_at?: string
          id?: string
          organizer_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizer_followers_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "organizer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizer_profiles: {
        Row: {
          average_event_size:
            | Database["public"]["Enums"]["event_size_type"]
            | null
          created_at: string
          discovery_source: string | null
          event_frequency:
            | Database["public"]["Enums"]["event_frequency_type"]
            | null
          event_types: string[] | null
          events_count: number
          follower_count: number
          id: string
          identity_type:
            | Database["public"]["Enums"]["organizer_identity_type"]
            | null
          is_verified: boolean
          logo_url: string | null
          name: string
          primary_goals: string[] | null
          slug: string | null
          updated_at: string
          user_id: string
          website_url: string | null
        }
        Insert: {
          average_event_size?:
            | Database["public"]["Enums"]["event_size_type"]
            | null
          created_at?: string
          discovery_source?: string | null
          event_frequency?:
            | Database["public"]["Enums"]["event_frequency_type"]
            | null
          event_types?: string[] | null
          events_count?: number
          follower_count?: number
          id?: string
          identity_type?:
            | Database["public"]["Enums"]["organizer_identity_type"]
            | null
          is_verified?: boolean
          logo_url?: string | null
          name: string
          primary_goals?: string[] | null
          slug?: string | null
          updated_at?: string
          user_id: string
          website_url?: string | null
        }
        Update: {
          average_event_size?:
            | Database["public"]["Enums"]["event_size_type"]
            | null
          created_at?: string
          discovery_source?: string | null
          event_frequency?:
            | Database["public"]["Enums"]["event_frequency_type"]
            | null
          event_types?: string[] | null
          events_count?: number
          follower_count?: number
          id?: string
          identity_type?:
            | Database["public"]["Enums"]["organizer_identity_type"]
            | null
          is_verified?: boolean
          logo_url?: string | null
          name?: string
          primary_goals?: string[] | null
          slug?: string | null
          updated_at?: string
          user_id?: string
          website_url?: string | null
        }
        Relationships: []
      }
      otp_rate_limits: {
        Row: {
          created_at: string | null
          id: string
          last_send_at: string | null
          send_count: number | null
          user_id: string
          verify_count: number | null
          window_start: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_send_at?: string | null
          send_count?: number | null
          user_id: string
          verify_count?: number | null
          window_start?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_send_at?: string | null
          send_count?: number | null
          user_id?: string
          verify_count?: number | null
          window_start?: string | null
        }
        Relationships: []
      }
      phone_otp_codes: {
        Row: {
          attempts: number
          created_at: string
          expires_at: string
          id: string
          otp_code: string
          user_id: string
          verified: boolean
        }
        Insert: {
          attempts?: number
          created_at?: string
          expires_at: string
          id?: string
          otp_code: string
          user_id: string
          verified?: boolean
        }
        Update: {
          attempts?: number
          created_at?: string
          expires_at?: string
          id?: string
          otp_code?: string
          user_id?: string
          verified?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          branch: string | null
          city: string | null
          college_name: string | null
          course_stream: string | null
          created_at: string
          current_year: number | null
          degree: string | null
          email: string
          email_verified: boolean | null
          full_name: string
          id: string
          interests: string[] | null
          is_disabled: boolean
          mobile_number: string | null
          onboarding_status: string | null
          phone_verified: boolean | null
          profile_complete: boolean | null
          profile_photo_url: string | null
          profile_type: string | null
          state: string | null
          total_xp: number
          updated_at: string
          year_semester: string | null
        }
        Insert: {
          branch?: string | null
          city?: string | null
          college_name?: string | null
          course_stream?: string | null
          created_at?: string
          current_year?: number | null
          degree?: string | null
          email: string
          email_verified?: boolean | null
          full_name: string
          id: string
          interests?: string[] | null
          is_disabled?: boolean
          mobile_number?: string | null
          onboarding_status?: string | null
          phone_verified?: boolean | null
          profile_complete?: boolean | null
          profile_photo_url?: string | null
          profile_type?: string | null
          state?: string | null
          total_xp?: number
          updated_at?: string
          year_semester?: string | null
        }
        Update: {
          branch?: string | null
          city?: string | null
          college_name?: string | null
          course_stream?: string | null
          created_at?: string
          current_year?: number | null
          degree?: string | null
          email?: string
          email_verified?: boolean | null
          full_name?: string
          id?: string
          interests?: string[] | null
          is_disabled?: boolean
          mobile_number?: string | null
          onboarding_status?: string | null
          phone_verified?: boolean | null
          profile_complete?: boolean | null
          profile_photo_url?: string | null
          profile_type?: string | null
          state?: string | null
          total_xp?: number
          updated_at?: string
          year_semester?: string | null
        }
        Relationships: []
      }
      project_members: {
        Row: {
          id: string
          joined_at: string
          project_id: string
          role: string | null
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          project_id: string
          role?: string | null
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          project_id?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_requests: {
        Row: {
          created_at: string
          id: string
          message: string | null
          project_id: string
          reviewed_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          project_id: string
          reviewed_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          project_id?: string
          reviewed_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tasks: {
        Row: {
          assigned_to: string | null
          created_at: string
          deadline: string | null
          description: string | null
          id: string
          project_id: string
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          project_id: string
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          project_id?: string
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_open: boolean | null
          linked_event_id: string | null
          max_members: number | null
          owner_id: string
          skills_required: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_open?: boolean | null
          linked_event_id?: string | null
          max_members?: number | null
          owner_id: string
          skills_required?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_open?: boolean | null
          linked_event_id?: string | null
          max_members?: number | null
          owner_id?: string
          skills_required?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_linked_event_id_fkey"
            columns: ["linked_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      registration_addons: {
        Row: {
          created_at: string
          custom_input_value: string | null
          id: string
          quantity: number
          registration_id: string
          total_price: number
          unit_price: number
          upsell_id: string
        }
        Insert: {
          created_at?: string
          custom_input_value?: string | null
          id?: string
          quantity?: number
          registration_id: string
          total_price: number
          unit_price: number
          upsell_id: string
        }
        Update: {
          created_at?: string
          custom_input_value?: string | null
          id?: string
          quantity?: number
          registration_id?: string
          total_price?: number
          unit_price?: number
          upsell_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "registration_addons_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "event_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registration_addons_upsell_id_fkey"
            columns: ["upsell_id"]
            isOneToOne: false
            referencedRelation: "event_upsells"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          comment: string | null
          content_id: string
          content_type: string
          created_at: string
          id: string
          reasons: string[]
          reported_user_id: string
          reporter_id: string
          status: string
        }
        Insert: {
          comment?: string | null
          content_id: string
          content_type: string
          created_at?: string
          id?: string
          reasons: string[]
          reported_user_id: string
          reporter_id: string
          status?: string
        }
        Update: {
          comment?: string | null
          content_id?: string
          content_type?: string
          created_at?: string
          id?: string
          reasons?: string[]
          reported_user_id?: string
          reporter_id?: string
          status?: string
        }
        Relationships: []
      }
      scholarship_reminders: {
        Row: {
          created_at: string
          id: string
          remind_days_before: number
          reminder_sent: boolean
          scholarship_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          remind_days_before?: number
          reminder_sent?: boolean
          scholarship_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          remind_days_before?: number
          reminder_sent?: boolean
          scholarship_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scholarship_reminders_scholarship_id_fkey"
            columns: ["scholarship_id"]
            isOneToOne: false
            referencedRelation: "scholarships"
            referencedColumns: ["id"]
          },
        ]
      }
      scholarships: {
        Row: {
          application_link: string | null
          created_at: string
          created_by: string | null
          deadline: string | null
          deadline_status: string | null
          description: string | null
          eligible_categories: string[] | null
          eligible_courses: string[] | null
          eligible_states: string[] | null
          id: string
          is_all_india: boolean | null
          official_source: boolean | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          source_domain: string | null
          source_name: string
          source_url: string | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          application_link?: string | null
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          deadline_status?: string | null
          description?: string | null
          eligible_categories?: string[] | null
          eligible_courses?: string[] | null
          eligible_states?: string[] | null
          id?: string
          is_all_india?: boolean | null
          official_source?: boolean | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_domain?: string | null
          source_name: string
          source_url?: string | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          application_link?: string | null
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          deadline_status?: string | null
          description?: string | null
          eligible_categories?: string[] | null
          eligible_courses?: string[] | null
          eligible_states?: string[] | null
          id?: string
          is_all_india?: boolean | null
          official_source?: boolean | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_domain?: string | null
          source_name?: string
          source_url?: string | null
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      task_bids: {
        Row: {
          created_at: string
          id: string
          message: string | null
          solver_id: string
          status: string | null
          task_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          solver_id: string
          status?: string | null
          task_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          solver_id?: string
          status?: string | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_bids_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "task_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      task_requests: {
        Row: {
          assigned_to: string | null
          attachment_urls: string[] | null
          budget: number | null
          created_at: string
          deadline: string | null
          description: string | null
          id: string
          is_negotiable: boolean | null
          page_count: number | null
          requester_id: string
          status: string | null
          subject: string | null
          task_type: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          attachment_urls?: string[] | null
          budget?: number | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          is_negotiable?: boolean | null
          page_count?: number | null
          requester_id: string
          status?: string | null
          subject?: string | null
          task_type: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          attachment_urls?: string[] | null
          budget?: number | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          is_negotiable?: boolean | null
          page_count?: number | null
          requester_id?: string
          status?: string | null
          subject?: string | null
          task_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      ticket_attendees: {
        Row: {
          attendee_email: string
          attendee_mobile: string | null
          attendee_name: string
          created_at: string
          id: string
          qr_code: string | null
          registration_id: string
          ticket_category_id: string
          ticket_id: string | null
        }
        Insert: {
          attendee_email: string
          attendee_mobile?: string | null
          attendee_name: string
          created_at?: string
          id?: string
          qr_code?: string | null
          registration_id: string
          ticket_category_id: string
          ticket_id?: string | null
        }
        Update: {
          attendee_email?: string
          attendee_mobile?: string | null
          attendee_name?: string
          created_at?: string
          id?: string
          qr_code?: string | null
          registration_id?: string
          ticket_category_id?: string
          ticket_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_attendees_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "event_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_attendees_ticket_category_id_fkey"
            columns: ["ticket_category_id"]
            isOneToOne: false
            referencedRelation: "ticket_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_attendees_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "event_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          event_id: string
          id: string
          is_active: boolean
          max_per_user: number
          max_total: number | null
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          event_id: string
          id?: string
          is_active?: boolean
          max_per_user?: number
          max_total?: number | null
          name: string
          price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          event_id?: string
          id?: string
          is_active?: boolean
          max_per_user?: number
          max_total?: number | null
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_categories_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
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
          role?: Database["public"]["Enums"]["app_role"]
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
      volunteer_assignments: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          created_at: string
          id: string
          notes: string | null
          role_id: string
          status: string
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          role_id: string
          status?: string
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          role_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_assignments_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "volunteer_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_attendance: {
        Row: {
          check_in_at: string
          check_out_at: string | null
          created_at: string
          event_id: string
          id: string
          invite_id: string | null
          notes: string | null
          total_hours: number | null
          user_id: string
        }
        Insert: {
          check_in_at?: string
          check_out_at?: string | null
          created_at?: string
          event_id: string
          id?: string
          invite_id?: string | null
          notes?: string | null
          total_hours?: number | null
          user_id: string
        }
        Update: {
          check_in_at?: string
          check_out_at?: string | null
          created_at?: string
          event_id?: string
          id?: string
          invite_id?: string | null
          notes?: string | null
          total_hours?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_attendance_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_attendance_invite_id_fkey"
            columns: ["invite_id"]
            isOneToOne: false
            referencedRelation: "event_volunteer_invites"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_roles: {
        Row: {
          created_at: string
          description: string | null
          event_id: string
          id: string
          perks: string | null
          responsibilities: string[] | null
          slots_available: number
          slots_filled: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_id: string
          id?: string
          perks?: string | null
          responsibilities?: string[] | null
          slots_available?: number
          slots_filled?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_id?: string
          id?: string
          perks?: string | null
          responsibilities?: string[] | null
          slots_available?: number
          slots_filled?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_roles_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      xp_transactions: {
        Row: {
          amount: number
          content_id: string | null
          content_type: string | null
          created_at: string
          id: string
          reason: string
          user_id: string
        }
        Insert: {
          amount: number
          content_id?: string | null
          content_type?: string | null
          created_at?: string
          id?: string
          reason: string
          user_id: string
        }
        Update: {
          amount?: number
          content_id?: string | null
          content_type?: string | null
          created_at?: string
          id?: string
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      leaderboard_profiles: {
        Row: {
          college_name: string | null
          full_name: string | null
          id: string | null
          profile_photo_url: string | null
          total_xp: number | null
        }
        Insert: {
          college_name?: string | null
          full_name?: string | null
          id?: string | null
          profile_photo_url?: string | null
          total_xp?: number | null
        }
        Update: {
          college_name?: string | null
          full_name?: string | null
          id?: string | null
          profile_photo_url?: string | null
          total_xp?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      approve_organizer: {
        Args: { admin_id: string; application_id: string }
        Returns: undefined
      }
      auto_expire_scholarships: { Args: never; Returns: undefined }
      award_xp: {
        Args: {
          _amount: number
          _content_id?: string
          _content_type?: string
          _reason: string
          _user_id: string
        }
        Returns: undefined
      }
      check_mobile_exists: {
        Args: { p_exclude_user_id?: string; p_mobile: string }
        Returns: boolean
      }
      cleanup_expired_otps: { Args: never; Returns: undefined }
      count_colleges: {
        Args: { p_district?: string; p_search?: string; p_state?: string }
        Returns: number
      }
      create_secure_ticket: {
        Args: {
          p_event_id: string
          p_registration_id: string
          p_user_id: string
        }
        Returns: string
      }
      find_user_by_email: {
        Args: { search_email: string }
        Returns: {
          user_email: string
          user_full_name: string
          user_id: string
        }[]
      }
      generate_book_slug: {
        Args: { book_id: string; book_title: string }
        Returns: string
      }
      generate_event_slug: {
        Args: { event_id: string; title: string }
        Returns: string
      }
      generate_organizer_slug: {
        Args: { organizer_id: string; organizer_name: string }
        Returns: string
      }
      generate_secure_ticket_token: { Args: never; Returns: string }
      generate_ticket_qr: { Args: never; Returns: string }
      get_book_by_id_safe: {
        Args: { p_book_id: string }
        Returns: {
          author: string
          category: string
          condition: string
          created_at: string
          created_by: string
          description: string
          id: string
          image_urls: string[]
          is_sold: boolean
          price: number
          seller_address: string
          seller_email: string
          seller_mobile: string
          status: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at: string
          views_count: number
        }[]
      }
      get_book_recommendations: {
        Args: { p_book_id: string; p_limit?: number }
        Returns: {
          author: string | null
          book_status: Database["public"]["Enums"]["book_status"]
          category: string | null
          condition: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          image_urls: string[] | null
          is_sold: boolean
          listing_type: string | null
          price: number | null
          seller_address: string
          seller_email: string
          seller_mobile: string
          slug: string | null
          status: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at: string
          views_count: number
        }[]
        SetofOptions: {
          from: "*"
          to: "books"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_books_safe: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_status?: Database["public"]["Enums"]["content_status"]
        }
        Returns: {
          author: string
          category: string
          condition: string
          created_at: string
          created_by: string
          description: string
          id: string
          image_urls: string[]
          is_sold: boolean
          price: number
          seller_address: string
          seller_email: string
          seller_mobile: string
          status: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at: string
          views_count: number
        }[]
      }
      get_college_districts: {
        Args: { p_state: string }
        Returns: {
          district: string
        }[]
      }
      get_college_states: {
        Args: never
        Returns: {
          state: string
        }[]
      }
      get_contributor_name: { Args: { user_id: string }; Returns: string }
      get_contributor_names: {
        Args: { user_ids: string[] }
        Returns: {
          full_name: string
          user_id: string
        }[]
      }
      get_event_by_id_or_slug: {
        Args: { p_identifier: string }
        Returns: {
          allow_audience_members: boolean
          artist_free_entry: boolean
          category: string
          city: string | null
          created_at: string
          custom_fields: Json | null
          description: string | null
          enable_quick_register: boolean
          end_date: string | null
          event_type: string
          flyer_url: string | null
          id: string
          is_location_decided: boolean
          is_paid: boolean
          maps_link: string | null
          max_capacity: number | null
          organizer_id: string
          poster_ratio: string | null
          price: number | null
          registration_end_date: string | null
          registrations_count: number
          slug: string | null
          start_date: string
          state: string | null
          status: Database["public"]["Enums"]["event_status"]
          terms_conditions: string | null
          title: string
          updated_at: string
          upi_qr_url: string | null
          upi_vpa: string | null
          venue_address: string | null
          venue_name: string | null
          views_count: number
        }[]
        SetofOptions: {
          from: "*"
          to: "events"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_event_checkout_analytics: {
        Args: { p_event_id: string }
        Returns: {
          anonymous_views: number
          checkout_leads: Json
          total_checkout_views: number
          unique_users: number
        }[]
      }
      get_event_registrations_with_profiles: {
        Args: { p_event_id: string }
        Returns: {
          college_name: string
          created_at: string
          custom_data: Json
          email: string
          full_name: string
          mobile_number: string
          payment_screenshot_url: string
          payment_status: string
          profile_photo_url: string
          registration_id: string
          reviewed_at: string
          user_id: string
        }[]
      }
      get_event_safe: {
        Args: { p_event_id: string }
        Returns: {
          category: string
          created_at: string
          custom_fields: Json
          description: string
          end_date: string
          event_type: string
          flyer_url: string
          id: string
          is_location_decided: boolean
          is_paid: boolean
          maps_link: string
          max_capacity: number
          organizer_id: string
          price: number
          registrations_count: number
          start_date: string
          status: string
          terms_conditions: string
          title: string
          updated_at: string
          upi_qr_url: string
          upi_vpa: string
          venue_address: string
          venue_name: string
          views_count: number
        }[]
      }
      get_homepage_stats: { Args: never; Returns: Json }
      get_public_leaderboard: {
        Args: { limit_count?: number }
        Returns: {
          full_name: string
          id: string
          profile_photo_url: string
          total_xp: number
        }[]
      }
      get_registered_users_count: { Args: never; Returns: number }
      get_seller_contact: {
        Args: { p_book_id: string }
        Returns: {
          address: string
          email: string
          mobile: string
        }[]
      }
      has_organizer_profile: { Args: { p_user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_book_views: { Args: { book_id: string }; Returns: undefined }
      increment_event_views: {
        Args: { p_event_id: string }
        Returns: undefined
      }
      increment_material_downloads: {
        Args: { material_id: string }
        Returns: undefined
      }
      increment_material_shares: {
        Args: { material_id: string }
        Returns: undefined
      }
      increment_material_views: {
        Args: { material_id: string }
        Returns: undefined
      }
      is_admin_or_assistant: { Args: { _user_id: string }; Returns: boolean }
      is_email_blocked: { Args: { p_email: string }; Returns: boolean }
      normalize_mobile_number: { Args: { mobile: string }; Returns: string }
      permanently_delete_event: { Args: { p_event_id: string }; Returns: Json }
      permanently_delete_user: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      permanently_delete_user_admin: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      record_checkout_visit: {
        Args: { p_event_id: string; p_session_id?: string }
        Returns: undefined
      }
      register_for_event_atomic: {
        Args: {
          p_custom_data?: Json
          p_event_id: string
          p_group_size?: number
          p_is_group_booking?: boolean
          p_payment_screenshot_url?: string
          p_user_id: string
        }
        Returns: Json
      }
      search_colleges: {
        Args: {
          p_district?: string
          p_limit?: number
          p_offset?: number
          p_search?: string
          p_state?: string
        }
        Returns: {
          college_name: string
          college_type: string
          district: string
          id: string
          is_popular: boolean
          state: string
          university: string
        }[]
      }
      secure_check_in: {
        Args: {
          p_device_fingerprint?: string
          p_event_id: string
          p_organizer_id: string
          p_qr_code: string
          p_verification_method?: string
        }
        Returns: Json
      }
      toggle_material_like: {
        Args: { p_material_id: string }
        Returns: boolean
      }
      toggle_organizer_follow: {
        Args: { p_organizer_id: string }
        Returns: boolean
      }
      user_has_liked_material: {
        Args: { p_material_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "student" | "organizer" | "admin_assistant"
      book_status: "available" | "sold" | "rented"
      content_status: "pending" | "approved" | "rejected"
      event_frequency_type:
        | "one_time"
        | "daily"
        | "weekly"
        | "monthly"
        | "seasonal"
        | "annual"
      event_size_type: "1-50" | "51-100" | "101-500" | "501-1000" | "1000+"
      event_status: "draft" | "published" | "cancelled" | "completed"
      form_field_type:
        | "text"
        | "textarea"
        | "email"
        | "phone"
        | "number"
        | "date"
        | "time"
        | "datetime"
        | "select"
        | "radio"
        | "checkbox"
        | "file"
      organizer_application_status: "pending" | "approved" | "rejected"
      organizer_identity_type:
        | "individual"
        | "brand"
        | "community"
        | "company"
        | "nonprofit"
        | "school"
        | "university"
        | "event_company"
        | "agency"
        | "others"
      ticket_status: "pending" | "approved" | "rejected" | "used"
      volunteer_invite_role: "entry" | "qr_checkin" | "help_desk" | "all"
      volunteer_invite_status: "pending" | "accepted" | "rejected"
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
      app_role: ["admin", "student", "organizer", "admin_assistant"],
      book_status: ["available", "sold", "rented"],
      content_status: ["pending", "approved", "rejected"],
      event_frequency_type: [
        "one_time",
        "daily",
        "weekly",
        "monthly",
        "seasonal",
        "annual",
      ],
      event_size_type: ["1-50", "51-100", "101-500", "501-1000", "1000+"],
      event_status: ["draft", "published", "cancelled", "completed"],
      form_field_type: [
        "text",
        "textarea",
        "email",
        "phone",
        "number",
        "date",
        "time",
        "datetime",
        "select",
        "radio",
        "checkbox",
        "file",
      ],
      organizer_application_status: ["pending", "approved", "rejected"],
      organizer_identity_type: [
        "individual",
        "brand",
        "community",
        "company",
        "nonprofit",
        "school",
        "university",
        "event_company",
        "agency",
        "others",
      ],
      ticket_status: ["pending", "approved", "rejected", "used"],
      volunteer_invite_role: ["entry", "qr_checkin", "help_desk", "all"],
      volunteer_invite_status: ["pending", "accepted", "rejected"],
    },
  },
} as const
