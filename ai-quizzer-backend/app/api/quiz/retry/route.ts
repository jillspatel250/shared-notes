import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { getQuizById } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyToken(request)
    if (!authResult.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { quizId } = body

    // Validation
    if (!quizId) {
      return NextResponse.json({ error: "Quiz ID is required" }, { status: 400 })
    }

    if (typeof quizId !== "string" || quizId.trim().length === 0) {
      return NextResponse.json({ error: "Invalid quiz ID format" }, { status: 400 })
    }

    // Get original quiz
    const quiz = await getQuizById(quizId)
    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
    }

    // Check if user has access to this quiz (optional security check)
    // In a more secure implementation, you might want to verify ownership

    // Create a new quiz instance for retry
    const retryQuiz = {
      ...quiz,
      id: `${quiz.id}_retry_${Date.now()}`,
      isRetry: true,
      originalQuizId: quiz.id,
      createdAt: new Date().toISOString(),
    }

    return NextResponse.json({
      success: true,
      message: "Quiz ready for retry",
      quiz: {
        id: retryQuiz.id,
        title: `${retryQuiz.title} (Retry)`,
        subject: retryQuiz.subject,
        gradeLevel: retryQuiz.gradeLevel,
        difficulty: retryQuiz.difficulty,
        questions: retryQuiz.questions.map((q: any) => ({
          id: q.id,
          question: q.question,
          options: q.options,
          type: q.type,
        })), // Remove correct answers for retry
        isRetry: true,
        originalQuizId: quiz.id,
        createdAt: retryQuiz.createdAt,
      },
    })
  } catch (error) {
    console.error("Quiz retry error:", error)
    return NextResponse.json({ error: "Failed to prepare quiz retry" }, { status: 500 })
  }
}
