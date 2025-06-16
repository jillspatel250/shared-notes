import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { evaluateQuizWithAI } from "@/lib/ai"
import { saveQuizSubmission, getQuizById } from "@/lib/database"
import { sendResultEmail } from "@/lib/email"
import { validateQuizSubmission } from "@/lib/validation"

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyToken(request)
    if (!authResult.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    // Validate input
    const validation = validateQuizSubmission(body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { quizId, answers, studentEmail } = body

    // Get original quiz
    const quiz = await getQuizById(quizId)
    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
    }

    // Validate answers array length
    if (answers.length !== quiz.questions.length) {
      return NextResponse.json(
        {
          error: `Expected ${quiz.questions.length} answers, received ${answers.length}`,
        },
        { status: 400 },
      )
    }

    // Evaluate answers using AI
    const evaluation = await evaluateQuizWithAI(quiz, answers)

    // Save submission
    const submission = await saveQuizSubmission({
      quizId,
      userId: authResult.user.userId,
      answers,
      score: evaluation.score,
      totalQuestions: quiz.questions.length,
      feedback: evaluation.feedback,
      completedAt: new Date().toISOString(),
    })

    // Send email notification if email provided
    if (studentEmail) {
      try {
        await sendResultEmail({
          email: studentEmail,
          quiz,
          submission,
          evaluation,
        })
      } catch (emailError) {
        console.error("Email sending failed:", emailError)
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: "Quiz submitted successfully",
      submission: {
        id: submission.id,
        score: evaluation.score,
        totalQuestions: quiz.questions.length,
        percentage: Math.round((evaluation.score / quiz.questions.length) * 100),
        feedback: evaluation.feedback,
        suggestions: evaluation.suggestions,
        completedAt: submission.completedAt,
      },
    })
  } catch (error) {
    console.error("Quiz submission error:", error)
    return NextResponse.json({ error: "Failed to submit quiz" }, { status: 500 })
  }
}
