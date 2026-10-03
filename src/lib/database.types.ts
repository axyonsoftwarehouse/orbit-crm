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
            foreignKeyName: "document_items_tenant_id_fkey"
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
            foreignKeyName: "invoices_tenant_id_fkey"
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
          tenant_id: string
        }
        Insert: {
          author_id?: string | null
          created_at?: string
          description: string
          id?: string
          lead_id: string
          tenant_id: string
        }
        Update: {
          author_id?: string | null
          created_at?: string
          description?: string
          id?: string
          lead_id?: string
          tenant_id?: string
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
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          is_super_admin: boolean
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          is_super_admin?: boolean
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_super_admin?: boolean
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
        }
        Insert: {
          created_at?: string
          currency?: string
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
        }
        Update: {
          created_at?: string
          currency?: string
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
        }
        Relationships: [
          {
            foreignKeyName: "tenants_plan_fk"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
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
      entity_belongs_to_tenant: {
        Args: { p_entity_id: string; p_entity_type: string; p_tenant: string }
        Returns: boolean
      }
      has_tenant_role: {
        Args: { p_roles: string[]; p_tenant: string }
        Returns: boolean
      }
      is_client_of_company: { Args: { p_company: string }; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      is_tenant_member: { Args: { p_tenant: string }; Returns: boolean }
      next_document_number: {
        Args: { p_kind: string; p_tenant: string }
        Returns: number
      }
      shares_tenant: { Args: { target: string }; Returns: boolean }
      storage_path_tenant: { Args: { p_name: string }; Returns: string }
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
