import { createClient } from '@supabase/supabase-js';

// Em desenvolvimento, permite fallback para valores padrão
// Em produção, exige variáveis de ambiente
const isDevelopment = import.meta.env.DEV;
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || (isDevelopment ? 'https://oqiwumslgcggrybdpqcr.supabase.co' : undefined);
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || (isDevelopment ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xaXd1bXNsZ2NnZ3J5YmRwcWNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxOTUzMDQsImV4cCI6MjA4MDc3MTMwNH0.3Jnb9I7h-DbfP8kR8_CvofPkzLGoJsvZ2WMQOmnUM1E' : undefined);

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Types para o banco de dados
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          avatar_url: string | null;
          role: 'admin' | 'instructor' | 'student';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      courses: {
        Row: {
          id: number;
          title: string;
          description: string | null;
          instructor_id: string;
          community_id: string | null;
          cover_image_url: string | null;
          image_text: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['courses']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['courses']['Insert']>;
      };
      modules: {
        Row: {
          id: number;
          course_id: number;
          title: string;
          order: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['modules']['Row'], 'id' | 'created_at'> & {
          id?: number;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['modules']['Insert']>;
      };
      lessons: {
        Row: {
          id: number;
          module_id: number;
          title: string;
          video_embed_url: string | null;
          description: string | null;
          duration: number | null;
          order: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['lessons']['Row'], 'id' | 'created_at'> & {
          id?: number;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['lessons']['Insert']>;
      };
      enrollments: {
        Row: {
          id: number;
          user_id: string;
          course_id: number;
          enrolled_at: string;
        };
        Insert: Omit<Database['public']['Tables']['enrollments']['Row'], 'id' | 'enrolled_at'> & {
          id?: number;
          enrolled_at?: string;
        };
        Update: Partial<Database['public']['Tables']['enrollments']['Insert']>;
      };
      lesson_progress: {
        Row: {
          id: number;
          user_id: string;
          lesson_id: number;
          completed_at: string;
        };
        Insert: Omit<Database['public']['Tables']['lesson_progress']['Row'], 'id' | 'completed_at'> & {
          id?: number;
          completed_at?: string;
        };
        Update: Partial<Database['public']['Tables']['lesson_progress']['Insert']>;
      };
      posts: {
        Row: {
          id: number;
          course_id: number;
          user_id: string;
          title: string;
          content: string;
          pinned: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['posts']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['posts']['Insert']>;
      };
      comments: {
        Row: {
          id: number;
          post_id: number;
          user_id: string;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['comments']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['comments']['Insert']>;
      };
      announcements: {
        Row: {
          id: number;
          title: string;
          content: string;
          image_url: string | null;
          created_by: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['announcements']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['announcements']['Insert']>;
      };
    };
  };
};

