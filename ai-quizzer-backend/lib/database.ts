import { supabase } from "./supabase"
import type { Database } from "./supabase"

// Type aliases for easier use
type Quiz = Database["public"]["Tables"]["quizzes"]["Row"]
type QuizInsert = Database["public"]["Tables"]["quizzes"]["Insert"]
type Submission = Database["public"]["Tables"]["quiz_submissions"]["Row"]
type SubmissionInsert = Database["public"]["Tables"]["quiz_submissions"]["Insert"]

// 🔄 SUPABASE INTEGRATION: Save Quiz
export async function saveQuiz(quiz: any): Promise<Quiz> {
  try {
    const { data, error } = await supabase
      .from("quizzes")
      .insert({
        id: quiz.id,
        user_id: quiz.userId,
        title: quiz.title,
        subject: quiz.subject,
        grade_level: quiz.gradeLevel,
        difficulty: quiz.difficulty,
        questions: quiz.questions,
      })
      .select()
      .single()

    if (error) {
      console.error("Supabase error saving quiz:", error)
      throw new Error(`Failed to save quiz: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error("Database error saving quiz:", error)
    throw new Error("Failed to save quiz to database")
  }
}

// 🔄 SUPABASE INTEGRATION: Get Quiz by ID
export async function getQuizById(quizId: string): Promise<Quiz | null> {
  try {
    const { data, error } = await supabase.from("quizzes").select("*").eq("id", quizId).single()

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned
        return null
      }
      console.error("Supabase error getting quiz:", error)
      throw new Error(`Failed to get quiz: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error("Database error getting quiz:", error)
    throw new Error("Failed to retrieve quiz from database")
  }
}

// 🔄 SUPABASE INTEGRATION: Save Quiz Submission
export async function saveQuizSubmission(submission: {
  quizId: string
  userId: number
  answers: string[]
  score: number
  totalQuestions: number
  feedback: string[]
  completedAt: string
}): Promise<Submission> {
  try {
    const submissionId = `submission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const { data, error } = await supabase
      .from("quiz_submissions")
      .insert({
        id: submissionId,
        quiz_id: submission.quizId,
        user_id: submission.userId,
        answers: submission.answers,
        score: submission.score,
        total_questions: submission.totalQuestions,
        feedback: submission.feedback,
      })
      .select()
      .single()

    if (error) {
      console.error("Supabase error saving submission:", error)
      throw new Error(`Failed to save submission: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error("Database error saving submission:", error)
    throw new Error("Failed to save quiz submission to database")
  }
}

// 🔄 SUPABASE INTEGRATION: Get Quiz History
export async function getQuizHistory(filters: {
  userId: number
  grade?: string | null
  subject?: string | null
  minMarks?: number
  maxMarks?: number
  from?: string | null
  to?: string | null
  page: number
  limit: number
}): Promise<{ data: any[]; total: number }> {
  try {
    let query = supabase
      .from("quiz_submissions")
      .select(`
        *,
        quizzes (
          id,
          title,
          subject,
          grade_level,
          difficulty
        )
      `)
      .eq("user_id", filters.userId)

    // Apply filters
    if (filters.subject) {
      query = query.ilike("quizzes.subject", `%${filters.subject}%`)
    }

    if (filters.grade) {
      query = query.eq("quizzes.grade_level", filters.grade)
    }

    if (filters.minMarks !== undefined) {
      query = query.gte("score", filters.minMarks)
    }

    if (filters.maxMarks !== undefined) {
      query = query.lte("score", filters.maxMarks)
    }

    if (filters.from) {
      const fromDate = parseDate(filters.from)
      query = query.gte("completed_at", fromDate.toISOString())
    }

    if (filters.to) {
      const toDate = parseDate(filters.to)
      toDate.setHours(23, 59, 59, 999)
      query = query.lte("completed_at", toDate.toISOString())
    }

    // Get total count
    const { count } = await supabase
      .from("quiz_submissions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", filters.userId)

    // Apply pagination and ordering
    const { data, error } = await query
      .order("completed_at", { ascending: false })
      .range((filters.page - 1) * filters.limit, filters.page * filters.limit - 1)

    if (error) {
      console.error("Supabase error getting quiz history:", error)
      throw new Error(`Failed to get quiz history: ${error.message}`)
    }

    // Transform data
    const enrichedData =
      data?.map((submission: any) => ({
        id: submission.id,
        quiz: {
          id: submission.quizzes?.id,
          title: submission.quizzes?.title,
          subject: submission.quizzes?.subject,
          gradeLevel: submission.quizzes?.grade_level,
          difficulty: submission.quizzes?.difficulty,
        },
        score: submission.score,
        totalQuestions: submission.total_questions,
        percentage: Math.round((submission.score / submission.total_questions) * 100),
        completedAt: submission.completed_at,
        feedback: submission.feedback,
      })) || []

    return {
      data: enrichedData,
      total: count || 0,
    }
  } catch (error) {
    console.error("Database error getting quiz history:", error)
    throw new Error("Failed to retrieve quiz history from database")
  }
}

// 🔄 SUPABASE INTEGRATION: Save Hint Request
export async function saveHintRequest(hintData: {
  quizId: string
  questionId: string
  userId: number
  hintText: string
}): Promise<void> {
  try {
    const { error } = await supabase.from("quiz_hints").insert({
      quiz_id: hintData.quizId,
      question_id: hintData.questionId,
      user_id: hintData.userId,
      hint_text: hintData.hintText,
    })

    if (error) {
      console.error("Supabase error saving hint request:", error)
      throw new Error(`Failed to save hint request: ${error.message}`)
    }
  } catch (error) {
    console.error("Database error saving hint request:", error)
    throw new Error("Failed to save hint request to database")
  }
}

// 🔄 SUPABASE INTEGRATION: Get User Stats
export async function getUserStats(userId: number): Promise<{
  totalQuizzes: number
  averageScore: number
  totalQuestions: number
  correctAnswers: number
}> {
  try {
    const { data, error } = await supabase
      .from("quiz_submissions")
      .select("score, total_questions")
      .eq("user_id", userId)

    if (error) {
      console.error("Supabase error getting user stats:", error)
      throw new Error(`Failed to get user stats: ${error.message}`)
    }

    if (!data || data.length === 0) {
      return {
        totalQuizzes: 0,
        averageScore: 0,
        totalQuestions: 0,
        correctAnswers: 0,
      }
    }

    const totalQuestions = data.reduce((sum, s) => sum + s.total_questions, 0)
    const correctAnswers = data.reduce((sum, s) => sum + s.score, 0)
    const averageScore = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0

    return {
      totalQuizzes: data.length,
      averageScore,
      totalQuestions,
      correctAnswers,
    }
  } catch (error) {
    console.error("Database error getting user stats:", error)
    throw new Error("Failed to retrieve user statistics from database")
  }
}

// Utility function to parse date string (DD/MM/YYYY)
function parseDate(dateString: string): Date {
  const [day, month, year] = dateString.split("/").map(Number)
  return new Date(year, month - 1, day)
}

// 🔄 SUPABASE INTEGRATION: Database connection health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase.from("users").select("count").limit(1)

    return !error
  } catch (error) {
    console.error("Database connection error:", error)
    return false
  }
}
