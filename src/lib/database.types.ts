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
    PostgrestVersion: "14.17"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          tenant_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          tenant_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      attachments: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          file_name: string
          id: string
          mime_type: string | null
          size_bytes: number | null
          storage_path: string
          tenant_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          file_name: string
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          storage_path: string
          tenant_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          file_name?: string
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          storage_path?: string
          tenant_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attachments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          company_id: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          end_at: string | null
          id: string
          project_id: string | null
          start_at: string
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          end_at?: string | null
          id?: string
          project_id?: string | null
          start_at: string
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          end_at?: string | null
          id?: string
          project_id?: string | null
          start_at?: string
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_company_fk"
            columns: ["company_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "calendar_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_project_fk"
            columns: ["project_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "calendar_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author_id: string | null
          content: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          tenant_id: string
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          tenant_id: string
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          state: string | null
          tenant_id: string
          updated_at: string
          vat: string | null
          website: string | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          tenant_id: string
          updated_at?: string
          vat?: string | null
          website?: string | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          tenant_id?: string
          updated_at?: string
          vat?: string | null
          website?: string | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "companies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          email: string | null
          first_name: string
          id: string
          is_primary: boolean
          last_name: string | null
          phone: string | null
          tenant_id: string
          title: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          email?: string | null
          first_name: string
          id?: string
          is_primary?: boolean
          last_name?: string | null
          phone?: string | null
          tenant_id: string
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          email?: string | null
          first_name?: string
          id?: string
          is_primary?: boolean
          last_name?: string | null
          phone?: string | null
          tenant_id?: string
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_company_fk"
            columns: ["company_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "contacts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_events: {
        Row: {
          actor_id: string | null
          actor_kind: string
          contract_id: string
          created_at: string
          id: string
          ip: string | null
          kind: string
          metadata: Json | null
          tenant_id: string
          user_agent: string | null
        }
        Insert: {
          actor_id?: string | null
          actor_kind: string
          contract_id: string
          created_at?: string
          id?: string
          ip?: string | null
          kind: string
          metadata?: Json | null
          tenant_id: string
          user_agent?: string | null
        }
        Update: {
          actor_id?: string | null
          actor_kind?: string
          contract_id?: string
          created_at?: string
          id?: string
          ip?: string | null
          kind?: string
          metadata?: Json | null
          tenant_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_events_contract_fk"
            columns: ["contract_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "contract_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_signers: {
        Row: {
          contract_id: string
          created_at: string
          email: string | null
          id: string
          ip: string | null
          name: string | null
          role: string
          signature_path: string | null
          signed_at: string | null
          tenant_id: string
          user_agent: string | null
        }
        Insert: {
          contract_id: string
          created_at?: string
          email?: string | null
          id?: string
          ip?: string | null
          name?: string | null
          role?: string
          signature_path?: string | null
          signed_at?: string | null
          tenant_id: string
          user_agent?: string | null
        }
        Update: {
          contract_id?: string
          created_at?: string
          email?: string | null
          id?: string
          ip?: string | null
          name?: string | null
          role?: string
          signature_path?: string | null
          signed_at?: string | null
          tenant_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_signers_contract_fk"
            columns: ["contract_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "contract_signers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          acceptance_email: string | null
          acceptance_firstname: string | null
          acceptance_ip: string | null
          acceptance_lastname: string | null
          acceptance_user_agent: string | null
          company_id: string | null
          content: string | null
          content_hash: string | null
          content_rendered: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          end_date: string | null
          id: string
          last_sent_at: string | null
          last_sign_reminder_at: string | null
          marked_as_signed_at: string | null
          marked_as_signed_by: string | null
          note: string | null
          require_login: boolean
          signature_path: string | null
          signed_at: string | null
          start_date: string | null
          status: number
          tenant_id: string
          title: string
          updated_at: string
          value: number | null
        }
        Insert: {
          acceptance_email?: string | null
          acceptance_firstname?: string | null
          acceptance_ip?: string | null
          acceptance_lastname?: string | null
          acceptance_user_agent?: string | null
          company_id?: string | null
          content?: string | null
          content_hash?: string | null
          content_rendered?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          last_sent_at?: string | null
          last_sign_reminder_at?: string | null
          marked_as_signed_at?: string | null
          marked_as_signed_by?: string | null
          note?: string | null
          require_login?: boolean
          signature_path?: string | null
          signed_at?: string | null
          start_date?: string | null
          status?: number
          tenant_id: string
          title: string
          updated_at?: string
          value?: number | null
        }
        Update: {
          acceptance_email?: string | null
          acceptance_firstname?: string | null
          acceptance_ip?: string | null
          acceptance_lastname?: string | null
          acceptance_user_agent?: string | null
          company_id?: string | null
          content?: string | null
          content_hash?: string | null
          content_rendered?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          last_sent_at?: string | null
          last_sign_reminder_at?: string | null
          marked_as_signed_at?: string | null
          marked_as_signed_by?: string | null
          note?: string | null
          require_login?: boolean
          signature_path?: string | null
          signed_at?: string | null
          start_date?: string | null
          status?: number
          tenant_id?: string
          title?: string
          updated_at?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_company_fk"
            columns: ["company_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "contracts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_marked_as_signed_by_fkey"
            columns: ["marked_as_signed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_field_definitions: {
        Row: {
          created_at: string
          entity_type: string
          field_type: string
          id: string
          is_active: boolean
          key: string
          label: string
          options: Json
          position: number
          required: boolean
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          entity_type: string
          field_type: string
          id?: string
          is_active?: boolean
          key: string
          label: string
          options?: Json
          position?: number
          required?: boolean
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          entity_type?: string
          field_type?: string
          id?: string
          is_active?: boolean
          key?: string
          label?: string
          options?: Json
          position?: number
          required?: boolean
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_field_definitions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_field_values: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          field_id: string
          id: string
          tenant_id: string
          updated_at: string
          value: string | null
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          field_id: string
          id?: string
          tenant_id: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          field_id?: string
          id?: string
          tenant_id?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_field_values_field_fk"
            columns: ["field_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "custom_field_definitions"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "custom_field_values_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          created_at: string
          id: string
          name: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      document_items: {
        Row: {
          created_at: string
          description: string
          id: string
          item_id: string | null
          position: number
          qty: number
          rate: number
          rel_id: string
          rel_type: string
          tax_name: string | null
          tax_rate: number | null
          tenant_id: string
          unit: string | null
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          item_id?: string | null
          position?: number
          qty?: number
          rate?: number
          rel_id: string
          rel_type: string
          tax_name?: string | null
          tax_rate?: number | null
          tenant_id: string
          unit?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          item_id?: string | null
          position?: number
          qty?: number
          rate?: number
          rel_id?: string
          rel_type?: string
          tax_name?: string | null
          tax_rate?: number | null
          tenant_id?: string
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      document_links: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string
          id: string
          last_viewed_at: string | null
          rel_id: string
          rel_type: string
          responded_at: string | null
          revoked_at: string | null
          tenant_id: string
          token_hash: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at: string
          id?: string
          last_viewed_at?: string | null
          rel_id: string
          rel_type: string
          responded_at?: string | null
          revoked_at?: string | null
          tenant_id: string
          token_hash: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          last_viewed_at?: string | null
          rel_id?: string
          rel_type?: string
          responded_at?: string | null
          revoked_at?: string | null
          tenant_id?: string
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_links_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_links_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      email_log: {
        Row: {
          created_at: string
          error: string | null
          id: string
          status: string
          subject: string
          template_key: string | null
          tenant_id: string
          to_email: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          status?: string
          subject: string
          template_key?: string | null
          tenant_id: string
          to_email: string
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          status?: string
          subject?: string
          template_key?: string | null
          tenant_id?: string
          to_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          body: string
          created_at: string
          id: string
          key: string
          subject: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          key: string
          subject: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          key?: string
          subject?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      estimates: {
        Row: {
          adjustment: number
          client_note: string | null
          company_id: string | null
          created_at: string
          created_by: string | null
          currency: string
          date: string
          deleted_at: string | null
          discount_percent: number | null
          discount_total: number
          discount_type: string
          expiry_date: string | null
          formatted_number: string
          id: string
          invoice_id: string | null
          number: number
          prefix: string
          project_id: string | null
          reference_no: string | null
          status: number
          subtotal: number
          tenant_id: string
          terms: string | null
          total: number
          total_tax: number
          updated_at: string
        }
        Insert: {
          adjustment?: number
          client_note?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          date?: string
          deleted_at?: string | null
          discount_percent?: number | null
          discount_total?: number
          discount_type?: string
          expiry_date?: string | null
          formatted_number: string
          id?: string
          invoice_id?: string | null
          number: number
          prefix: string
          project_id?: string | null
          reference_no?: string | null
          status?: number
          subtotal?: number
          tenant_id: string
          terms?: string | null
          total?: number
          total_tax?: number
          updated_at?: string
        }
        Update: {
          adjustment?: number
          client_note?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          date?: string
          deleted_at?: string | null
          discount_percent?: number | null
          discount_total?: number
          discount_type?: string
          expiry_date?: string | null
          formatted_number?: string
          id?: string
          invoice_id?: string | null
          number?: number
          prefix?: string
          project_id?: string | null
          reference_no?: string | null
          status?: number
          subtotal?: number
          tenant_id?: string
          terms?: string | null
          total?: number
          total_tax?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "estimates_company_fk"
            columns: ["company_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "estimates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimates_invoice_fk"
            columns: ["invoice_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "estimates_project_fk"
            columns: ["project_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "estimates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          billable: boolean
          category: string | null
          company_id: string | null
          created_at: string
          created_by: string | null
          date: string
          deleted_at: string | null
          id: string
          note: string | null
          project_id: string | null
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          amount?: number
          billable?: boolean
          category?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          date?: string
          deleted_at?: string | null
          id?: string
          note?: string | null
          project_id?: string | null
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          amount?: number
          billable?: boolean
          category?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          date?: string
          deleted_at?: string | null
          id?: string
          note?: string | null
          project_id?: string | null
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_company_fk"
            columns: ["company_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "expenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_project_fk"
            columns: ["project_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "expenses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      faqs: {
        Row: {
          answer: string | null
          created_at: string
          id: string
          is_published: boolean
          position: number
          question: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          answer?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          position?: number
          question: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          answer?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          position?: number
          question?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "faqs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          metric: string
          period_end: string
          period_start: string
          target: number
          tenant_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          metric?: string
          period_end: string
          period_start: string
          target?: number
          tenant_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          metric?: string
          period_end?: string
          period_start?: string
          target?: number
          tenant_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          role: string
          tenant_id: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: string
          tenant_id: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: string
          tenant_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          adjustment: number
          client_note: string | null
          company_id: string | null
          created_at: string
          created_by: string | null
          currency: string
          date: string
          deleted_at: string | null
          discount_percent: number | null
          discount_total: number
          discount_type: string
          due_date: string | null
          formatted_number: string
          id: string
          number: number
          prefix: string
          project_id: string | null
          recurrence_auto_send: boolean
          recurrence_end_date: string | null
          recurrence_interval_months: number | null
          recurrence_parent_id: string | null
          recurrence_sequence: number | null
          reference_no: string | null
          status: number
          subtotal: number
          tenant_id: string
          terms: string | null
          total: number
          total_tax: number
          updated_at: string
        }
        Insert: {
          adjustment?: number
          client_note?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          date?: string
          deleted_at?: string | null
          discount_percent?: number | null
          discount_total?: number
          discount_type?: string
          due_date?: string | null
          formatted_number: string
          id?: string
          number: number
          prefix: string
          project_id?: string | null
          recurrence_auto_send?: boolean
          recurrence_end_date?: string | null
          recurrence_interval_months?: number | null
          recurrence_parent_id?: string | null
          recurrence_sequence?: number | null
          reference_no?: string | null
          status?: number
          subtotal?: number
          tenant_id: string
          terms?: string | null
          total?: number
          total_tax?: number
          updated_at?: string
        }
        Update: {
          adjustment?: number
          client_note?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          date?: string
          deleted_at?: string | null
          discount_percent?: number | null
          discount_total?: number
          discount_type?: string
          due_date?: string | null
          formatted_number?: string
          id?: string
          number?: number
          prefix?: string
          project_id?: string | null
          recurrence_auto_send?: boolean
          recurrence_end_date?: string | null
          recurrence_interval_months?: number | null
          recurrence_parent_id?: string | null
          recurrence_sequence?: number | null
          reference_no?: string | null
          status?: number
          subtotal?: number
          tenant_id?: string
          terms?: string | null
          total?: number
          total_tax?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_company_fk"
            columns: ["company_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "invoices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_project_fk"
            columns: ["project_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "invoices_recurrence_parent_fk"
            columns: ["recurrence_parent_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "invoices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      item_groups: {
        Row: {
          created_at: string
          id: string
          name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_groups_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string
          group_id: string | null
          id: string
          long_description: string | null
          purchase_price: number | null
          rate: number
          tax_name: string | null
          tax_rate: number | null
          tenant_id: string
          unit: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description: string
          group_id?: string | null
          id?: string
          long_description?: string | null
          purchase_price?: number | null
          rate?: number
          tax_name?: string | null
          tax_rate?: number | null
          tenant_id: string
          unit?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string
          group_id?: string | null
          id?: string
          long_description?: string | null
          purchase_price?: number | null
          rate?: number
          tax_name?: string | null
          tax_rate?: number | null
          tenant_id?: string
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_group_id_tenant_id_fkey"
            columns: ["group_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "item_groups"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_articles: {
        Row: {
          author_id: string | null
          category_id: string | null
          content: string | null
          created_at: string
          deleted_at: string | null
          excerpt: string | null
          id: string
          is_published: boolean
          slug: string
          tenant_id: string
          title: string
          updated_at: string
          views: number
        }
        Insert: {
          author_id?: string | null
          category_id?: string | null
          content?: string | null
          created_at?: string
          deleted_at?: string | null
          excerpt?: string | null
          id?: string
          is_published?: boolean
          slug: string
          tenant_id: string
          title: string
          updated_at?: string
          views?: number
        }
        Update: {
          author_id?: string | null
          category_id?: string | null
          content?: string | null
          created_at?: string
          deleted_at?: string | null
          excerpt?: string | null
          id?: string
          is_published?: boolean
          slug?: string
          tenant_id?: string
          title?: string
          updated_at?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "kb_articles_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kb_articles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "kb_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kb_articles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          position: number
          tenant_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          position?: number
          tenant_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          position?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kb_categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_activities: {
        Row: {
          author_id: string | null
          created_at: string
          description: string
          id: string
          lead_id: string
          next_step_at: string | null
          next_step_done_at: string | null
          next_step_note: string | null
          next_step_reminded_at: string | null
          tenant_id: string
          type: string
        }
        Insert: {
          author_id?: string | null
          created_at?: string
          description: string
          id?: string
          lead_id: string
          next_step_at?: string | null
          next_step_done_at?: string | null
          next_step_note?: string | null
          next_step_reminded_at?: string | null
          tenant_id: string
          type?: string
        }
        Update: {
          author_id?: string | null
          created_at?: string
          description?: string
          id?: string
          lead_id?: string
          next_step_at?: string | null
          next_step_done_at?: string | null
          next_step_note?: string | null
          next_step_reminded_at?: string | null
          tenant_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_activities_lead_fk"
            columns: ["lead_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "lead_activities_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_sources: {
        Row: {
          created_at: string
          id: string
          name: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_sources_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_statuses: {
        Row: {
          color: string
          created_at: string
          id: string
          is_default: boolean
          is_lost: boolean
          is_won: boolean
          name: string
          position: number
          tenant_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          is_default?: boolean
          is_lost?: boolean
          is_won?: boolean
          name: string
          position?: number
          tenant_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          is_default?: boolean
          is_lost?: boolean
          is_won?: boolean
          name?: string
          position?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_statuses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assignee_id: string | null
          city: string | null
          company: string | null
          converted_at: string | null
          converted_company_id: string | null
          country: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          email: string | null
          id: string
          lost: boolean
          name: string
          phone: string | null
          source_id: string | null
          state: string | null
          status_id: string | null
          tenant_id: string
          title: string | null
          updated_at: string
          value: number | null
          website: string | null
        }
        Insert: {
          assignee_id?: string | null
          city?: string | null
          company?: string | null
          converted_at?: string | null
          converted_company_id?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          lost?: boolean
          name: string
          phone?: string | null
          source_id?: string | null
          state?: string | null
          status_id?: string | null
          tenant_id: string
          title?: string | null
          updated_at?: string
          value?: number | null
          website?: string | null
        }
        Update: {
          assignee_id?: string | null
          city?: string | null
          company?: string | null
          converted_at?: string | null
          converted_company_id?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          lost?: boolean
          name?: string
          phone?: string | null
          source_id?: string | null
          state?: string | null
          status_id?: string | null
          tenant_id?: string
          title?: string | null
          updated_at?: string
          value?: number | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "lead_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "lead_statuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string
          id: string
          role: string
          status: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          status?: string
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          status?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      milestones: {
        Row: {
          color: string
          created_at: string
          created_by: string | null
          date_finished: string | null
          deleted_at: string | null
          description: string | null
          due_date: string | null
          id: string
          name: string
          position: number
          project_id: string
          start_date: string | null
          status: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          created_by?: string | null
          date_finished?: string | null
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          name: string
          position?: number
          project_id: string
          start_date?: string | null
          status?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          created_by?: string | null
          date_finished?: string | null
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          name?: string
          position?: number
          project_id?: string
          start_date?: string | null
          status?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestones_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestones_project_fk"
            columns: ["project_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "milestones_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          read_at: string | null
          tenant_id: string
          title: string
          type: string
          url: string | null
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          read_at?: string | null
          tenant_id: string
          title: string
          type?: string
          url?: string | null
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          read_at?: string | null
          tenant_id?: string
          title?: string
          type?: string
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          id: string
          invoice_id: string
          note: string | null
          payment_date: string
          payment_mode: string | null
          tenant_id: string
          transaction_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_id: string
          note?: string | null
          payment_date?: string
          payment_mode?: string | null
          tenant_id: string
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_id?: string
          note?: string | null
          payment_date?: string
          payment_mode?: string | null
          tenant_id?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_fk"
            columns: ["invoice_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string
          description: string | null
          id: string
          interval: string
          is_active: boolean
          limits: Json
          most_popular: boolean
          name: string
          price: number
          trial_days: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          interval?: string
          is_active?: boolean
          limits?: Json
          most_popular?: boolean
          name: string
          price?: number
          trial_days?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          interval?: string
          is_active?: boolean
          limits?: Json
          most_popular?: boolean
          name?: string
          price?: number
          trial_days?: number
          updated_at?: string
        }
        Relationships: []
      }
      portal_invitations: {
        Row: {
          accepted_at: string | null
          contact_id: string
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          tenant_id: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          contact_id: string
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          tenant_id: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          contact_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          tenant_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "portal_invitations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_invitations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_super_admin: boolean
          notify_email: boolean
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          is_super_admin?: boolean
          notify_email?: boolean
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_super_admin?: boolean
          notify_email?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      project_members: {
        Row: {
          created_at: string
          id: string
          project_id: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_fk"
            columns: ["project_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "project_members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          billing_type: number
          company_id: string | null
          created_at: string
          created_by: string | null
          date_finished: string | null
          deadline: string | null
          deleted_at: string | null
          description: string | null
          estimated_hours: number | null
          id: string
          name: string
          progress: number
          progress_from_tasks: boolean
          project_cost: number | null
          rate_per_hour: number | null
          start_date: string | null
          status: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          billing_type?: number
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          date_finished?: string | null
          deadline?: string | null
          deleted_at?: string | null
          description?: string | null
          estimated_hours?: number | null
          id?: string
          name: string
          progress?: number
          progress_from_tasks?: boolean
          project_cost?: number | null
          rate_per_hour?: number | null
          start_date?: string | null
          status?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          billing_type?: number
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          date_finished?: string | null
          deadline?: string | null
          deleted_at?: string | null
          description?: string | null
          estimated_hours?: number | null
          id?: string
          name?: string
          progress?: number
          progress_from_tasks?: boolean
          project_cost?: number | null
          rate_per_hour?: number | null
          start_date?: string | null
          status?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_company_fk"
            columns: ["company_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_hits: {
        Row: {
          bucket: string
          created_at: string
          id: number
        }
        Insert: {
          bucket: string
          created_at?: string
          id?: never
        }
        Update: {
          bucket?: string
          created_at?: string
          id?: never
        }
        Relationships: []
      }
      roadmap_items: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          module: string | null
          origin: string | null
          priority: number
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          module?: string | null
          origin?: string | null
          priority?: number
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          module?: string | null
          origin?: string | null
          priority?: number
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      seo_audits: {
        Row: {
          ai_summary: string | null
          checks_total: number
          created_at: string
          created_by: string | null
          error: string | null
          finished_at: string | null
          id: string
          issues_total: number
          major_issues: number
          minor_issues: number
          moderate_issues: number
          result: Json | null
          score: number | null
          site_id: string
          status: number
          tenant_id: string
          url: string
        }
        Insert: {
          ai_summary?: string | null
          checks_total?: number
          created_at?: string
          created_by?: string | null
          error?: string | null
          finished_at?: string | null
          id?: string
          issues_total?: number
          major_issues?: number
          minor_issues?: number
          moderate_issues?: number
          result?: Json | null
          score?: number | null
          site_id: string
          status?: number
          tenant_id: string
          url: string
        }
        Update: {
          ai_summary?: string | null
          checks_total?: number
          created_at?: string
          created_by?: string | null
          error?: string | null
          finished_at?: string | null
          id?: string
          issues_total?: number
          major_issues?: number
          minor_issues?: number
          moderate_issues?: number
          result?: Json | null
          score?: number | null
          site_id?: string
          status?: number
          tenant_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "seo_audits_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_audits_site_fk"
            columns: ["site_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "seo_sites"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "seo_audits_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_sites: {
        Row: {
          check_interval_days: number
          company_id: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          label: string
          next_audit_at: string | null
          tenant_id: string
          updated_at: string
          url: string
        }
        Insert: {
          check_interval_days?: number
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          label: string
          next_audit_at?: string | null
          tenant_id: string
          updated_at?: string
          url: string
        }
        Update: {
          check_interval_days?: number
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          label?: string
          next_audit_at?: string | null
          tenant_id?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "seo_sites_company_fk"
            columns: ["company_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "seo_sites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_sites_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      social_accounts: {
        Row: {
          access_token_id: string | null
          account_type: string
          avatar_url: string | null
          company_id: string | null
          connected_by: string | null
          created_at: string
          deleted_at: string | null
          display_name: string
          id: string
          last_synced_at: string | null
          metadata: Json
          provider: string
          provider_account_id: string
          refresh_token_id: string | null
          scopes: string[]
          status: number
          tenant_id: string
          token_expires_at: string | null
          updated_at: string
        }
        Insert: {
          access_token_id?: string | null
          account_type?: string
          avatar_url?: string | null
          company_id?: string | null
          connected_by?: string | null
          created_at?: string
          deleted_at?: string | null
          display_name: string
          id?: string
          last_synced_at?: string | null
          metadata?: Json
          provider: string
          provider_account_id: string
          refresh_token_id?: string | null
          scopes?: string[]
          status?: number
          tenant_id: string
          token_expires_at?: string | null
          updated_at?: string
        }
        Update: {
          access_token_id?: string | null
          account_type?: string
          avatar_url?: string | null
          company_id?: string | null
          connected_by?: string | null
          created_at?: string
          deleted_at?: string | null
          display_name?: string
          id?: string
          last_synced_at?: string | null
          metadata?: Json
          provider?: string
          provider_account_id?: string
          refresh_token_id?: string | null
          scopes?: string[]
          status?: number
          tenant_id?: string
          token_expires_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_accounts_company_fk"
            columns: ["company_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "social_accounts_connected_by_fkey"
            columns: ["connected_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_accounts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      social_media: {
        Row: {
          alt_text: string | null
          created_at: string
          created_by: string | null
          file_name: string
          id: string
          mime_type: string | null
          post_id: string
          size_bytes: number | null
          storage_path: string
          tenant_id: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          created_by?: string | null
          file_name: string
          id?: string
          mime_type?: string | null
          post_id: string
          size_bytes?: number | null
          storage_path: string
          tenant_id: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          created_by?: string | null
          file_name?: string
          id?: string
          mime_type?: string | null
          post_id?: string
          size_bytes?: number | null
          storage_path?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_media_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_media_post_fk"
            columns: ["post_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "social_media_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      social_post_events: {
        Row: {
          actor_id: string | null
          created_at: string
          event: string
          id: string
          metadata: Json
          post_id: string
          tenant_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          event: string
          id?: string
          metadata?: Json
          post_id: string
          tenant_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          event?: string
          id?: string
          metadata?: Json
          post_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_post_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_post_events_post_fk"
            columns: ["post_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "social_post_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      social_post_targets: {
        Row: {
          account_id: string
          attempts: number
          created_at: string
          error: string | null
          external_post_id: string | null
          id: string
          locked_at: string | null
          metadata: Json
          next_attempt_at: string | null
          post_id: string
          published_at: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          account_id: string
          attempts?: number
          created_at?: string
          error?: string | null
          external_post_id?: string | null
          id?: string
          locked_at?: string | null
          metadata?: Json
          next_attempt_at?: string | null
          post_id: string
          published_at?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          attempts?: number
          created_at?: string
          error?: string | null
          external_post_id?: string | null
          id?: string
          locked_at?: string | null
          metadata?: Json
          next_attempt_at?: string | null
          post_id?: string
          published_at?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_post_targets_account_fk"
            columns: ["account_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "social_accounts"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "social_post_targets_post_fk"
            columns: ["post_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "social_post_targets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      social_posts: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          company_id: string | null
          content: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          failure_reason: string | null
          id: string
          manual_reminder_sent_at: string | null
          published_at: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_note: string | null
          requires_approval: boolean
          scheduled_at: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string | null
          content: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          failure_reason?: string | null
          id?: string
          manual_reminder_sent_at?: string | null
          published_at?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_note?: string | null
          requires_approval?: boolean
          scheduled_at?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          failure_reason?: string | null
          id?: string
          manual_reminder_sent_at?: string | null
          published_at?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_note?: string | null
          requires_approval?: boolean
          scheduled_at?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_posts_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_posts_company_fk"
            columns: ["company_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "social_posts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_posts_rejected_by_fkey"
            columns: ["rejected_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_posts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      social_settings: {
        Row: {
          ai_enabled: boolean
          approval_required: boolean
          created_at: string
          default_timezone: string
          max_retries: number
          publish_mode: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          ai_enabled?: boolean
          approval_required?: boolean
          created_at?: string
          default_timezone?: string
          max_retries?: number
          publish_mode?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          ai_enabled?: boolean
          approval_required?: boolean
          created_at?: string
          default_timezone?: string
          max_retries?: number
          publish_mode?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      taggables: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          tag_id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          tag_id: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          tag_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "taggables_tag_fk"
            columns: ["tag_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "taggables_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          tenant_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          tenant_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      task_checklist_items: {
        Row: {
          created_at: string
          id: string
          is_done: boolean
          position: number
          task_id: string
          tenant_id: string
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_done?: boolean
          position?: number
          task_id: string
          tenant_id: string
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          is_done?: boolean
          position?: number
          task_id?: string
          tenant_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_checklist_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_checklist_task_fk"
            columns: ["task_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id", "tenant_id"]
          },
        ]
      }
      task_dependencies: {
        Row: {
          created_at: string
          created_by: string | null
          depends_on_task_id: string
          id: string
          task_id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          depends_on_task_id: string
          id?: string
          task_id: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          depends_on_task_id?: string
          id?: string
          task_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_dependencies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_dependencies_dep_fk"
            columns: ["depends_on_task_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "task_dependencies_task_fk"
            columns: ["task_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "task_dependencies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee_id: string | null
          billable: boolean
          created_at: string
          created_by: string | null
          date_finished: string | null
          deleted_at: string | null
          description: string | null
          due_date: string | null
          hourly_rate: number | null
          id: string
          milestone_id: string | null
          name: string
          priority: number
          project_id: string
          start_date: string | null
          status: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          billable?: boolean
          created_at?: string
          created_by?: string | null
          date_finished?: string | null
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          hourly_rate?: number | null
          id?: string
          milestone_id?: string | null
          name: string
          priority?: number
          project_id: string
          start_date?: string | null
          status?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          billable?: boolean
          created_at?: string
          created_by?: string | null
          date_finished?: string | null
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          hourly_rate?: number | null
          id?: string
          milestone_id?: string | null
          name?: string
          priority?: number
          project_id?: string
          start_date?: string | null
          status?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_milestone_fk"
            columns: ["milestone_id", "project_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id", "project_id", "tenant_id"]
          },
          {
            foreignKeyName: "tasks_project_fk"
            columns: ["project_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "tasks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          currency: string
          e_sign_legal_text: string | null
          estimate_prefix: string
          id: string
          invoice_prefix: string
          logo_url: string | null
          name: string
          next_estimate_number: number
          next_invoice_number: number
          next_ticket_number: number
          plan: string
          plan_id: string | null
          plan_status: string
          primary_color: string | null
          slug: string
          status: string
          subscription_ends_at: string | null
          ticket_prefix: string
          trial_ends_at: string | null
          updated_at: string
          web_to_lead_enabled: boolean
          web_to_lead_source_id: string | null
        }
        Insert: {
          created_at?: string
          currency?: string
          e_sign_legal_text?: string | null
          estimate_prefix?: string
          id?: string
          invoice_prefix?: string
          logo_url?: string | null
          name: string
          next_estimate_number?: number
          next_invoice_number?: number
          next_ticket_number?: number
          plan?: string
          plan_id?: string | null
          plan_status?: string
          primary_color?: string | null
          slug: string
          status?: string
          subscription_ends_at?: string | null
          ticket_prefix?: string
          trial_ends_at?: string | null
          updated_at?: string
          web_to_lead_enabled?: boolean
          web_to_lead_source_id?: string | null
        }
        Update: {
          created_at?: string
          currency?: string
          e_sign_legal_text?: string | null
          estimate_prefix?: string
          id?: string
          invoice_prefix?: string
          logo_url?: string | null
          name?: string
          next_estimate_number?: number
          next_invoice_number?: number
          next_ticket_number?: number
          plan?: string
          plan_id?: string | null
          plan_status?: string
          primary_color?: string | null
          slug?: string
          status?: string
          subscription_ends_at?: string | null
          ticket_prefix?: string
          trial_ends_at?: string | null
          updated_at?: string
          web_to_lead_enabled?: boolean
          web_to_lead_source_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenants_plan_fk"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenants_web_to_lead_source_fk"
            columns: ["web_to_lead_source_id"]
            isOneToOne: false
            referencedRelation: "lead_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_replies: {
        Row: {
          author_id: string | null
          body: string
          contact_id: string | null
          created_at: string
          id: string
          is_internal: boolean
          tenant_id: string
          ticket_id: string
        }
        Insert: {
          author_id?: string | null
          body: string
          contact_id?: string | null
          created_at?: string
          id?: string
          is_internal?: boolean
          tenant_id: string
          ticket_id: string
        }
        Update: {
          author_id?: string | null
          body?: string
          contact_id?: string | null
          created_at?: string
          id?: string
          is_internal?: boolean
          tenant_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_replies_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_replies_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_replies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_replies_ticket_fk"
            columns: ["ticket_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id", "tenant_id"]
          },
        ]
      }
      tickets: {
        Row: {
          assignee_id: string | null
          closed_at: string | null
          company_id: string | null
          contact_id: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          department_id: string | null
          details: string | null
          formatted_number: string
          id: string
          number: number
          priority: number
          project_id: string | null
          source: string
          status: number
          subject: string
          tenant_id: string
          type: number
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          closed_at?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          department_id?: string | null
          details?: string | null
          formatted_number: string
          id?: string
          number: number
          priority?: number
          project_id?: string | null
          source?: string
          status?: number
          subject: string
          tenant_id: string
          type?: number
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          closed_at?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          department_id?: string | null
          details?: string | null
          formatted_number?: string
          id?: string
          number?: number
          priority?: number
          project_id?: string | null
          source?: string
          status?: number
          subject?: string
          tenant_id?: string
          type?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_company_fk"
            columns: ["company_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "tickets_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      time_entries: {
        Row: {
          billed: boolean
          created_at: string
          duration_seconds: number | null
          ended_at: string | null
          id: string
          is_billable: boolean
          note: string | null
          project_id: string
          rate: number | null
          started_at: string
          task_id: string | null
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          billed?: boolean
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          is_billable?: boolean
          note?: string | null
          project_id: string
          rate?: number | null
          started_at?: string
          task_id?: string | null
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          billed?: boolean
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          is_billable?: boolean
          note?: string | null
          project_id?: string
          rate?: number | null
          started_at?: string
          task_id?: string | null
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_project_fk"
            columns: ["project_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "time_entries_task_fk"
            columns: ["task_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "time_entries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_rate_limit: {
        Args: { p_bucket: string; p_limit: number; p_window_seconds: number }
        Returns: boolean
      }
      claim_social_publish_targets: {
        Args: { p_limit?: number }
        Returns: {
          account_id: string
          post_id: string
          target_id: string
          tenant_id: string
        }[]
      }
      client_can_view_attachment_path: {
        Args: { p_name: string }
        Returns: boolean
      }
      client_can_view_document: {
        Args: { p_rel_id: string; p_rel_type: string }
        Returns: boolean
      }
      client_can_view_entity: {
        Args: { p_entity_id: string; p_entity_type: string }
        Returns: boolean
      }
      client_can_view_project: { Args: { p_project: string }; Returns: boolean }
      client_can_view_ticket: { Args: { p_ticket: string }; Returns: boolean }
      client_respond_estimate: {
        Args: { p_accept: boolean; p_estimate: string }
        Returns: undefined
      }
      configure_social_publish_cron: {
        Args: { p_cron_secret: string; p_site_url: string }
        Returns: undefined
      }
      entity_belongs_to_tenant: {
        Args: { p_entity_id: string; p_entity_type: string; p_tenant: string }
        Returns: boolean
      }
      has_tenant_role: {
        Args: { p_roles: string[]; p_tenant: string }
        Returns: boolean
      }
      increment_kb_article_views: {
        Args: { p_article: string }
        Returns: undefined
      }
      is_authenticated_staff: { Args: never; Returns: boolean }
      is_client_of_company: { Args: { p_company: string }; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      is_tenant_member: { Args: { p_tenant: string }; Returns: boolean }
      next_document_number: {
        Args: { p_kind: string; p_tenant: string }
        Returns: number
      }
      portal_contact: {
        Args: never
        Returns: {
          company_id: string
          company_name: string
          email: string
          first_name: string
          id: string
          last_name: string
          tenant_id: string
          tenant_name: string
        }[]
      }
      portal_get_project: {
        Args: { p_company: string; p_id: string }
        Returns: {
          deadline: string
          description: string
          id: string
          name: string
          progress: number
          progress_from_tasks: boolean
          status: number
        }[]
      }
      portal_get_seo_audit: {
        Args: { p_company: string; p_site: string }
        Returns: {
          ai_summary: string
          checks_total: number
          created_at: string
          issues_total: number
          label: string
          major_issues: number
          minor_issues: number
          moderate_issues: number
          result: Json
          score: number
          site_id: string
          url: string
        }[]
      }
      portal_get_social_post: {
        Args: { p_company: string; p_post: string }
        Returns: {
          content: string
          created_at: string
          id: string
          published_at: string
          rejection_note: string
          requires_approval: boolean
          scheduled_at: string
          status: string
          targets: Json
        }[]
      }
      portal_list_contracts: {
        Args: { p_company: string }
        Returns: {
          description: string
          end_date: string
          id: string
          marked_as_signed_at: string
          signed_at: string
          start_date: string
          status: number
          title: string
          value: number
        }[]
      }
      portal_list_expenses: {
        Args: { p_company: string }
        Returns: {
          amount: number
          category: string
          date: string
          id: string
          project_id: string
          project_name: string
          title: string
        }[]
      }
      portal_list_milestones: {
        Args: { p_project: string }
        Returns: {
          color: string
          description: string
          done_count: number
          due_date: string
          id: string
          name: string
          position: number
          progress: number
          start_date: string
          status: number
          task_count: number
        }[]
      }
      portal_list_projects: {
        Args: { p_company: string }
        Returns: {
          deadline: string
          description: string
          id: string
          name: string
          progress: number
          progress_from_tasks: boolean
          status: number
        }[]
      }
      portal_list_seo_sites: {
        Args: { p_company: string }
        Returns: {
          checks_total: number
          id: string
          issues_total: number
          label: string
          last_audit_at: string
          score: number
          url: string
        }[]
      }
      portal_list_social_posts: {
        Args: { p_company: string }
        Returns: {
          content: string
          created_at: string
          id: string
          published_at: string
          rejection_note: string
          requires_approval: boolean
          scheduled_at: string
          status: string
          target_count: number
        }[]
      }
      portal_list_tasks: {
        Args: { p_project: string }
        Returns: {
          description: string
          due_date: string
          id: string
          milestone_id: string
          name: string
          priority: number
          start_date: string
          status: number
        }[]
      }
      portal_respond_social_post: {
        Args: {
          p_approve: boolean
          p_company: string
          p_note?: string
          p_post: string
        }
        Returns: boolean
      }
      reset_stale_social_targets: {
        Args: { p_minutes?: number }
        Returns: number
      }
      shares_tenant: { Args: { target: string }; Returns: boolean }
      social_clear_tokens: { Args: { p_account: string }; Returns: undefined }
      social_get_tokens: {
        Args: { p_account: string }
        Returns: {
          access_token: string
          expires_at: string
          refresh_token: string
        }[]
      }
      social_store_tokens: {
        Args: {
          p_access_token: string
          p_account: string
          p_expires_at: string
          p_refresh_token: string
        }
        Returns: undefined
      }
      storage_path_tenant: { Args: { p_name: string }; Returns: string }
      tenant_storage_bytes: { Args: { p_tenant: string }; Returns: number }
      time_entries_summary: {
        Args: { p_project?: string; p_task?: string; p_tenant: string }
        Returns: {
          billable_amount: number
          seconds: number
        }[]
      }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
