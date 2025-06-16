import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// Database types for TypeScript
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: number
          username: string
          email: string | null
          password_hash: string | null
          role: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          username: string
          email?: string | null
          password_hash?: string | null
          role?: string | null
        }
        Update: {
          username?: string
          email?: string | null
          password_hash?: string | null
          role?: string | null
          updated_at?: string
        }
      }
      quizzes: {
        Row: {
          id: string
          user_id: number
          title: string
          subject: string
          grade_level: string
          difficulty: string
          questions: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          user_id: number
          title: string
          subject: string
          grade_level: string
          difficulty: string
          questions: any
        }
        Update: {
          title?: string
          subject?: string
          grade_level?: string
          difficulty?: string
          questions?: any
          updated_at?: string
        }
      }
      quiz_submissions: {
        Row: {
          id: string
          quiz_id: string
          user_id: number
          answers: any
          score: number
          total_questions: number
          feedback: any
          completed_at: string
        }
        Insert: {
          id: string
          quiz_id: string
          user_id: number
          answers: any
          score: number
          total_questions: number
          feedback: any
        }
        Update: {
          answers?: any
          score?: number
          total_questions?: number
          feedback?: any
        }
      }
      quiz_hints: {
        Row: {
          id: number
          quiz_id: string
          question_id: string
          user_id: number
          hint_text: string
          requested_at: string
        }
        Insert: {
          quiz_id: string
          question_id: string
          user_id: number
          hint_text: string
        }
        Update: {
          hint_text?: string
        }
      }
    }
  }
}
